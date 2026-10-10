"use server";

import { filterRecipesByUserPreferences } from "@/lib/filterRecipes";
import { RecipeWithCategory } from "@/types/recipe";
import { getRecommendationsBasedOnBehavior } from "@/actions/get-recommendations-based-on-behavior";
import { getRecommendations } from "@/lib/getRecommendations";
import { GetRecipes } from "@/actions/get-recipes";

const PAGE_SIZE = 8; // Define the number of recipes per page

export const getRecommendedRecipes = async (
  page: number = 1,
  userId: string,
  isPersonalized: boolean,
  behaviorData: Record<string, number>,
  categoryData: Record<string, number>
): Promise<{ recipes: RecipeWithCategory[]; hasMore: boolean }> => {
  try {
    let recommendedRecipes: RecipeWithCategory[] = [];

    if (
      userId &&
      Object.keys(behaviorData).length === 0 &&
      Object.keys(categoryData).length === 0
    ) {
      const filteredRecipes = await filterRecipesByUserPreferences(userId);

      recommendedRecipes =
        filteredRecipes.length > 0 ? filteredRecipes : await GetRecipes({});
    } else if (
      userId &&
      Object.keys(behaviorData).length > 0 &&
      Object.keys(categoryData).length > 0
    ) {
      const filteredRecipes = await filterRecipesByUserPreferences(userId);

      const restFilteredRecipes =
        filteredRecipes.length > 0 ? filteredRecipes : await GetRecipes({});
      recommendedRecipes = getRecommendationsBasedOnBehavior(
        restFilteredRecipes,
        behaviorData,
        categoryData
      );
    } else if (
      !userId &&
      (Object.keys(behaviorData).length > 0 ||
        Object.keys(categoryData).length > 0)
    ) {
      const allRecipes = await GetRecipes({});

      recommendedRecipes = getRecommendationsBasedOnBehavior(
        allRecipes,
        behaviorData,
        categoryData
      );
    } else {
      recommendedRecipes = await GetRecipes({});
    }

    // Further refine recommendations using TF-IDF and cosine similarity
    const finalRecommendations = getRecommendations(
      recommendedRecipes,
      page,
      PAGE_SIZE
    );

    // Determine if there are more recipes to load
    const hasMore = page * PAGE_SIZE < recommendedRecipes.length;

    return { recipes: finalRecommendations, hasMore };
  } catch (error) {
    console.error("Error fetching recommended recipes:", error);
    throw error;
  }
};
