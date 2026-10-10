import { NextResponse } from "next/server";
import { z } from "zod";

import { currentUser } from "@/lib/auth";
import { contentPipelineApiError, parseRequestJson } from "@/lib/content-pipeline/api-error";
import {
  createScheduledContentPost,
  getContentPipelineScheduleState,
} from "@/lib/content-pipeline/scheduling";
import { contentPublishSchema } from "@/lib/content-pipeline/publish-schema";

const scheduledPostSchema = z.object({
  recipeId: z.string().trim().optional().nullable(),
  scheduledAt: z.string().datetime(),
  payload: contentPublishSchema,
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

  const parsed = scheduledPostSchema.safeParse(await parseRequestJson(request));
  if (!parsed.success) {
    return NextResponse.json(parsed.error.issues[0]?.message || "Invalid schedule request.", {
      status: 400,
    });
  }

  const scheduledAt = new Date(parsed.data.scheduledAt);
  if (scheduledAt <= new Date()) {
    return NextResponse.json("Schedule time must be in the future.", { status: 400 });
  }

  try {
    await createScheduledContentPost({
      recipeId: parsed.data.recipeId || null,
      payload: parsed.data.payload,
      scheduledAt,
      createdById: admin.id,
      createdByName: admin.name || admin.email || "Admin",
    });

    return NextResponse.json(await getContentPipelineScheduleState());
  } catch (error) {
    return contentPipelineApiError(error, "Unable to schedule post.");
  }
}
