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
    const { mealTimeValues } = await req.json();

    const existingRecipeMealTimes = await db.recipeMealTime.findMany({
      where: { recipeId },
      select: { mealTimeId: true },
    });

    const existingMealTimesIds = existingRecipeMealTimes.map(
      (item) => item.mealTimeId
    );

    const newMealTimesIds = mealTimeValues.filter(
      (mealTime: string) => !existingMealTimesIds.includes(mealTime)
    );

    const mealTimesIdsToRemove = existingMealTimesIds.filter(
      (mealTime: string) => !mealTimeValues.includes(mealTime)
    );

    await Promise.all(
      newMealTimesIds.map(async (mealTimeId: string) => {
        await db.recipeMealTime.create({
          data: {
            recipeId,
            mealTimeId,
          },
        });
      })
    );

    await Promise.all(
      mealTimesIdsToRemove.map(async (mealTimeId: string) => {
        await db.recipeMealTime.deleteMany({
          where: {
            recipeId,
            mealTimeId,
          },
        });
      })
    );

    await touchRecipeContentUpdatedAt(recipeId);
    return NextResponse.json("Recipe meal times updated", { status: 200 });
  } catch (error) {
    console.log("[RECIPE_MEAL_TIMES]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
