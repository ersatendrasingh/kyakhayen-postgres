import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { runRecipePublishedAutomations } from "@/lib/notification-automations";
import { RecipeSeasonality } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, props: { params: Promise<{ recipeId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { recipeId } = params;

    const recipe = await db.recipes.findUnique({
      where: {
        id: recipeId,
      },
      include: {
        recipeSeasonTags: { select: { recipeSeasonsId: true } },
      },
    });

    if (!recipe) {
      return NextResponse.json("Recipe not found", { status: 404 });
    }

    if (!recipe.title || !recipe.description || !recipe.imageUrl) {
      return NextResponse.json("Missing required fields", { status: 400 });
    }

    if (!recipe.recipeDifficultyId) {
      return NextResponse.json("Select recipe difficulty before publishing.", { status: 400 });
    }

    if (recipe.seasonality === RecipeSeasonality.UNREVIEWED) {
      return NextResponse.json("Review season use before publishing.", { status: 400 });
    }

    if (
      recipe.seasonality === RecipeSeasonality.SEASONAL &&
      !recipe.recipeSeasonsId &&
      recipe.recipeSeasonTags.length === 0
    ) {
      return NextResponse.json("Select at least one season before publishing.", { status: 400 });
    }

    const now = new Date();
    const publishedRecipe = await db.recipes.update({
      where: {
        id: recipeId,
      },
      data: {
        isPublished: true,
        publishedAt: recipe.publishedAt ?? now,
        contentUpdatedAt: recipe.contentUpdatedAt ?? now,
      },
    });
    revalidatePath("/sitemap.xml");
    if (!recipe.isPublished) {
      try {
        await runRecipePublishedAutomations(recipeId);
      } catch (notificationError) {
        console.error("[RECIPE_PUBLISH_NOTIFICATIONS]", notificationError);
      }
    }
    return NextResponse.json(publishedRecipe, { status: 200 });
  } catch (error) {
    console.log("[RECIPE_ID_PUBLISH]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
