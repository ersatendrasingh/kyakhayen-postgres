import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(
  _req: Request,
  props: { params: Promise<{ postId: string; commentId: string }> }
) {
  const params = await props.params;

  const { commentId } = params;

  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const existingLike = await db.commentLikes.findFirst({
      where: {
        commentId,
        userId: user.id,
      },
    });

    if (!existingLike) {
      // User hasn't liked the comment
      return NextResponse.json("User has not liked this comment", {
        status: 409,
      });
    }

    // Delete the like entry
    await db.commentLikes.delete({
      where: {
        id: existingLike.id,
      },
    });

    // Update the likes count in the Comment table
    const updatedComment = await db.comment.update({
      where: {
        id: commentId,
      },
      data: {
        likes: {
          decrement: 1,
        },
      },
    });

    return NextResponse.json(updatedComment, { status: 200 });
  } catch (error) {
    console.log("[UNLIKE_COMMENT]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
