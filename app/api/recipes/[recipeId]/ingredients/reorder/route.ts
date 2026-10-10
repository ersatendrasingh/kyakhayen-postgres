import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { touchRecipeContentUpdatedAt } from "@/lib/touch-recipe-content";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  props: { params: Promise<{ recipeId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { list } = (await req.json()) as {
      list?: { id: string; position: number }[];
    };
    if (
      !Array.isArray(list) ||
      !list.every(
        (item) =>
          typeof item.id === "string" &&
          Number.isInteger(item.position) &&
          item.position > 0
      )
    ) {
      return NextResponse.json("Invalid ingredient position list", { status: 400 });
    }

    await db.$transaction(
      list.map((item) =>
        db.recipeIngredients.update({
          where: {
            id: item.id,
            recipeId: params.recipeId,
          },
          data: {
            position: item.position,
          },
        })
      )
    );
    await touchRecipeContentUpdatedAt(params.recipeId);
    return NextResponse.json("Recipe ingredients reordered successfully", {
      status: 200,
    });
  } catch (error) {
    console.log("[INGREDIENT_REORDER]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
