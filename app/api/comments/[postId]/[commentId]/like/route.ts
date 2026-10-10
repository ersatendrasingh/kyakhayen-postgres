import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
  _req: Request,
  props: { params: Promise<{ postId: string; commentId: string }> }
) {
  const params = await props.params;

  const { commentId } = params;

  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json("User not authenticated", { status: 401 });
    }

    const existingLike = await db.commentLikes.findFirst({
      where: {
        commentId,
        userId: user.id,
      },
    });

    if (existingLike) {
      return NextResponse.json("User already liked this comment", {
        status: 409,
      });
    }

    await db.commentLikes.create({
      data: {
        commentId,
        userId: user.id,
      },
    });

    const updatedComment = await db.comment.update({
      where: {
        id: commentId,
      },
      data: {
        likes: {
          increment: 1,
        },
      },
    });

    return NextResponse.json(updatedComment, { status: 200 });
  } catch (error) {
    console.error("[LIKE_COMMENT]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
