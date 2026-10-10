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
    const { cuisineValues } = await req.json();

    // Get existing cuisine IDs associated with the recipe
    const existingRecipeCuisines = await db.recipeCuisines.findMany({
      where: { recipeId },
      select: { cuisineId: true },
    });

    // Extract existing cuisine IDs from the retrieved data
    const existingCuisineIds = existingRecipeCuisines.map(
      (item) => item.cuisineId
    );

    // Add new cuisine IDs that are not already associated with the recipe
    const newCuisineIds = cuisineValues.filter(
      (cuisine: string) => !existingCuisineIds.includes(cuisine)
    );

    // Remove cuisine IDs that are associated with the recipe but not present in the new list
    const cuisineIdsToRemove = existingCuisineIds.filter(
      (cuisine: string) => !cuisineValues.includes(cuisine)
    );

    // Add new cuisine IDs
    await Promise.all(
      newCuisineIds.map(async (cuisineId: string) => {
        await db.recipeCuisines.create({
          data: {
            recipeId,
            cuisineId,
          },
        });
      })
    );

    // Remove cuisine IDs
    await Promise.all(
      cuisineIdsToRemove.map(async (cuisineId: string) => {
        await db.recipeCuisines.deleteMany({
          where: {
            recipeId,
            cuisineId,
          },
        });
      })
    );

    await touchRecipeContentUpdatedAt(recipeId);
    return NextResponse.json("Recipe cuisines updated", { status: 200 });
  } catch (error) {
    console.log("[RECIPE_CUISINES]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
