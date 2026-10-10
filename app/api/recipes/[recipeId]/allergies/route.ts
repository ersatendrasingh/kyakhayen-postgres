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
    const { allergyValues } = await req.json();

    const existingRecipeAllergies = await db.recipeAllergies.findMany({
      where: { recipeId },
      select: { allergyId: true },
    });

    const existingAllergiesIds = existingRecipeAllergies.map(
      (item) => item.allergyId
    );

    const newAllergiesIds = allergyValues.filter(
      (allergy: string) => !existingAllergiesIds.includes(allergy)
    );

    const allergiesIdsToRemove = existingAllergiesIds.filter(
      (allergy: string) => !allergyValues.includes(allergy)
    );

    await Promise.all(
      newAllergiesIds.map(async (allergyId: string) => {
        await db.recipeAllergies.create({
          data: {
            recipeId,
            allergyId,
          },
        });
      })
    );

    await Promise.all(
      allergiesIdsToRemove.map(async (allergyId: string) => {
        await db.recipeAllergies.deleteMany({
          where: {
            recipeId,
            allergyId,
          },
        });
      })
    );

    await touchRecipeContentUpdatedAt(recipeId);
    return NextResponse.json("Recipe allergies updated", { status: 200 });
  } catch (error) {
    console.log("[RECIPE_ALLERGIES]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
