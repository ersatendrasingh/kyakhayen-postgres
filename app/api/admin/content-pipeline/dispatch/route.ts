import { NextResponse } from "next/server";
import { z } from "zod";

import { parseRequestJson } from "@/lib/content-pipeline/api-error";
import { runScheduledContentPost } from "@/lib/content-pipeline/scheduling";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const requestSchema = z.object({
  kind: z.literal("scheduledPost"),
  postId: z.string().min(1),
});

function isWorkerRequest(request: Request) {
  const workerSecret =
    process.env.MEAL_PLAN_WORKER_SECRET ||
    (process.env.NODE_ENV !== "production" ? "local-meal-plan-worker" : "");
  return Boolean(workerSecret && request.headers.get("x-meal-plan-worker-secret") === workerSecret);
}

export async function POST(request: Request) {
  if (!isWorkerRequest(request)) {
    return NextResponse.json("Unauthorized", { status: 401 });
  }

  const parsed = requestSchema.safeParse(await parseRequestJson(request));
  if (!parsed.success) return NextResponse.json("Invalid content dispatch request.", { status: 400 });

  try {
    return NextResponse.json(await runScheduledContentPost(parsed.data.postId));
  } catch (error) {
    return NextResponse.json(
      error instanceof Error ? error.message : "Unable to dispatch scheduled content.",
      { status: 500 }
    );
  }
}
