import { NextResponse } from "next/server";
import { generateMealPlan } from "@/actions/generate-meal-plan";
import { getMealPlanQueue } from "@/lib/meal-plan-queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const workerSecret =
      process.env.MEAL_PLAN_WORKER_SECRET ||
      (process.env.NODE_ENV !== "production" ? "local-meal-plan-worker" : "");
    const requestSecret = request.headers.get("x-meal-plan-worker-secret");
    if (!workerSecret) {
      return NextResponse.json("Meal plan worker is not configured", {
        status: 503,
      });
    }
    if (requestSecret !== workerSecret) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const { userId, jobId } = await request.json();

    if (!userId || !jobId) {
      return NextResponse.json(
        { error: "UserId and jobId are required" },
        { status: 400 }
      );
    }

    const queue = getMealPlanQueue();
    try {
      const job = await queue.getJob(jobId);
      if (!job || job.data.userId !== userId) {
        return NextResponse.json("Generation job not found", { status: 404 });
      }

      await generateMealPlan(userId, async (percentage, message) => {
        await job.updateProgress({ percentage, message });
      });
    } finally {
      await queue.close();
    }
    return NextResponse.json("Meal plan generated", { status: 200 });
  } catch (error) {
    console.log("[GENERATE_MEAL_PLAN]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
