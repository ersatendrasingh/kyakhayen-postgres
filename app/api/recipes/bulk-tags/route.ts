import { NextResponse } from "next/server";
import { RecipeSeasonality } from "@prisma/client";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

function uniqueStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const strings = value.filter(
    (entry): entry is string => typeof entry === "string" && Boolean(entry)
  );
  return Array.from(new Set(strings));
}

export async function PATCH(req: Request) {
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const payload = await req.json();
    const recipeIds = uniqueStrings(payload.recipeIds);

    if (!recipeIds.length) {
      return NextResponse.json("Select at least one recipe.", { status: 400 });
    }

    if (recipeIds.length > 200) {
      return NextResponse.json("Update up to 200 recipes at a time.", { status: 400 });
    }

    const hasDifficultyChange = Object.prototype.hasOwnProperty.call(
      payload,
      "recipeDifficultyId"
    );
    const hasSeasonalityChange = Object.prototype.hasOwnProperty.call(
      payload,
      "seasonality"
    );

    if (!hasDifficultyChange && !hasSeasonalityChange) {
      return NextResponse.json("Choose at least one tag to update.", { status: 400 });
    }

    const existingRecipeCount = await db.recipes.count({
      where: { id: { in: recipeIds } },
    });

    if (existingRecipeCount !== recipeIds.length) {
      return NextResponse.json("One or more selected recipes were not found.", { status: 404 });
    }

    const recipeDifficultyId = hasDifficultyChange
      ? payload.recipeDifficultyId
      : undefined;

    if (
      hasDifficultyChange &&
      recipeDifficultyId !== null &&
      typeof recipeDifficultyId !== "string"
    ) {
      return NextResponse.json("Invalid difficulty value.", { status: 400 });
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

    const seasonality = hasSeasonalityChange ? payload.seasonality : undefined;

    if (hasSeasonalityChange && typeof seasonality !== "string") {
      return NextResponse.json("Invalid season use value.", { status: 400 });
    }

    if (
      seasonality &&
      !Object.values(RecipeSeasonality).includes(seasonality as RecipeSeasonality)
    ) {
      return NextResponse.json("Invalid season use value.", { status: 400 });
    }

    const seasonIds = uniqueStrings(payload.seasonIds);

    if (seasonality === RecipeSeasonality.SEASONAL && seasonIds.length === 0) {
      return NextResponse.json("Select at least one season for strict seasonal recipes.", {
        status: 400,
      });
    }

    if (seasonIds.length) {
      const validSeasonCount = await db.recipeSeasons.count({
        where: { id: { in: seasonIds } },
      });

      if (validSeasonCount !== seasonIds.length) {
        return NextResponse.json("One or more selected seasons are invalid.", { status: 400 });
      }
    }

    const updated = await db.$transaction(async (tx) => {
      const result = await tx.recipes.updateMany({
        where: { id: { in: recipeIds } },
        data: {
          ...(hasDifficultyChange && {
            recipeDifficultyId: recipeDifficultyId || null,
          }),
          ...(seasonality && {
            seasonality: seasonality as RecipeSeasonality,
            recipeSeasonsId:
              seasonality === RecipeSeasonality.SEASONAL ? seasonIds[0] : null,
          }),
          contentUpdatedAt: new Date(),
        },
      });

      if (hasDifficultyChange) {
        await tx.recipeDifficultyAssignment.deleteMany({
          where: { recipeId: { in: recipeIds } },
        });

        if (typeof recipeDifficultyId === "string" && recipeDifficultyId) {
          await tx.recipeDifficultyAssignment.createMany({
            data: recipeIds.map((recipeId) => ({ recipeId, recipeDifficultyId })),
            skipDuplicates: true,
          });
        }
      }

      if (hasSeasonalityChange) {
        await tx.recipeSeasonAssignment.deleteMany({
          where: { recipeId: { in: recipeIds } },
        });

        if (seasonality === RecipeSeasonality.SEASONAL) {
          await tx.recipeSeasonAssignment.createMany({
            data: recipeIds.flatMap((recipeId) =>
              seasonIds.map((recipeSeasonsId) => ({ recipeId, recipeSeasonsId }))
            ),
            skipDuplicates: true,
          });
        }
      }

      return result.count;
    });

    return NextResponse.json({ updated }, { status: 200 });
  } catch (error) {
    console.log("[RECIPES_BULK_TAGS]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
