import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { touchRecipeContentUpdatedAt } from "@/lib/touch-recipe-content";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  props: { params: Promise<{ recipeId: string; ingredientId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const { recipeId, ingredientId } = params;
    const ingredient = await db.recipeIngredients.findUnique({
      where: {
        id: params.ingredientId,
        recipeId: params.recipeId,
      },
    });
    if (!ingredient) {
      return NextResponse.json("Ingredient not found", { status: 404 });
    }
    const deletedIngredient = await db.recipeIngredients.delete({
      where: {
        id: ingredientId,
      },
    });
    await touchRecipeContentUpdatedAt(recipeId);
    return NextResponse.json(deletedIngredient, {
      status: 200,
    });
  } catch (error) {
    console.log("[INGREDIENT_ID]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
export async function PATCH(
  req: Request,
  props: { params: Promise<{ recipeId: string; ingredientId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const values = await req.json();
    const ingredient = await db.recipeIngredients.findUnique({
      where: {
        id: params.ingredientId,
        recipeId: params.recipeId,
      },
    });
    if (!ingredient) {
      return NextResponse.json("Ingredient not found", { status: 404 });
    }
    if (values) {
      const updatedIngredient = await db.recipeIngredients.update({
        where: {
          id: params.ingredientId,
          recipeId: params.recipeId,
        },
        data: {
          ...values,
        },
      });
      await touchRecipeContentUpdatedAt(params.recipeId);
      return NextResponse.json(updatedIngredient, { status: 200 });
    }
  } catch (error) {
    console.log("[RECIPEINGREDIENTSUPDATE]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
