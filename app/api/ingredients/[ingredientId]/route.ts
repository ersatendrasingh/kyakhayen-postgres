import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { getIngredientSlug, normalizeIngredientName } from "@/lib/ingredients";

const nutritionValue = z.number().finite().min(0).nullable().optional();
const updateIngredientSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    ingredientCategoriesId: z.string().uuid().nullable().optional(),
    imageUrl: z.string().url().nullable().optional(),
    nutritionSource: z.string().trim().max(160).nullable().optional(),
    nutritionBasisGrams: z.number().finite().positive().max(1000).optional(),
    marketPriceInr: z.number().finite().min(0).nullable().optional(),
    marketPriceBasisGrams: z.number().finite().positive().max(100000).optional(),
    marketPriceSource: z.string().trim().max(191).nullable().optional(),
    calories: nutritionValue,
    carbohydrate: nutritionValue,
    totalFat: nutritionValue,
    dietaryFiber: nutritionValue,
    protein: nutritionValue,
    vitaminA: nutritionValue,
    ascorbicAcids: nutritionValue,
    vitaminD: nutritionValue,
    tocopherolEquivalent: nutritionValue,
    vitaminK: nutritionValue,
    thiamine: nutritionValue,
    riboflavin: nutritionValue,
    totalB6: nutritionValue,
    folates: nutritionValue,
    calcium: nutritionValue,
    iron: nutritionValue,
    phosphorus: nutritionValue,
    potassium: nutritionValue,
    sodium: nutritionValue,
    zinc: nutritionValue,
  })
  .strict();

export async function DELETE(
  _req: Request,
  props: { params: Promise<{ ingredientId: string }> }
) {
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
        _count: { select: { RecipeIngredients: true } },
      },
    });

    if (!ingredient) {
      return NextResponse.json("Ingredient not found", { status: 404 });
    }

    if (ingredient._count.RecipeIngredients > 0) {
      return NextResponse.json("Ingredient is linked to recipes", {
        status: 409,
      });
    }

    const deletedIngredient = await db.$transaction(async (tx) => {
      await tx.ingredientUnitMeasurements.deleteMany({
        where: { ingredientId },
      });

      return tx.ingredients.delete({
        where: { id: ingredientId },
      });
    });

    return NextResponse.json(deletedIngredient, { status: 200 });
  } catch (error) {
    console.log("[INGREDIENT_ID_DELETE]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
export async function PATCH(req: Request, props: { params: Promise<{ ingredientId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { ingredientId } = params;
    const parsedValues = updateIngredientSchema.safeParse(await req.json());

    if (!parsedValues.success) {
      return NextResponse.json("Invalid ingredient values", { status: 400 });
    }

    const values = parsedValues.data;
    const hasPricingUpdate = [
      "marketPriceInr",
      "marketPriceBasisGrams",
      "marketPriceSource",
    ].some((key) => Object.prototype.hasOwnProperty.call(values, key));
    const data = values.name
      ? {
          ...values,
          name: normalizeIngredientName(values.name),
          slug: getIngredientSlug(normalizeIngredientName(values.name)),
        }
      : values;

    const ingredient = await db.ingredients.update({
      where: {
        id: ingredientId,
      },
      data: {
        ...data,
        ...(hasPricingUpdate
          ? {
              marketPriceUpdatedAt:
                values.marketPriceInr === null ? null : new Date(),
            }
          : {}),
      },
    });
    return NextResponse.json(ingredient, { status: 200 });
  } catch (error) {
    console.log("[INGREDIENT_ID]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
