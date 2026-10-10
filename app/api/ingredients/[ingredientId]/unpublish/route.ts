import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, props: { params: Promise<{ ingredientId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { ingredientId } = params;

    const ingredient = await db.ingredients.findUnique({
      where: {
        id: ingredientId,
      },
    });

    if (!ingredient) {
      return NextResponse.json("Ingredient not found", { status: 404 });
    }

    const unPublishedIngredient = await db.ingredients.update({
      where: {
        id: ingredientId,
      },
      data: {
        isPublished: false,
      },
    });
    return NextResponse.json(unPublishedIngredient, { status: 200 });
  } catch (error) {
    console.log("[INGREDIENT_ID_UNPUBLISH]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
