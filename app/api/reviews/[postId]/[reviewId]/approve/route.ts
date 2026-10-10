import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  props: { params: Promise<{ postId: string; reviewId: string }> }
) {
  const params = await props.params;

  const {
    postId,
    reviewId
  } = params;

  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const existingReview = await db.review.findUnique({
      where: {
        id: reviewId,
        recipeId: postId as string,
      },
    });
    if (!existingReview) {
      return NextResponse.json("Review not found", { status: 404 });
    }
    if (existingReview.isPublished) {
      return NextResponse.json("Review already approved", { status: 409 });
    }
    const approvedReview = await db.review.update({
      where: {
        id: reviewId,
        recipeId: postId as string,
      },
      data: {
        isPublished: true,
      },
    });

    return NextResponse.json(approvedReview, { status: 200 });
  } catch (error) {
    console.log("REVIEW_APPROVE", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
