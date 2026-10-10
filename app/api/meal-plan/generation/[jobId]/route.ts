import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { getMealPlanQueue } from "@/lib/meal-plan-queue";

const generationStallLimitMs = 5 * 60 * 1000;
const earlyProgressCutoff = 20;
const stallWatchedStates = new Set(["active", "waiting", "delayed"]);

export async function GET(
  _request: Request,
  props: { params: Promise<{ jobId: string }> },
) {
  const user = await currentUser();
  if (!user) return NextResponse.json("Unauthorized", { status: 401 });

  const { jobId } = await props.params;
  const queue = getMealPlanQueue();

  try {
    const job = await queue.getJob(jobId);
    if (!job || job.data.userId !== user.id) {
      return NextResponse.json("Generation job not found", { status: 404 });
    }

    const state = await job.getState();
    const rawProgress =
      typeof job.progress === "object" && job.progress !== null
        ? (job.progress as { percentage?: unknown; message?: unknown })
        : null;
    const progress =
      typeof job.progress === "number"
        ? { percentage: job.progress, message: "Preparing your meal plan" }
        : {
            percentage:
              typeof rawProgress?.percentage === "number"
                ? rawProgress.percentage
                : 0,
            message:
              typeof rawProgress?.message === "string"
                ? rawProgress.message
                : "Preparing your meal plan",
          };

    const startedAt =
      typeof job.processedOn === "number"
        ? job.processedOn
        : typeof job.timestamp === "number"
          ? job.timestamp
          : Date.now();
    const stalled =
      job.name === "generateMealPlan" &&
      stallWatchedStates.has(state) &&
      Date.now() - startedAt > generationStallLimitMs &&
      progress.percentage <= earlyProgressCutoff;
    const responseState = stalled ? "stalled" : state;
    const stalledMessage =
      "Meal plan generation is taking too long. Please try again.";

    return NextResponse.json({
      state: responseState,
      percentage: state === "completed" ? 100 : progress.percentage,
      message:
        state === "completed"
          ? "Your meal plan is ready"
          : stalled
            ? stalledMessage
            : progress.message,
      error:
        state === "failed" ? job.failedReason : stalled ? stalledMessage : null,
    });
  } finally {
    await queue.close();
  }
}
