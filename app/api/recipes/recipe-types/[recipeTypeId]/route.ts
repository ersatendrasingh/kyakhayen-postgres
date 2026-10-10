import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  deleteFolderFromS3,
  getVerifiedPublicMediaKey,
} from "@/lib/s3utils";
import { currentUser } from "@/lib/auth";
import { slugify } from "@/lib/slugify";

type UpdateRecipeTypeBody = {
  title?: string;
  imageUrl?: string | null;
  isPublished?: boolean;
};

export async function DELETE(_req: Request, props: { params: Promise<{ recipeTypeId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { recipeTypeId } = params;

    const recipeType = await db.recipeTypes.findUnique({
      where: { id: recipeTypeId },
      include: {
        _count: {
          select: { recipeRecipeType: true },
        },
      },
    });

    if (!recipeType) {
      return NextResponse.json("Recipe Type not found", { status: 404 });
    }
    if (recipeType._count.recipeRecipeType > 0) {
      return NextResponse.json("Recipe type is linked to recipes", { status: 409 });
    }

    const deletedRecipeType = await db.recipeTypes.delete({
      where: { id: recipeTypeId },
    });

    try {
      await deleteFolderFromS3(`recipeTypes/${recipeTypeId}`);
    } catch (error) {
      console.error("[RECIPE_TYPE_MEDIA_CLEANUP]", error);
    }

    return NextResponse.json(deletedRecipeType, { status: 200 });
  } catch (error) {
    console.log("[RECIPETYPE_ID_DELETE]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
export async function PATCH(req: Request, props: { params: Promise<{ recipeTypeId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { recipeTypeId } = params;
    const { title, imageUrl, isPublished } = (await req.json()) as UpdateRecipeTypeBody;

    if (title === undefined && imageUrl === undefined && isPublished === undefined) {
      return NextResponse.json("No recipe type changes supplied", { status: 400 });
    }

    const normalizedTitle = title?.trim();
    if (title !== undefined && !normalizedTitle) {
      return NextResponse.json("Recipe type title is required", { status: 400 });
    }
    if (isPublished !== undefined && typeof isPublished !== "boolean") {
      return NextResponse.json("Invalid published state", { status: 400 });
    }

    const currentRecipeType = await db.recipeTypes.findUnique({
      where: { id: recipeTypeId },
    });

    if (!currentRecipeType) {
      return NextResponse.json("Recipe Type not found", { status: 404 });
    }

    const normalizedImageUrl =
      imageUrl === undefined ? undefined : imageUrl?.trim() || null;
    if (normalizedImageUrl) {
      try {
        getVerifiedPublicMediaKey(normalizedImageUrl);
      } catch {
        return NextResponse.json("Invalid recipe type image URL", { status: 400 });
      }
    }

    const recipeType = await db.recipeTypes.update({
      where: { id: recipeTypeId },
      data: {
        ...(normalizedTitle && {
          title: normalizedTitle,
          slug: slugify(normalizedTitle),
        }),
        ...(imageUrl !== undefined && { imageUrl: normalizedImageUrl }),
        ...(isPublished !== undefined && { isPublished }),
      },
    });

    return NextResponse.json(recipeType, { status: 200 });
  } catch (error) {
    console.log("[RECIPETYPE_ID]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
