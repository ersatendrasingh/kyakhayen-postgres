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

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
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

    if (review.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const deletedReview = await db.review.delete({
      where: {
        id: reviewId,
      },
    });

    return NextResponse.json(deletedReview, { status: 200 });
  } catch (error) {
    console.log("[REVIEW_DELETE]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  props: {
    params: Promise<{ postId: string; reviewId: string }>;
  }
) {
  const params = await props.params;
  try {
    const { postId, reviewId } = params;
    const { content, rating } = await req.json();

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
    if (!rating) {
      return NextResponse.json(
        { error: "Rating is required" },
        { status: 400 }
      );
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

    if (review.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedReview = await db.review.update({
      where: {
        id: reviewId,
        recipeId: postId as string,
      },
      data: {
        comment: content,
        rating,
      },
    });

    return NextResponse.json(updatedReview, { status: 200 });
  } catch (error) {
    console.log("[REVIEW_UPDATE]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
