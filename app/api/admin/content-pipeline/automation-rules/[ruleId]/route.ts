import { ContentPipelineScheduleStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { contentPipelineApiError, parseRequestJson } from "@/lib/content-pipeline/api-error";
import {
  CONTENT_PIPELINE_SIMPLE_PLATFORMS,
  ensureContentPipelineSchedulingSchema,
  getContentPipelineScheduleState,
  platformArray,
  scheduleNextAutomationPost,
  timeSlotArray,
  dayArray,
} from "@/lib/content-pipeline/scheduling";
import { contentPlatformSchema } from "@/lib/content-pipeline/publish-schema";

const simplePlatformSet = new Set(CONTENT_PIPELINE_SIMPLE_PLATFORMS);

const updateRuleSchema = z.object({
  name: z.string().trim().min(3).max(80).optional(),
  platforms: z
    .array(contentPlatformSchema)
    .min(1)
    .max(CONTENT_PIPELINE_SIMPLE_PLATFORMS.length)
    .refine((platforms) => platforms.every((platform) => simplePlatformSet.has(platform)), {
      message: "Automation can only use non-video post platforms.",
    })
    .optional(),
  timeSlots: z
    .array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm time format."))
    .min(1)
    .max(8)
    .optional(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).max(7).optional(),
  isActive: z.boolean().optional(),
});

async function cancelFutureRulePosts(ruleId: string, reason: string) {
  await db.contentPipelineScheduledPost.updateMany({
    where: {
      automationRuleId: ruleId,
      status: ContentPipelineScheduleStatus.SCHEDULED,
      scheduledAt: { gt: new Date() },
    },
    data: {
      status: ContentPipelineScheduleStatus.CANCELLED,
      lastError: reason,
    },
  });
}

export async function PATCH(request: Request, props: { params: Promise<{ ruleId: string }> }) {
  const admin = await currentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json("Unauthorized", { status: 401 });
  }

  const parsed = updateRuleSchema.safeParse(await parseRequestJson(request));
  if (!parsed.success) {
    return NextResponse.json(parsed.error.issues[0]?.message || "Invalid automation update.", {
      status: 400,
    });
  }

  try {
    await ensureContentPipelineSchedulingSchema();
    const { ruleId } = await props.params;
    const existing = await db.contentPipelineAutomationRule.findUnique({ where: { id: ruleId } });
    if (!existing) return NextResponse.json("Automation rule not found.", { status: 404 });

    const input = parsed.data;
    const platforms = input.platforms
      ? Array.from(new Set(input.platforms))
      : platformArray(existing.platforms);
    const timeSlots = input.timeSlots
      ? Array.from(new Set(input.timeSlots)).sort()
      : timeSlotArray(existing.timeSlots);
    const daysOfWeek =
      input.daysOfWeek !== undefined
        ? Array.from(new Set(input.daysOfWeek)).sort()
        : dayArray(existing.daysOfWeek);
    const isActive = input.isActive ?? existing.isActive;
    const scheduleChanged =
      input.platforms !== undefined ||
      input.timeSlots !== undefined ||
      input.daysOfWeek !== undefined ||
      input.isActive !== undefined;

    const rule = await db.contentPipelineAutomationRule.update({
      where: { id: ruleId },
      data: {
        name: input.name ?? existing.name,
        isActive,
        platforms,
        timeSlots,
        daysOfWeek,
      },
    });

    if (scheduleChanged) {
      await cancelFutureRulePosts(rule.id, "Automation rule changed.");
    }
    if (rule.isActive) {
      await scheduleNextAutomationPost(rule.id);
    }

    return NextResponse.json(await getContentPipelineScheduleState());
  } catch (error) {
    return contentPipelineApiError(error, "Unable to update automation rule.");
  }
}

export async function DELETE(_request: Request, props: { params: Promise<{ ruleId: string }> }) {
  const admin = await currentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json("Unauthorized", { status: 401 });
  }

  try {
    await ensureContentPipelineSchedulingSchema();
    const { ruleId } = await props.params;
    const existing = await db.contentPipelineAutomationRule.findUnique({ where: { id: ruleId } });
    if (!existing) return NextResponse.json("Automation rule not found.", { status: 404 });

    await cancelFutureRulePosts(ruleId, "Automation rule deleted.");
    await db.contentPipelineAutomationRule.delete({ where: { id: ruleId } });
    return NextResponse.json(await getContentPipelineScheduleState());
  } catch (error) {
    return contentPipelineApiError(error, "Unable to delete automation rule.");
  }
}
