import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  deleteFolderFromS3,
  getVerifiedPublicMediaKey,
} from "@/lib/s3utils";
import { currentUser } from "@/lib/auth";
import { slugify } from "@/lib/slugify";

type UpdateCuisineBody = {
  title?: string;
  imageUrl?: string | null;
  isPublished?: boolean;
};

export async function DELETE(_req: Request, props: { params: Promise<{ cuisineId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { cuisineId } = params;

    const cuisine = await db.cuisines.findUnique({
      where: { id: cuisineId },
      include: {
        _count: {
          select: { recipeCuisine: true, userCuisines: true },
        },
      },
    });

    if (!cuisine) {
      return NextResponse.json("Cuisine not found", { status: 404 });
    }
    if (
      cuisine._count.recipeCuisine > 0 ||
      cuisine._count.userCuisines > 0
    ) {
      return NextResponse.json("Cuisine is linked to recipes or users", { status: 409 });
    }

    const deletedCuisine = await db.cuisines.delete({
      where: { id: cuisineId },
    });

    try {
      await deleteFolderFromS3(`cuisines/${cuisineId}`);
    } catch (error) {
      console.error("[CUISINE_MEDIA_CLEANUP]", error);
    }

    return NextResponse.json(deletedCuisine, { status: 200 });
  } catch (error) {
    console.log("[CUISINE_ID_DELETE]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
export async function PATCH(req: Request, props: { params: Promise<{ cuisineId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { cuisineId } = params;
    const { title, imageUrl, isPublished } = (await req.json()) as UpdateCuisineBody;

    if (title === undefined && imageUrl === undefined && isPublished === undefined) {
      return NextResponse.json("No cuisine changes supplied", { status: 400 });
    }

    const normalizedTitle = title?.trim();
    if (title !== undefined && !normalizedTitle) {
      return NextResponse.json("Cuisine title is required", { status: 400 });
    }
    if (isPublished !== undefined && typeof isPublished !== "boolean") {
      return NextResponse.json("Invalid published state", { status: 400 });
    }

    const currentCuisine = await db.cuisines.findUnique({
      where: { id: cuisineId },
    });

    if (!currentCuisine) {
      return NextResponse.json("Cuisine not found", { status: 404 });
    }

    const normalizedImageUrl =
      imageUrl === undefined ? undefined : imageUrl?.trim() || null;
    if (normalizedImageUrl) {
      try {
        getVerifiedPublicMediaKey(normalizedImageUrl);
      } catch {
        return NextResponse.json("Invalid cuisine image URL", { status: 400 });
      }
    }

    const cuisine = await db.cuisines.update({
      where: { id: cuisineId },
      data: {
        ...(normalizedTitle && {
          title: normalizedTitle,
          slug: slugify(normalizedTitle),
        }),
        ...(imageUrl !== undefined && { imageUrl: normalizedImageUrl }),
        ...(isPublished !== undefined && { isPublished }),
      },
    });

    return NextResponse.json(cuisine, { status: 200 });
  } catch (error) {
    console.log("[CUISINEID]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
