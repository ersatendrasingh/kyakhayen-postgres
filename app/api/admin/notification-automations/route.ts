import {
  NotificationAudience,
  NotificationAutomationTrigger,
  NotificationSource,
} from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { scheduleTrafficNotificationRule } from "@/lib/meal-plan-queue";
import { getVerifiedPublicMediaKey } from "@/lib/s3utils";

const daysOfWeekSchema = z
  .union([
    z.array(z.number().int().min(0).max(6)).min(1),
    z.string().trim().max(32),
  ])
  .optional()
  .nullable();

const ruleSchema = z.object({
  name: z.string().trim().min(3).max(80),
  trigger: z.nativeEnum(NotificationAutomationTrigger),
  audience: z.nativeEnum(NotificationAudience).optional().nullable(),
  segmentType: z.enum(["FOOD_STYLE", "CUISINE"]).optional().nullable(),
  segmentId: z.string().trim().optional().nullable(),
  titleTemplate: z.string().trim().min(3).max(120),
  bodyTemplate: z.string().trim().min(3).max(300),
  urlTemplate: z
    .string()
    .trim()
    .max(512)
    .refine((value) => !value || value.startsWith("/") || value.startsWith("https://"), "Open link must be an internal path or HTTPS URL.")
    .optional()
    .nullable(),
  imageUrl: z.string().trim().url().max(512).optional().nullable().or(z.literal("")),
  scheduleTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional().nullable().or(z.literal("")),
  timezone: z.string().trim().min(3).max(64).optional().nullable(),
  daysOfWeek: daysOfWeekSchema,
  mealTimeId: z.string().trim().optional().nullable().or(z.literal("")),
});

function sourceForTrigger(trigger: NotificationAutomationTrigger) {
  if (trigger === NotificationAutomationTrigger.RECIPE_PUBLISHED) return NotificationSource.PREFERENCE_PROMOTION;
  if (trigger === NotificationAutomationTrigger.TRAFFIC_RECIPE) return NotificationSource.TRAFFIC_RECIPE;
  return NotificationSource[trigger];
}

function serializeDaysOfWeek(daysOfWeek: z.infer<typeof daysOfWeekSchema>) {
  if (Array.isArray(daysOfWeek)) return Array.from(new Set(daysOfWeek)).sort().join(",");
  return daysOfWeek?.trim() || "0,1,2,3,4,5,6";
}

export async function POST(request: Request) {
  const admin = await currentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json("Unauthorized", { status: 401 });
  }

  const parsed = ruleSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(parsed.error.issues[0]?.message || "Invalid automation rule.", { status: 400 });
  }
  const input = parsed.data;
  const isRecipeRule = input.trigger === NotificationAutomationTrigger.RECIPE_PUBLISHED;
  const isTrafficRule = input.trigger === NotificationAutomationTrigger.TRAFFIC_RECIPE;
  if (isRecipeRule && (!input.segmentType || !input.segmentId)) {
    return NextResponse.json("Choose which recipe preference should trigger this automation.", { status: 400 });
  }
  if (isTrafficRule && !input.scheduleTime) {
    return NextResponse.json("Choose the time when this traffic notification should run.", { status: 400 });
  }
  if (
    isTrafficRule &&
    input.audience === NotificationAudience.PREFERENCE_SEGMENT &&
    (!input.segmentType || !input.segmentId)
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

  const rule = await db.notificationAutomationRule.create({
    data: {
      name: input.name,
      trigger: input.trigger,
      source: sourceForTrigger(input.trigger),
      audience: isRecipeRule
        ? NotificationAudience.PREFERENCE_SEGMENT
        : isTrafficRule
          ? input.audience || NotificationAudience.ALL_SUBSCRIBERS
          : NotificationAudience.USER,
      segmentType: isRecipeRule || input.audience === NotificationAudience.PREFERENCE_SEGMENT ? input.segmentType : null,
      segmentId: isRecipeRule || input.audience === NotificationAudience.PREFERENCE_SEGMENT ? input.segmentId : null,
      titleTemplate: input.titleTemplate,
      bodyTemplate: input.bodyTemplate,
      urlTemplate: input.urlTemplate || "/",
      imageUrl: input.imageUrl || null,
      scheduleTime: isTrafficRule ? input.scheduleTime || null : null,
      timezone: isTrafficRule ? input.timezone || "Asia/Kolkata" : "Asia/Kolkata",
      daysOfWeek: isTrafficRule ? serializeDaysOfWeek(input.daysOfWeek) : null,
      mealTimeId: isTrafficRule ? input.mealTimeId || null : null,
      createdById: admin.id,
      createdByName: admin.name || admin.email || "Admin",
    },
  });

  if (isTrafficRule) await scheduleTrafficNotificationRule(rule);
  return NextResponse.json(rule);
}
