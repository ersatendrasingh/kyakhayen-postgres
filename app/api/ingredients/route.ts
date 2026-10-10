import { NextResponse } from "next/server";

import { db } from "@/lib/db";

import { currentUser } from "@/lib/auth";
import { getIngredientSlug, normalizeIngredientName } from "@/lib/ingredients";

type CreateIngredientBody = {
  name?: string;
  ingredientCategoriesId?: string;
};

export async function POST(req: Request) {
  try {
    const user = await currentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const { name, ingredientCategoriesId } =
      (await req.json()) as CreateIngredientBody;
    const normalizedName = normalizeIngredientName(name ?? "");

    if (!normalizedName || !ingredientCategoriesId) {
      return NextResponse.json("Name and category are required", {
        status: 400,
      });
    }

    const category = await db.ingredientCategories.findUnique({
      where: { id: ingredientCategoriesId },
      select: { id: true },
    });

    if (!category) {
      return NextResponse.json("Ingredient category not found", {
        status: 400,
      });
    }

    const ingredient = await db.ingredients.create({
      data: {
        name: normalizedName,
        slug: getIngredientSlug(normalizedName),
        ingredientCategoriesId,
      },
    });
    return NextResponse.json(ingredient, { status: 200 });
  } catch (error) {
    console.log("[INGREDIENTS]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
