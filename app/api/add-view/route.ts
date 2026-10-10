import { currentUser } from "@/lib/auth";
import {
  getClientIp,
  hasSessionCookie,
  recordRecipeView,
} from "@/lib/recipe-view-tracker";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { recipeId } = await req.json();

    if (!recipeId) {
      return NextResponse.json("Missing recipeId", { status: 400 });
    }

    const user = hasSessionCookie(req) ? await currentUser() : undefined;
    const result = await recordRecipeView({
      recipeId,
      userId: user?.id,
      ipAddress: getClientIp(req),
    });

    if (result === "missing-recipe") {
      return NextResponse.json("Recipe not found", { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.log("[USER_RECIPE_ADD_VIEWS]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
