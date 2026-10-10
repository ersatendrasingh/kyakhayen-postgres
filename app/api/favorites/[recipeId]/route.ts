import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(req: Request, props: { params: Promise<{ recipeId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { recipeId } = params;
    if (!recipeId) {
      return NextResponse.json({ error: "Missing recipeId" }, { status: 400 });
    }

    const userId = user.id;

    const existingFavorite = await db.favorite.findUnique({
      where: {
        userId_recipeId: {
          userId,
          recipeId,
        },
      },
    });

    if (!existingFavorite) {
      return NextResponse.json(
        { message: "Recipe not present in favorite" },
        { status: 200 }
      );
    }

    await db.favorite.deleteMany({
      where: {
        userId,
        recipeId,
      },
    });

    return NextResponse.json(
      { message: "Recipe removed from favorites" },
      { status: 200 }
    );
  } catch (error) {
    console.log("[UNFAVORITE_RECIPE_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
