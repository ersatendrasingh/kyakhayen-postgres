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
    const values = await req.json();
    const prepTime = Number(values.prepTime) || 0;
    const cookTime = Number(values.cookTime) || 0;
    const restTime = Number(values.restTime) || 0;
    const timeValues = {
      prepTime,
      cookTime,
      restTime,
      totalTime: prepTime + cookTime + restTime,
    };
    const { recipeId } = params;
    const existingRecipeTime = await db.recipeCookingTime.findFirst({
      where: {
        recipeId,
      },
    });

    if (existingRecipeTime) {
      // Update existing record
      const updatedRecipeTime = await db.recipeCookingTime.update({
        where: {
          id: existingRecipeTime.id,
        },
        data: timeValues,
      });
      await touchRecipeContentUpdatedAt(recipeId);
      return NextResponse.json(updatedRecipeTime, { status: 200 });
    } else {
      // Create new record
      const newRecipeTime = await db.recipeCookingTime.create({
        data: {
          recipeId,
          ...timeValues,
        },
      });
      await touchRecipeContentUpdatedAt(recipeId);
      return NextResponse.json(newRecipeTime, { status: 200 });
    }
  } catch (error) {
    console.log("[RECIPECOOKINGTIME]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
