import { NextResponse } from "next/server";
import { z } from "zod";

import { sendNotificationCampaign } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const requestSchema = z.object({ campaignId: z.string().min(1) });

export async function POST(request: Request) {
  const workerSecret =
    process.env.MEAL_PLAN_WORKER_SECRET ||
    (process.env.NODE_ENV !== "production" ? "local-meal-plan-worker" : "");
  if (!workerSecret || request.headers.get("x-meal-plan-worker-secret") !== workerSecret) {
    return NextResponse.json("Unauthorized", { status: 401 });
  }
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json("Invalid campaign request.", { status: 400 });

  const campaign = await sendNotificationCampaign(parsed.data.campaignId);
  return NextResponse.json(campaign);
}
