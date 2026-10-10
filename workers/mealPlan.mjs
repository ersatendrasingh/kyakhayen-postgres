import axios from "axios";
import { Worker } from "bullmq";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

// Define Redis connection options
const connection = process.env.REDIS_URL
  ? { url: process.env.REDIS_URL }
  : {
      host: process.env.REDIS_SERVER_HOST || "127.0.0.1",
      port: parseInt(process.env.REDIS_SERVER_PORT || "6379"),
      ...(process.env.REDIS_SERVER_PASSWORD
        ? { password: process.env.REDIS_SERVER_PASSWORD }
        : {}),
      ...(process.env.REDIS_SERVER_TLS === "true" ? { tls: {} } : {}),
    };

const APP_URL =
  process.env.INTERNAL_APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";
const MEAL_PLAN_WORKER_SECRET =
  process.env.MEAL_PLAN_WORKER_SECRET ||
  (process.env.NODE_ENV !== "production" ? "local-meal-plan-worker" : "");
const parsedWorkerTimeoutMs = Number(
  process.env.MEAL_PLAN_WORKER_TIMEOUT_MS || 420000,
);
const WORKER_REQUEST_TIMEOUT_MS = Number.isFinite(parsedWorkerTimeoutMs)
  ? parsedWorkerTimeoutMs
  : 420000;
const TRAFFIC_SYNC_INTERVAL_MS = Number(
  process.env.TRAFFIC_NOTIFICATION_SYNC_INTERVAL_MS || 6 * 60 * 60 * 1000,
);
const STARTUP_TRAFFIC_SYNC_RETRY_DELAYS_MS = [2000, 10000, 30000];

if (!MEAL_PLAN_WORKER_SECRET) {
  console.error(
    "MEAL_PLAN_WORKER_SECRET is not configured; scheduled worker API calls will fail.",
  );
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function describeRequestError(error) {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const body =
        typeof error.response.data === "string"
          ? error.response.data
          : JSON.stringify(error.response.data);
      return `HTTP ${error.response.status}${body ? `: ${body}` : ""}`;
    }
    return error.code || error.message || "Request failed";
  }
  return error instanceof Error ? error.message : String(error);
}

async function syncTrafficNotificationSchedules() {
  if (!MEAL_PLAN_WORKER_SECRET) return false;
  try {
    const response = await axios.post(
      `${APP_URL}/api/push/traffic`,
      { kind: "sync" },
      {
        timeout: WORKER_REQUEST_TIMEOUT_MS,
        headers: {
          "x-meal-plan-worker-secret": MEAL_PLAN_WORKER_SECRET,
        },
      },
    );
    console.log(
      `Traffic notification schedules synced: ${response.data.scheduled || 0}/${response.data.total || 0}`,
    );
    return true;
  } catch (error) {
    const message = describeRequestError(error);
    console.error(`Traffic notification schedule sync failed: ${message}`);
    return false;
  }
}

async function syncTrafficNotificationSchedulesAfterStartup() {
  for (const delayMs of STARTUP_TRAFFIC_SYNC_RETRY_DELAYS_MS) {
    await wait(delayMs);
    const synced = await syncTrafficNotificationSchedules();
    if (synced) return;
  }
}

// Define the worker to process the queue
const worker = new Worker(
  "generateMealPlan",
  async (job) => {
    try {
      const isDeliveryJob = job.name === "deliverMealPlanDay";
      const isTrafficRecipeJob = job.name === "trafficRecipeNotification";
      const isPushAutomationJob =
        job.name === "mealReminder" ||
        job.name === "membershipExpiryReminder" ||
        isTrafficRecipeJob;
      const isCampaignJob = job.name === "sendNotificationCampaign";
      const isContentPipelineJob = job.name === "publishContentPipelinePost";
      console.log(
        `Starting job ${job.id}: ${isContentPipelineJob ? "Publishing scheduled content" : isDeliveryJob ? "Delivering meal plan day" : isTrafficRecipeJob ? "Sending traffic recipe push" : isPushAutomationJob ? "Sending automated push" : isCampaignJob ? "Sending scheduled campaign" : "Generating meal plan"}`,
      );

      // Update progress to 10%
      await job.updateProgress({
        percentage: 5,
        message: isContentPipelineJob
          ? "Preparing scheduled content publish"
          : isCampaignJob
            ? "Preparing scheduled broadcast"
            : isTrafficRecipeJob
              ? "Preparing traffic recipe notification"
              : isPushAutomationJob
                ? "Preparing reminder notification"
                : isDeliveryJob
                  ? "Preparing daily meal-plan delivery"
                  : "Starting your personalized meal plan",
      });

      const endpoint = isContentPipelineJob
        ? "/api/admin/content-pipeline/dispatch"
        : isCampaignJob
          ? "/api/push/dispatch"
          : isTrafficRecipeJob
            ? "/api/push/traffic"
            : isPushAutomationJob
              ? "/api/push/automation"
              : isDeliveryJob
                ? "/api/deliver-meal-plan-day"
                : "/api/generate-meal-plan";
      const body = isContentPipelineJob
        ? { kind: "scheduledPost", postId: job.data.postId }
        : isCampaignJob
          ? { campaignId: job.data.campaignId }
          : isTrafficRecipeJob
            ? {
                kind: "trafficRecipe",
                ruleId: job.data.ruleId,
                scheduledFor: job.data.scheduledFor,
              }
            : isPushAutomationJob
              ? { ...job.data, kind: job.name }
              : isDeliveryJob
                ? { userId: job.data.userId, date: job.data.date }
                : { userId: job.data.userId, jobId: job.id };
      const response = await axios.post(`${APP_URL}${endpoint}`, body, {
        timeout: WORKER_REQUEST_TIMEOUT_MS,
        headers: {
          "x-meal-plan-worker-secret": MEAL_PLAN_WORKER_SECRET,
        },
      });

      await job.updateProgress({
        percentage: 100,
        message: isContentPipelineJob
          ? "Scheduled content publish completed"
          : isCampaignJob
            ? "Scheduled broadcast delivered"
            : isTrafficRecipeJob
              ? "Traffic recipe notification processed"
              : isPushAutomationJob
                ? "Reminder notification delivered"
                : isDeliveryJob
                  ? "Daily meal-plan PDF delivered"
                  : "Your meal plan is ready",
      });
      console.log(`Job ${job.id}: Progress 100% - complete`);

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Job ${job.id} failed during processing: ${message}`);
      throw error; // Re-throw the error to mark the job as failed
    }
  },
  {
    connection,
    lockDuration: WORKER_REQUEST_TIMEOUT_MS + 60000,
    stalledInterval: 30000,
    maxStalledCount: 1,
  },
);

// Event listener for when the job is completed
worker.on("completed", (job, returnvalue) => {
  const result =
    typeof returnvalue === "string" ? returnvalue : JSON.stringify(returnvalue);
  console.log(`Job ${job.id} completed successfully with result: ${result}`);
});

// Event listener for when the job fails
worker.on("failed", (job, error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Job ${job?.id} failed: ${message}`);
});

// Event listener for logging worker errors
worker.on("error", (error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Worker encountered an error: ${message}`);
});

void syncTrafficNotificationSchedulesAfterStartup();
const trafficSyncTimer = setInterval(
  () => void syncTrafficNotificationSchedules(),
  Number.isFinite(TRAFFIC_SYNC_INTERVAL_MS)
    ? TRAFFIC_SYNC_INTERVAL_MS
    : 6 * 60 * 60 * 1000,
);
trafficSyncTimer.unref?.();

console.log("Worker started");
