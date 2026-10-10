import { NextResponse } from "next/server";
import { z } from "zod";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { contentPipelineApiError, parseRequestJson } from "@/lib/content-pipeline/api-error";
import {
  CONTENT_PIPELINE_SIMPLE_PLATFORMS,
  ensureContentPipelineSchedulingSchema,
  getContentPipelineScheduleState,
  scheduleNextAutomationPost,
} from "@/lib/content-pipeline/scheduling";
import { contentPlatformSchema } from "@/lib/content-pipeline/publish-schema";

const simplePlatformSet = new Set(CONTENT_PIPELINE_SIMPLE_PLATFORMS);

const automationRuleSchema = z.object({
  name: z.string().trim().min(3).max(80),
  platforms: z
    .array(contentPlatformSchema)
    .min(1)
    .max(CONTENT_PIPELINE_SIMPLE_PLATFORMS.length)
    .refine((platforms) => platforms.every((platform) => simplePlatformSet.has(platform)), {
      message: "Automation can only use non-video post platforms.",
    }),
  timeSlots: z
    .array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm time format."))
    .min(1)
    .max(8),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).max(7).optional().default([]),
  isActive: z.boolean().optional().default(true),
});

export async function GET() {
  const admin = await currentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json("Unauthorized", { status: 401 });
  }

  return NextResponse.json(await getContentPipelineScheduleState());
}

export async function POST(request: Request) {
  const admin = await currentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json("Unauthorized", { status: 401 });
  }

  const parsed = automationRuleSchema.safeParse(await parseRequestJson(request));
  if (!parsed.success) {
    return NextResponse.json(parsed.error.issues[0]?.message || "Invalid automation rule.", {
      status: 400,
    });
  }

  try {
    await ensureContentPipelineSchedulingSchema();
    const input = parsed.data;
    const rule = await db.contentPipelineAutomationRule.create({
      data: {
        name: input.name,
        isActive: input.isActive,
        platforms: Array.from(new Set(input.platforms)),
        timeSlots: Array.from(new Set(input.timeSlots)).sort(),
        daysOfWeek: Array.from(new Set(input.daysOfWeek)).sort(),
        timezone: "Asia/Kolkata",
        createdById: admin.id,
        createdByName: admin.name || admin.email || "Admin",
      },
    });

    if (rule.isActive) {
      await scheduleNextAutomationPost(rule.id);
    }

    return NextResponse.json(await getContentPipelineScheduleState());
  } catch (error) {
    return contentPipelineApiError(error, "Unable to create automation rule.");
  }
}
