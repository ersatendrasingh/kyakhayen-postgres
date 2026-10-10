import {
  getClientIp,
  hasSessionCookie,
  recordRecipeView,
} from "@/lib/recipe-view-tracker";
import { currentUser } from "@/lib/auth";
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

    if (result === "missing-viewer") {
      return NextResponse.json("Missing viewer identity", { status: 400 });
    }

    if (result === "missing-recipe") {
      return NextResponse.json("Recipe not found", { status: 404 });
    }

    return NextResponse.json("View Count Updated", { status: 200 });
  } catch (error) {
    console.log("[RECIPE_TRACK_VIEWS]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
