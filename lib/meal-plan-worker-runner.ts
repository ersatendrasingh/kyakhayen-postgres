import axios from "axios";
import { Worker, type Job } from "bullmq";

import { getRedisConnection } from "@/lib/redis-connection";
import { getWorkerSecret } from "@/lib/worker-auth";

const QUEUE_NAME = "generateMealPlan";
const DEFAULT_WORKER_REQUEST_TIMEOUT_MS = 240000;
const DEFAULT_CRON_RUN_WINDOW_MS = 240000;

type CronWorkerResult = {
  processed: number;
  failed: number;
  errors: string[];
  timedOut: boolean;
};

function numericEnv(name: string, fallback: number) {
  const parsed = Number(process.env[name] || fallback);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function describeRequestError(error: unknown) {
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

async function processMealPlanQueueJob(job: Job, appUrl: string) {
  const workerSecret = getWorkerSecret();
  if (!workerSecret) {
    throw new Error("MEAL_PLAN_WORKER_SECRET is not configured.");
  }

  const isDeliveryJob = job.name === "deliverMealPlanDay";
  const isTrafficRecipeJob = job.name === "trafficRecipeNotification";
  const isPushAutomationJob =
    job.name === "mealReminder" ||
    job.name === "membershipExpiryReminder" ||
    isTrafficRecipeJob;
  const isCampaignJob = job.name === "sendNotificationCampaign";
  const isContentPipelineJob = job.name === "publishContentPipelinePost";

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

  const response = await axios.post(`${appUrl}${endpoint}`, body, {
    timeout: numericEnv(
      "MEAL_PLAN_WORKER_TIMEOUT_MS",
      DEFAULT_WORKER_REQUEST_TIMEOUT_MS,
    ),
    headers: {
      "x-meal-plan-worker-secret": workerSecret,
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

  return response.data;
}

export async function runMealPlanQueueForCron(appUrl: string) {
  const runWindowMs = numericEnv(
    "VERCEL_WORKER_CRON_TIMEOUT_MS",
    DEFAULT_CRON_RUN_WINDOW_MS,
  );
  const result: CronWorkerResult = {
    processed: 0,
    failed: 0,
    errors: [],
    timedOut: false,
  };

  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      result.processed += 1;
      return processMealPlanQueueJob(job, appUrl);
    },
    {
      connection: getRedisConnection(),
      autorun: false,
      concurrency: Number(process.env.VERCEL_WORKER_CONCURRENCY || 1),
      lockDuration:
        numericEnv("MEAL_PLAN_WORKER_TIMEOUT_MS", DEFAULT_WORKER_REQUEST_TIMEOUT_MS) +
        60000,
      stalledInterval: 30000,
      maxStalledCount: 1,
    },
  );

  worker.on("failed", (_job, error) => {
    result.failed += 1;
    result.errors.push(describeRequestError(error));
  });
  worker.on("error", (error) => {
    result.errors.push(describeRequestError(error));
  });

  let settleTimer: ReturnType<typeof setTimeout> | undefined;
  const drained = new Promise<void>((resolve) => {
    worker.once("drained", () => {
      settleTimer = setTimeout(resolve, 1000);
    });
  });
  const timeout = new Promise<void>((resolve) => {
    setTimeout(() => {
      result.timedOut = true;
      resolve();
    }, runWindowMs);
  });

  const running = worker.run().catch((error) => {
    result.errors.push(describeRequestError(error));
  });

  await Promise.race([drained, timeout]);
  if (settleTimer) clearTimeout(settleTimer);
  await worker.close();
  await running;

  return result;
}
