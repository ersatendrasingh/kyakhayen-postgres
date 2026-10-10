import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  deleteFolderFromS3,
  getVerifiedPublicMediaKey,
} from "@/lib/s3utils";
import { currentUser } from "@/lib/auth";
import { slugify } from "@/lib/slugify";

type UpdateMealTimeBody = {
  title?: string;
  imageUrl?: string | null;
  isPublished?: boolean;
};

export async function DELETE(_req: Request, props: { params: Promise<{ mealTimeId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { mealTimeId } = params;

    const mealTime = await db.mealTimes.findUnique({
      where: { id: mealTimeId },
      include: {
        _count: {
          select: { recipeMealTime: true },
        },
      },
    });

    if (!mealTime) {
      return NextResponse.json("Meal time not found", { status: 404 });
    }
    if (mealTime._count.recipeMealTime > 0) {
      return NextResponse.json("Meal time is linked to recipes", { status: 409 });
    }

    const deletedMealTime = await db.mealTimes.delete({
      where: { id: mealTimeId },
    });

    try {
      await deleteFolderFromS3(`mealTimes/${mealTimeId}`);
    } catch (error) {
      console.error("[MEAL_TIME_MEDIA_CLEANUP]", error);
    }

    return NextResponse.json(deletedMealTime, { status: 200 });
  } catch (error) {
    console.log("[MEALTIME_ID_DELETE]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
export async function PATCH(req: Request, props: { params: Promise<{ mealTimeId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { mealTimeId } = params;
    const { title, imageUrl, isPublished } = (await req.json()) as UpdateMealTimeBody;

    if (title === undefined && imageUrl === undefined && isPublished === undefined) {
      return NextResponse.json("No meal time changes supplied", { status: 400 });
    }

    const normalizedTitle = title?.trim();
    if (title !== undefined && !normalizedTitle) {
      return NextResponse.json("Meal time title is required", { status: 400 });
    }
    if (isPublished !== undefined && typeof isPublished !== "boolean") {
      return NextResponse.json("Invalid published state", { status: 400 });
    }

    const currentMealTime = await db.mealTimes.findUnique({
      where: { id: mealTimeId },
    });

    if (!currentMealTime) {
      return NextResponse.json("Meal time not found", { status: 404 });
    }

    const normalizedImageUrl =
      imageUrl === undefined ? undefined : imageUrl?.trim() || null;
    if (normalizedImageUrl) {
      try {
        getVerifiedPublicMediaKey(normalizedImageUrl);
      } catch {
        return NextResponse.json("Invalid meal time image URL", { status: 400 });
      }
    }

    const mealTime = await db.mealTimes.update({
      where: { id: mealTimeId },
      data: {
        ...(normalizedTitle && {
          title: normalizedTitle,
          slug: slugify(normalizedTitle),
        }),
        ...(imageUrl !== undefined && { imageUrl: normalizedImageUrl }),
        ...(isPublished !== undefined && { isPublished }),
      },
    });

    return NextResponse.json(mealTime, { status: 200 });
  } catch (error) {
    console.log("[MEALTIMEID]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
