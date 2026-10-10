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
    const { dietTypeValues } = await req.json();

    const existingRecipeDietTypes = await db.recipeDietType.findMany({
      where: { recipeId },
      select: { dietTypeId: true },
    });

    const existingDietTypesIds = existingRecipeDietTypes.map(
      (item) => item.dietTypeId
    );

    const newDietTypeIds = dietTypeValues.filter(
      (dietType: string) => !existingDietTypesIds.includes(dietType)
    );

    const dietTypeIdsToRemove = existingDietTypesIds.filter(
      (dietType: string) => !dietTypeValues.includes(dietType)
    );

    // Add new cuisine IDs
    await Promise.all(
      newDietTypeIds.map(async (dietTypeId: string) => {
        await db.recipeDietType.create({
          data: {
            recipeId,
            dietTypeId,
          },
        });
      })
    );

    // Remove cuisine IDs
    await Promise.all(
      dietTypeIdsToRemove.map(async (dietTypeId: string) => {
        await db.recipeDietType.deleteMany({
          where: {
            recipeId,
            dietTypeId,
          },
        });
      })
    );

    await touchRecipeContentUpdatedAt(recipeId);
    return NextResponse.json("Recipe diet types updated", { status: 200 });
  } catch (error) {
    console.log("[RECIPE_DIETTYPE]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
