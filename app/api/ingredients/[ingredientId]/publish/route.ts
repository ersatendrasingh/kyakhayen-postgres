import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, props: { params: Promise<{ ingredientId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { ingredientId } = params;

    const ingredient = await db.ingredients.findUnique({
      where: {
        id: ingredientId,
      },
      include: {
        _count: { select: { IngredientUnitMeasurements: true } },
      },
    });

    if (!ingredient) {
      return NextResponse.json("Ingredient not found", { status: 404 });
    }

    const nutritionFields = [
      ingredient.calories,
      ingredient.carbohydrate,
      ingredient.totalFat,
      ingredient.dietaryFiber,
      ingredient.protein,
      ingredient.vitaminA,
      ingredient.ascorbicAcids,
      ingredient.vitaminD,
      ingredient.tocopherolEquivalent,
      ingredient.vitaminK,
      ingredient.thiamine,
      ingredient.riboflavin,
      ingredient.totalB6,
      ingredient.folates,
      ingredient.calcium,
      ingredient.iron,
      ingredient.phosphorus,
      ingredient.potassium,
      ingredient.sodium,
      ingredient.zinc,
    ];

    if (
      !ingredient.name ||
      !ingredient.ingredientCategoriesId ||
      nutritionFields.some((value) => value === null) ||
      ingredient._count.IngredientUnitMeasurements === 0
    ) {
      return NextResponse.json(
        "Complete identity, nutrition and measurement mappings before publishing",
        { status: 400 }
      );
    }

    const publishedIngredient = await db.ingredients.update({
      where: {
        id: ingredientId,
      },
      data: {
        isPublished: true,
      },
    });
    return NextResponse.json(publishedIngredient, { status: 200 });
  } catch (error) {
    console.log("[INGREDIENT_ID_PUBLISH]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
