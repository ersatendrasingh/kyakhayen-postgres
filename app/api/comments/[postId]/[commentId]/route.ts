import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  props: { params: Promise<{ postId: string; commentId: string }> }
) {
  const params = await props.params;
  try {
    const { postId, commentId } = params;

    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const comment = await db.comment.findUnique({
      where: {
        id: commentId,
        OR: [{ recipeId: postId as string }, { postId: postId as string }],
      },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const deletedComment = await db.comment.delete({
      where: {
        id: commentId,
      },
    });

    return NextResponse.json(deletedComment, { status: 200 });
  } catch (error) {
    console.log("[COMMENT_DELETE]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  props: {
    params: Promise<{ postId: string; commentId: string }>;
  }
) {
  const params = await props.params;
  try {
    const { postId, commentId } = params;
    const { content } = await req.json();

    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const comment = await db.comment.findUnique({
      where: {
        id: commentId,
        OR: [{ recipeId: postId as string }, { postId: postId as string }],
      },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedComment = await db.comment.update({
      where: {
        id: commentId,
        OR: [{ recipeId: postId as string }, { postId: postId as string }],
      },
      data: {
        content: content,
      },
    });

    return NextResponse.json(updatedComment, { status: 200 });
  } catch (error) {
    console.log("[COMMENT_UPDATE]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
