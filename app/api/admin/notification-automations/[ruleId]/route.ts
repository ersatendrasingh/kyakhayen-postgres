import { NotificationAudience, NotificationAutomationTrigger, NotificationSource } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { removeTrafficNotificationRuleSchedule, scheduleTrafficNotificationRule } from "@/lib/meal-plan-queue";
import { getVerifiedPublicMediaKey } from "@/lib/s3utils";

const daysOfWeekSchema = z
  .union([
    z.array(z.number().int().min(0).max(6)).min(1),
    z.string().trim().max(32),
  ])
  .nullable()
  .optional();

const updateSchema = z.object({
  isActive: z.boolean().optional(),
  name: z.string().trim().min(3).max(80).optional(),
  trigger: z.nativeEnum(NotificationAutomationTrigger).optional(),
  audience: z.nativeEnum(NotificationAudience).nullable().optional(),
  segmentType: z.enum(["FOOD_STYLE", "CUISINE"]).nullable().optional(),
  segmentId: z.string().trim().nullable().optional(),
  titleTemplate: z.string().trim().min(3).max(120).optional(),
  bodyTemplate: z.string().trim().min(3).max(300).optional(),
  urlTemplate: z
    .string()
    .trim()
    .max(512)
    .refine((value) => !value || value.startsWith("/") || value.startsWith("https://"), "Open link must be an internal path or HTTPS URL.")
    .nullable()
    .optional(),
  imageUrl: z.string().trim().url().max(512).nullable().optional().or(z.literal("")),
  scheduleTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional().or(z.literal("")),
  timezone: z.string().trim().min(3).max(64).nullable().optional(),
  daysOfWeek: daysOfWeekSchema,
  mealTimeId: z.string().trim().nullable().optional().or(z.literal("")),
});

function sourceForTrigger(trigger: NotificationAutomationTrigger) {
  if (trigger === NotificationAutomationTrigger.RECIPE_PUBLISHED) return NotificationSource.PREFERENCE_PROMOTION;
  if (trigger === NotificationAutomationTrigger.TRAFFIC_RECIPE) return NotificationSource.TRAFFIC_RECIPE;
  return NotificationSource[trigger];
}

function serializeDaysOfWeek(daysOfWeek: z.infer<typeof daysOfWeekSchema>, fallback: string | null) {
  if (Array.isArray(daysOfWeek)) return Array.from(new Set(daysOfWeek)).sort().join(",");
  if (typeof daysOfWeek === "string") return daysOfWeek.trim() || "0,1,2,3,4,5,6";
  if (daysOfWeek === null) return null;
  return fallback || "0,1,2,3,4,5,6";
}

export async function PATCH(request: Request, props: { params: Promise<{ ruleId: string }> }) {
  const admin = await currentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json("Unauthorized", { status: 401 });
  }
  const { ruleId } = await props.params;
  const existing = await db.notificationAutomationRule.findUnique({ where: { id: ruleId } });
  if (!existing) return NextResponse.json("Automation rule not found.", { status: 404 });

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(parsed.error.issues[0]?.message || "Invalid automation update.", { status: 400 });
  }
  const input = parsed.data;
  const trigger = input.trigger || existing.trigger;
  const audience = input.audience === undefined ? existing.audience : input.audience;
  const segmentType = input.segmentType === undefined ? existing.segmentType : input.segmentType;
  const segmentId = input.segmentId === undefined ? existing.segmentId : input.segmentId;
  const scheduleTime = input.scheduleTime === undefined ? existing.scheduleTime : input.scheduleTime;
  const isRecipeRule = trigger === NotificationAutomationTrigger.RECIPE_PUBLISHED;
  const isTrafficRule = trigger === NotificationAutomationTrigger.TRAFFIC_RECIPE;
  if (isRecipeRule && (!segmentType || !segmentId)) {
    return NextResponse.json("Choose which recipe preference should trigger this automation.", { status: 400 });
  }
  if (isTrafficRule && !scheduleTime) {
    return NextResponse.json("Choose the time when this traffic notification should run.", { status: 400 });
  }
  if (
    isTrafficRule &&
    audience === NotificationAudience.PREFERENCE_SEGMENT &&
    (!segmentType || !segmentId)
  ) {
    return NextResponse.json("Choose the preference segment for this traffic notification.", { status: 400 });
  }
  if (input.imageUrl) {
    try {
      getVerifiedPublicMediaKey(input.imageUrl);
    } catch {
      return NextResponse.json("Select the notification image from the media library.", { status: 400 });
    }
  }

  const updated = await db.notificationAutomationRule.update({
    where: { id: ruleId },
    data: {
      isActive: input.isActive,
      name: input.name,
      trigger,
      source: sourceForTrigger(trigger),
      audience: isRecipeRule
        ? NotificationAudience.PREFERENCE_SEGMENT
        : isTrafficRule
          ? audience || NotificationAudience.ALL_SUBSCRIBERS
          : NotificationAudience.USER,
      segmentType:
        isRecipeRule || (isTrafficRule && audience === NotificationAudience.PREFERENCE_SEGMENT)
          ? segmentType
          : null,
      segmentId:
        isRecipeRule || (isTrafficRule && audience === NotificationAudience.PREFERENCE_SEGMENT)
          ? segmentId
          : null,
      titleTemplate: input.titleTemplate,
      bodyTemplate: input.bodyTemplate,
      urlTemplate: input.urlTemplate,
      imageUrl: input.imageUrl === "" ? null : input.imageUrl,
      scheduleTime: isTrafficRule ? scheduleTime || null : null,
      timezone: isTrafficRule ? input.timezone || existing.timezone || "Asia/Kolkata" : "Asia/Kolkata",
      daysOfWeek: isTrafficRule ? serializeDaysOfWeek(input.daysOfWeek, existing.daysOfWeek) : null,
      mealTimeId: isTrafficRule ? input.mealTimeId === "" ? null : input.mealTimeId ?? existing.mealTimeId : null,
    },
  });

  if (isTrafficRule && updated.isActive) {
    await scheduleTrafficNotificationRule({ ...updated, nextRunAt: existing.nextRunAt });
  } else if (existing.trigger === NotificationAutomationTrigger.TRAFFIC_RECIPE || isTrafficRule) {
    await removeTrafficNotificationRuleSchedule(existing.id, existing.nextRunAt);
  }

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, props: { params: Promise<{ ruleId: string }> }) {
  const admin = await currentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json("Unauthorized", { status: 401 });
  }
  const { ruleId } = await props.params;
  const rule = await db.notificationAutomationRule.findUnique({ where: { id: ruleId } });
  if (!rule) return NextResponse.json("Automation rule not found.", { status: 404 });
  if (rule.isSystem) return NextResponse.json("Built-in automation rules can be paused, not deleted.", { status: 400 });
  if (rule.trigger === NotificationAutomationTrigger.TRAFFIC_RECIPE) {
    await removeTrafficNotificationRuleSchedule(rule.id, rule.nextRunAt);
  }
  await db.notificationAutomationRule.delete({ where: { id: ruleId } });
  return NextResponse.json({ deleted: true });
}
