import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  deleteFolderFromS3,
  getVerifiedPublicMediaKey,
} from "@/lib/s3utils";
import { currentUser } from "@/lib/auth";
import { slugify } from "@/lib/slugify";

type UpdateNutrientBody = {
  title?: string;
  imageUrl?: string | null;
  isPublished?: boolean;
};

export async function DELETE(_req: Request, props: { params: Promise<{ nutrientId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { nutrientId } = params;

    const nutrient = await db.nutrient.findUnique({
      where: { id: nutrientId },
      include: {
        _count: {
          select: { recipeNutrient: true },
        },
      },
    });

    if (!nutrient) {
      return NextResponse.json("Nutrient not found", { status: 404 });
    }
    if (nutrient._count.recipeNutrient > 0) {
      return NextResponse.json("Nutrient is linked to recipes", { status: 409 });
    }

    const deletedNutrient = await db.nutrient.delete({
      where: { id: nutrientId },
    });

    try {
      await deleteFolderFromS3(`nutrients/${nutrientId}`);
    } catch (error) {
      console.error("[NUTRIENT_MEDIA_CLEANUP]", error);
    }

    return NextResponse.json(deletedNutrient, { status: 200 });
  } catch (error) {
    console.log("[NUTRIENT_ID_DELETE]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
export async function PATCH(req: Request, props: { params: Promise<{ nutrientId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { nutrientId } = params;
    const { title, imageUrl, isPublished } = (await req.json()) as UpdateNutrientBody;

    if (title === undefined && imageUrl === undefined && isPublished === undefined) {
      return NextResponse.json("No nutrient changes supplied", { status: 400 });
    }

    const normalizedTitle = title?.trim();
    if (title !== undefined && !normalizedTitle) {
      return NextResponse.json("Nutrient title is required", { status: 400 });
    }
    if (isPublished !== undefined && typeof isPublished !== "boolean") {
      return NextResponse.json("Invalid published state", { status: 400 });
    }

    const currentNutrient = await db.nutrient.findUnique({
      where: { id: nutrientId },
    });

    if (!currentNutrient) {
      return NextResponse.json("Nutrient not found", { status: 404 });
    }

    const normalizedImageUrl =
      imageUrl === undefined ? undefined : imageUrl?.trim() || null;
    if (normalizedImageUrl) {
      try {
        getVerifiedPublicMediaKey(normalizedImageUrl);
      } catch {
        return NextResponse.json("Invalid nutrient image URL", { status: 400 });
      }
    }

    const nutrient = await db.nutrient.update({
      where: { id: nutrientId },
      data: {
        ...(normalizedTitle && {
          title: normalizedTitle,
          slug: slugify(normalizedTitle),
        }),
        ...(imageUrl !== undefined && { imageUrl: normalizedImageUrl }),
        ...(isPublished !== undefined && { isPublished }),
      },
    });

    return NextResponse.json(nutrient, { status: 200 });
  } catch (error) {
    console.log("[NUTRIENTID]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
