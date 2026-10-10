import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { RecipeSeasonality } from "@prisma/client";

import { db } from "@/lib/db";
import {
  deleteFolderFromS3,
} from "@/lib/s3utils";
import { currentUser } from "@/lib/auth";
import { normalizeRecipeTitle } from "@/lib/recipe-seo";
import { normalizePathSegment } from "@/lib/seo";
import { slugify } from "@/lib/slugify";

export async function DELETE(req: Request, props: { params: Promise<{ recipeId: string }> }) {
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
    });

    if (!recipe) {
      return NextResponse.json("Recipe not found", { status: 404 });
    }
    await deleteFolderFromS3(`recipes/${recipeId}`);

    const deletedRecipe = await db.recipes.delete({
      where: {
        id: recipeId,
      },
    });
    if (recipe.isPublished) {
      revalidatePath("/sitemap.xml");
    }
    return NextResponse.json(deletedRecipe, { status: 200 });
  } catch (error) {
    console.log("[RECIPE_ID_DELETE]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
export async function PATCH(req: Request, props: { params: Promise<{ recipeId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { recipeId } = params;
    const payload = await req.json();
    const {
      title: requestedTitle,
      recipeDifficultyId: requestedRecipeDifficultyId,
      seasonIds: requestedSeasonIds,
      seasonality: requestedSeasonality,
      ...values
    } = payload;
    const title = requestedTitle ? normalizeRecipeTitle(requestedTitle) : undefined;
    const hasDifficultyChange = Object.prototype.hasOwnProperty.call(
      payload,
      "recipeDifficultyId"
    );
    const contentFields = [
      "title",
      "description",
      "imageUrl",
      "metaTitle",
      "metaDescription",
      "metaSlug",
      "recipeCategoriesId",
      "recipeDifficultyId",
      "recipeSeasonsId",
      "seasonality",
    ];
    const scalarFields = [
      "description",
      "imageUrl",
      "metaTitle",
      "metaDescription",
      "metaSlug",
      "recipeCategoriesId",
    ];
    const data = Object.fromEntries(
      Object.entries(values).filter(([field]) => scalarFields.includes(field)),
    );
    if (Object.prototype.hasOwnProperty.call(values, "metaSlug")) {
      data.metaSlug =
        typeof values.metaSlug === "string"
          ? normalizePathSegment(values.metaSlug) || null
          : null;
    }
    const hasSeasonalityChange = Object.prototype.hasOwnProperty.call(
      payload,
      "seasonality"
    );
    const hasContentChange =
      Boolean(title) ||
      contentFields.some((field) => Object.prototype.hasOwnProperty.call(values, field)) ||
      hasDifficultyChange ||
      hasSeasonalityChange;
    let slug: string | undefined;
    if (title) {
      slug = slugify(title);
      const existing = await db.recipes.findUnique({ where: { slug }, select: { id: true } });
      if (existing && existing.id !== recipeId) {
        return NextResponse.json(
          "A recipe with this title already exists. Use a descriptive variation such as cuisine or style.",
          { status: 409 }
        );
      }
    }
    const seasonality = hasSeasonalityChange ? requestedSeasonality : undefined;

    if (hasSeasonalityChange && typeof seasonality !== "string") {
      return NextResponse.json("Invalid seasonality value", { status: 400 });
    }

    if (
      seasonality &&
      !Object.values(RecipeSeasonality).includes(seasonality as RecipeSeasonality)
    ) {
      return NextResponse.json("Invalid seasonality value", { status: 400 });
    }

    const recipeDifficultyId = hasDifficultyChange
      ? requestedRecipeDifficultyId
      : undefined;

    if (
      hasDifficultyChange &&
      recipeDifficultyId !== null &&
      typeof recipeDifficultyId !== "string"
    ) {
      return NextResponse.json("Invalid difficulty value", { status: 400 });
    }

    if (typeof recipeDifficultyId === "string" && recipeDifficultyId) {
      const validDifficulty = await db.recipeDifficulty.findUnique({
        where: { id: recipeDifficultyId },
        select: { id: true },
      });

      if (!validDifficulty) {
        return NextResponse.json("Selected difficulty is invalid.", { status: 400 });
      }
    }

    const seasonIds = Array.isArray(requestedSeasonIds)
      ? [...new Set(requestedSeasonIds.filter((value): value is string => typeof value === "string" && Boolean(value)))]
      : undefined;

    if (seasonality === RecipeSeasonality.SEASONAL && (!seasonIds || seasonIds.length === 0)) {
      return NextResponse.json("Select at least one season for a strict seasonal recipe.", { status: 400 });
    }

    if (seasonIds?.length) {
      const validSeasonCount = await db.recipeSeasons.count({
        where: { id: { in: seasonIds } },
      });

      if (validSeasonCount !== seasonIds.length) {
        return NextResponse.json("One or more selected seasons are invalid.", { status: 400 });
      }
    }

    const recipe = await db.$transaction(async (tx) => {
      const updatedRecipe = await tx.recipes.update({
        where: {
          id: recipeId,
        },
        data: {
          ...(title && { title }),
          ...(slug && { slug }),
          ...data,
          ...(hasDifficultyChange && {
            recipeDifficultyId: recipeDifficultyId || null,
          }),
          ...(seasonality && {
            seasonality: seasonality as RecipeSeasonality,
            recipeSeasonsId:
              seasonality === RecipeSeasonality.SEASONAL ? seasonIds?.[0] ?? null : null,
          }),
          ...(hasContentChange && { contentUpdatedAt: new Date() }),
        },
      });

      if (hasDifficultyChange) {
        await tx.recipeDifficultyAssignment.deleteMany({ where: { recipeId } });

        if (typeof recipeDifficultyId === "string" && recipeDifficultyId) {
          await tx.recipeDifficultyAssignment.create({
            data: { recipeId, recipeDifficultyId },
          });
        }
      }

      if (hasSeasonalityChange) {
        await tx.recipeSeasonAssignment.deleteMany({ where: { recipeId } });

        if (seasonality === RecipeSeasonality.SEASONAL && seasonIds?.length) {
          await tx.recipeSeasonAssignment.createMany({
            data: seasonIds.map((recipeSeasonsId) => ({ recipeId, recipeSeasonsId })),
            skipDuplicates: true,
          });
        }
      }

      return updatedRecipe;
    });
    if (recipe.isPublished) {
      revalidatePath("/sitemap.xml");
    }
    return NextResponse.json(recipe, { status: 200 });
  } catch (error) {
    console.log("[RECIPE_ID]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
