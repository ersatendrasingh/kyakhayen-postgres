import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { recipeId } = await req.json();
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

    if (existingFavorite) {
      return NextResponse.json(
        { message: "Recipe already added in favorite" },
        { status: 200 }
      );
    }

    await db.favorite.create({
      data: {
        userId,
        recipeId,
      },
    });

    return NextResponse.json(
      { message: "Recipe added to favorites" },
      { status: 200 }
    );
  } catch (error) {
    console.log("[FAVORITE_RECIPE_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
