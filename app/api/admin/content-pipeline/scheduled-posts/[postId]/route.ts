import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { contentPipelineApiError } from "@/lib/content-pipeline/api-error";
import {
  cancelScheduledContentPost,
  getContentPipelineScheduleState,
} from "@/lib/content-pipeline/scheduling";

export async function DELETE(_request: Request, props: { params: Promise<{ postId: string }> }) {
  const admin = await currentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json("Unauthorized", { status: 401 });
  }

  try {
    const { postId } = await props.params;
    const result = await cancelScheduledContentPost(postId);
    if ("error" in result) return NextResponse.json(result.error, { status: result.status });

    return NextResponse.json(await getContentPipelineScheduleState());
  } catch (error) {
    return contentPipelineApiError(error, "Unable to cancel scheduled post.");
  }
}
