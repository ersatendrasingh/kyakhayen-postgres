import { NotificationAudience, NotificationSource } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { currentUser } from "@/lib/auth";
import { scheduleNotificationCampaign } from "@/lib/meal-plan-queue";
import { createNotificationCampaign, sendNotificationCampaign } from "@/lib/notifications";
import { getVerifiedPublicMediaKey } from "@/lib/s3utils";

const destinationSchema = z
  .string()
  .trim()
  .max(512)
  .refine(
    (value) => !value || value.startsWith("/") || value.startsWith("https://"),
    "Destination must be an internal path or HTTPS URL.",
  );

const campaignSchema = z
  .object({
    audience: z.nativeEnum(NotificationAudience),
    userId: z.string().trim().optional().nullable(),
    segmentType: z.enum(["FOOD_STYLE", "CUISINE"]).optional().nullable(),
    segmentId: z.string().trim().optional().nullable(),
    title: z.string().trim().min(3).max(120),
    body: z.string().trim().min(3).max(300),
    url: destinationSchema.optional().nullable(),
    imageUrl: z.string().trim().url().max(512).optional().nullable().or(z.literal("")),
    scheduledAt: z.string().datetime().optional().nullable().or(z.literal("")),
  })
  .refine((value) => value.audience !== NotificationAudience.USER || Boolean(value.userId), {
    message: "Choose a customer for targeted notification.",
  })
  .refine(
    (value) => value.audience !== NotificationAudience.PREFERENCE_SEGMENT || Boolean(value.segmentType && value.segmentId),
    { message: "Choose a preference segment." },
  );

export async function POST(request: Request) {
  const admin = await currentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json("Unauthorized", { status: 401 });
  }

  const parsed = campaignSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(parsed.error.issues[0]?.message || "Invalid campaign.", { status: 400 });
  }

  const input = parsed.data;
  if (input.imageUrl) {
    try {
      getVerifiedPublicMediaKey(input.imageUrl);
    } catch {
      return NextResponse.json("Select the notification image from the media library.", { status: 400 });
    }
  }

  const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
  if (scheduledAt && scheduledAt <= new Date()) {
    return NextResponse.json("Schedule time must be in the future.", { status: 400 });
  }
  const campaign = await createNotificationCampaign({
    title: input.title,
    body: input.body,
    url: input.url || "/",
    imageUrl: input.imageUrl || null,
    audience: input.audience,
    targetUserId: input.audience === NotificationAudience.USER ? input.userId : null,
    segmentType: input.audience === NotificationAudience.PREFERENCE_SEGMENT ? input.segmentType : null,
    segmentId: input.audience === NotificationAudience.PREFERENCE_SEGMENT ? input.segmentId : null,
    source:
      input.audience === NotificationAudience.USER
        ? NotificationSource.ADMIN_TARGETED
        : input.audience === NotificationAudience.PREFERENCE_SEGMENT
          ? NotificationSource.PREFERENCE_PROMOTION
          : NotificationSource.ADMIN_BROADCAST,
    scheduledAt,
    createdById: admin.id,
    createdByName: admin.name || admin.email || "Admin",
  });

  try {
    if (scheduledAt) {
      await scheduleNotificationCampaign(campaign.id, scheduledAt);
      return NextResponse.json(campaign);
    }
    return NextResponse.json(await sendNotificationCampaign(campaign.id));
  } catch (error) {
    return NextResponse.json(
      error instanceof Error ? error.message : "Unable to schedule or send push campaign.",
      { status: 500 },
    );
  }
}
