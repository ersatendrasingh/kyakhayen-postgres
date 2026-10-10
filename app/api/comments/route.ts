import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const isPrimary = body.parentCommentId ? false : true;
    const savedComment = await db.comment.create({
      data: {
        content: body.comment,
        parentCommentId: body.parentCommentId,
        recipeId: body.recipeId,
        postId: body.postId,
        userId: user.id,
        isPrimary: isPrimary,
      },
    });

    return NextResponse.json(savedComment, { status: 200 });
  } catch (error) {
    console.error("[COMMENT_POST]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
