// filterBySeason.ts

import { RecipeSeasonality } from "@prisma/client";
import { RecipeWithCategory } from "@/types/recipe";
import { monthIsInRange, seasonMonthRange } from "@/lib/season-utils";
import type { RecipeSeasons } from "@prisma/client";

const MIN_REVIEWED_RECIPE_POOL = 24;

export const filterRecipesBySeason = async (
  recipes: RecipeWithCategory[],
  currentMonth: number // Current month as 1-based index
): Promise<RecipeWithCategory[]> => {
  try {
    const filteredRecipes: RecipeWithCategory[] = [];
    const unreviewedRecipes: RecipeWithCategory[] = [];

    for (const recipe of recipes) {
      if (recipe.seasonality === RecipeSeasonality.ALL_YEAR) {
        filteredRecipes.push(recipe);
        continue;
      }

      if (recipe.seasonality === RecipeSeasonality.UNREVIEWED) {
        unreviewedRecipes.push(recipe);
        continue;
      }

      const taggedSeasons: RecipeSeasons[] = [
        ...(recipe.recipeSeasonTags
          ?.map((tag) => tag.season)
          .filter((season): season is RecipeSeasons => Boolean(season)) ?? []),
        ...(recipe.recipeSeasons ? [recipe.recipeSeasons] : []),
      ];
      const matchesSeason = taggedSeasons.some((season) =>
        monthIsInRange(currentMonth, seasonMonthRange(season.title)),
      );

      if (matchesSeason) {
        filteredRecipes.push(recipe);
      }
    }

    if (filteredRecipes.length < MIN_REVIEWED_RECIPE_POOL) {
      return [...filteredRecipes, ...unreviewedRecipes];
    }

    return filteredRecipes;
  } catch (error) {
    console.error("[filterRecipesBySeason] Error:", error);
    throw error;
  }
};
