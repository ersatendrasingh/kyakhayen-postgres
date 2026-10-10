import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { slugify } from "@/lib/slugify";
import {
  deleteFolderFromS3,
  getVerifiedPublicMediaKey,
} from "@/lib/s3utils";

type UpdateIngredientCategoryBody = {
  name?: string;
  imageUrl?: string | null;
  isPublished?: boolean;
};

export async function DELETE(req: Request, props: { params: Promise<{ categoryId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { categoryId } = params;

    const category = await db.ingredientCategories.findUnique({
      where: { id: categoryId },
      include: {
        _count: { select: { ingredient: true } },
      },
    });

    if (!category) {
      return NextResponse.json("Category not found", { status: 404 });
    }

    if (category._count.ingredient > 0) {
      return NextResponse.json("Category is linked to ingredients", { status: 409 });
    }

    const deletedCategory = await db.ingredientCategories.delete({ where: { id: categoryId } });

    try {
      await deleteFolderFromS3(`ingredientCategories/${categoryId}`);
    } catch (error) {
      console.error("[INGREDIENT_CATEGORY_MEDIA_CLEANUP]", error);
    }

    return NextResponse.json(deletedCategory, { status: 200 });
  } catch (error) {
    console.log("[INGREDIENT_CATEGORY_ID_DELETE]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
export async function PATCH(req: Request, props: { params: Promise<{ categoryId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { categoryId } = params;
    const { name, imageUrl, isPublished } =
      (await req.json()) as UpdateIngredientCategoryBody;

    if (name === undefined && imageUrl === undefined && isPublished === undefined) {
      return NextResponse.json("No category changes supplied", { status: 400 });
    }

    const normalizedName = name?.trim();
    if (name !== undefined && !normalizedName) {
      return NextResponse.json("Category name is required", { status: 400 });
    }
    if (isPublished !== undefined && typeof isPublished !== "boolean") {
      return NextResponse.json("Invalid published state", { status: 400 });
    }

    const currentCategory = await db.ingredientCategories.findUnique({
      where: { id: categoryId },
    });
    if (!currentCategory) {
      return NextResponse.json("Category not found", { status: 404 });
    }

    const normalizedImageUrl =
      imageUrl === undefined ? undefined : imageUrl?.trim() || null;
    if (normalizedImageUrl) {
      try {
        getVerifiedPublicMediaKey(normalizedImageUrl);
      } catch {
        return NextResponse.json("Invalid category image URL", { status: 400 });
      }
    }

    const category = await db.ingredientCategories.update({
      where: { id: categoryId },
      data: {
        ...(normalizedName && {
          name: normalizedName,
          slug: slugify(normalizedName),
        }),
        ...(imageUrl !== undefined && { imageUrl: normalizedImageUrl }),
        ...(isPublished !== undefined && { isPublished }),
      },
    });

    return NextResponse.json(category, { status: 200 });
  } catch (error) {
    console.log("[INGREDIENTCATEGORYID]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
