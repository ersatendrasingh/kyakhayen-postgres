import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  props: { params: Promise<{ postId: string; commentId: string }> }
) {
  const params = await props.params;

  const { commentId } = params;

  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ isLiked: false }, { status: 200 });
    }

    const existingLike = await db.commentLikes.findFirst({
      where: {
        commentId,
        userId: user.id,
      },
    });

    return NextResponse.json({ isLiked: !!existingLike }, { status: 200 });
  } catch (error) {
    console.log("[LIKE_STATUS]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
