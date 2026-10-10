import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request, props: { params: Promise<{ postId: string }> }) {
  const params = await props.params;
  try {
    const { postId } = params;

    const user = await currentUser();
    if (!postId) {
      return NextResponse.json(`Post ID is required`, { status: 400 });
    }

    if (!user) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const comments = await db.comment.findMany({
      where: {
        OR: [{ recipeId: postId as string }, { postId: postId as string }],
        AND: [
          {
            OR: [{ isPublished: true }, { userId: user.id }],
          },
        ],
      },
      include: {
        user: true,
        recipe: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(comments, { status: 200 });
  } catch (error) {
    console.error("[GET_COMMENT]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
