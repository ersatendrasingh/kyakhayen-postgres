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
    const { recipeTypeValues } = await req.json();

    const existingRecipeRecipeTypes = await db.recipeRecipeType.findMany({
      where: { recipeId },
      select: { recipeTypeId: true },
    });

    const existingRecipeTypesIds = existingRecipeRecipeTypes.map(
      (item) => item.recipeTypeId
    );

    const newRecipeTypeIds = recipeTypeValues.filter(
      (recipeType: string) => !existingRecipeTypesIds.includes(recipeType)
    );

    const recipeTypeIdsToRemove = existingRecipeTypesIds.filter(
      (recipeType: string) => !recipeTypeValues.includes(recipeType)
    );

    // Add new cuisine IDs
    await Promise.all(
      newRecipeTypeIds.map(async (recipeTypeId: string) => {
        await db.recipeRecipeType.create({
          data: {
            recipeId,
            recipeTypeId,
          },
        });
      })
    );

    // Remove cuisine IDs
    await Promise.all(
      recipeTypeIdsToRemove.map(async (recipeTypeId: string) => {
        await db.recipeRecipeType.deleteMany({
          where: {
            recipeId,
            recipeTypeId,
          },
        });
      })
    );

    await touchRecipeContentUpdatedAt(recipeId);
    return NextResponse.json("Recipe types updated", { status: 200 });
  } catch (error) {
    console.log("[RECIPE_TYPE]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
