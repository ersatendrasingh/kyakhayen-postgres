import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { touchRecipeContentUpdatedAt } from "@/lib/touch-recipe-content";
import { NextResponse } from "next/server";

export async function POST(req: Request, props: { params: Promise<{ recipeId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const { recipeId } = params;
    const { nutrientValues } = await req.json();

    const existingRecipeNutrients = await db.recipeNutrient.findMany({
      where: { recipeId },
      select: { nutrientId: true },
    });

    const existingNutrientsIds = existingRecipeNutrients.map(
      (item) => item.nutrientId
    );

    const newNutrientsIds = nutrientValues.filter(
      (nutrient: string) => !existingNutrientsIds.includes(nutrient)
    );

    const nutrientsIdsToRemove = existingNutrientsIds.filter(
      (nutrient: string) => !nutrientValues.includes(nutrient)
    );

    await Promise.all(
      newNutrientsIds.map(async (nutrientId: string) => {
        await db.recipeNutrient.create({
          data: {
            recipeId,
            nutrientId,
          },
        });
      })
    );

    await Promise.all(
      nutrientsIdsToRemove.map(async (nutrientId: string) => {
        await db.recipeNutrient.deleteMany({
          where: {
            recipeId,
            nutrientId,
          },
        });
      })
    );

    await touchRecipeContentUpdatedAt(recipeId);
    return NextResponse.json("Recipe nutrients updated", { status: 200 });
  } catch (error) {
    console.log("[RECIPE_NUTRIENTS]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
