import { NotificationAutomationTrigger } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import {
  scheduleTrafficNotificationRule,
  syncTrafficNotificationSchedules,
} from "@/lib/meal-plan-queue";
import { runTrafficRecipeNotificationRule } from "@/lib/traffic-notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const requestSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("trafficRecipe"),
    ruleId: z.string().min(1),
    scheduledFor: z.string().datetime().optional(),
  }),
  z.object({
    kind: z.literal("sync"),
  }),
]);

async function rescheduleRule(ruleId: string) {
  const rule = await db.notificationAutomationRule.findUnique({ where: { id: ruleId } });
  if (
    rule &&
    rule.isActive &&
    rule.trigger === NotificationAutomationTrigger.TRAFFIC_RECIPE
  ) {
    await scheduleTrafficNotificationRule(rule);
  }
}

export async function POST(request: Request) {
  const workerSecret =
    process.env.MEAL_PLAN_WORKER_SECRET ||
    (process.env.NODE_ENV !== "production" ? "local-meal-plan-worker" : "");
  if (!workerSecret || request.headers.get("x-meal-plan-worker-secret") !== workerSecret) {
    return NextResponse.json("Unauthorized", { status: 401 });
  }

  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json("Invalid traffic notification request.", { status: 400 });

  if (parsed.data.kind === "sync") {
    return NextResponse.json(await syncTrafficNotificationSchedules());
  }

  try {
    return NextResponse.json(
      await runTrafficRecipeNotificationRule(parsed.data.ruleId, parsed.data.scheduledFor),
    );
  } finally {
    await rescheduleRule(parsed.data.ruleId);
  }
}
