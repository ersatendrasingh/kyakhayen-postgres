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
    const { recipeId } = params;
    if (values) {
      const lastIngredient = await db.recipeIngredients.findFirst({
        where: {
          recipeId,
        },
        orderBy: {
          position: "desc",
        },
      });
      const newPosition = lastIngredient ? lastIngredient.position + 1 : 1;
      const ingredient = await db.recipeIngredients.create({
        data: {
          recipeId,
          position: newPosition,
          ...values,
        },
      });
      await touchRecipeContentUpdatedAt(recipeId);
      return NextResponse.json(ingredient, { status: 200 });
    }
  } catch (error) {
    console.log("[RECIPEINGREDIENTS]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
