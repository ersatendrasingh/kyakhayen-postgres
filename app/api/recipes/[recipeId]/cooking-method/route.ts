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
    const { cookingMethodValues } = await req.json();

    const existingRecipeCookingMethods = await db.recipeCookingMethod.findMany({
      where: { recipeId },
      select: { cookingMethodId: true },
    });

    const existingCookingMethodsIds = existingRecipeCookingMethods.map(
      (item) => item.cookingMethodId
    );

    const newCookingMethodsIds = cookingMethodValues.filter(
      (cookingMethod: string) =>
        !existingCookingMethodsIds.includes(cookingMethod)
    );

    const cookingMethodsIdsToRemove = existingCookingMethodsIds.filter(
      (cookingMethod: string) => !cookingMethodValues.includes(cookingMethod)
    );

    await Promise.all(
      newCookingMethodsIds.map(async (cookingMethodId: string) => {
        await db.recipeCookingMethod.create({
          data: {
            recipeId,
            cookingMethodId,
          },
        });
      })
    );

    await Promise.all(
      cookingMethodsIdsToRemove.map(async (cookingMethodId: string) => {
        await db.recipeCookingMethod.deleteMany({
          where: {
            recipeId,
            cookingMethodId,
          },
        });
      })
    );

    await touchRecipeContentUpdatedAt(recipeId);
    return NextResponse.json("Recipe cooking methods updated", { status: 200 });
  } catch (error) {
    console.log("[RECIPE_COOKING_METHOD]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
