import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  props: { params: Promise<{ postId: string; reviewId: string }> }
) {
  const params = await props.params;
  try {
    const { postId, reviewId } = params;
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const review = await db.review.findUnique({
      where: {
        id: reviewId,
        recipeId: postId as string,
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const deletedReview = await db.review.delete({
      where: {
        id: reviewId,
      },
    });

    return NextResponse.json(deletedReview, { status: 200 });
  } catch (error) {
    console.log("[REVIEW_DELETE_ADMIN]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
