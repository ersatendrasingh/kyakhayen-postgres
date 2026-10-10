"use server";
import { RecipeWithCategory } from "@/types/recipe";
import { GetRecipes } from "@/actions/get-recipes";
import { db } from "@/lib/db";
import { filterRecipesBySeason } from "./filterBySeason";
import { getFoodPreferenceCategoryIds } from "@/lib/recipe-category-compatibility";

const MIN_REVIEWED_RECIPE_POOL = 24;

export const filterRecipesByUserPreferences = async (
  userId: string
): Promise<RecipeWithCategory[]> => {
  try {
    // Fetch user data with necessary relations
    const userData = await db.user.findUnique({
      where: { id: userId },
      include: {
        userCuisines: true,
        UserAllrgies: true,
        cookingSkill: true,
      },
    });

    if (!userData) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    const currentMonth = new Date().getMonth() + 1;

    // Fetch all recipes
    const allRecipes = (await GetRecipes({})).filter(
      (recipe) =>
        !recipe.recipeRecipeType?.some(
          (item) => item.recipeType.slug === "desserts",
        ),
    );

    // Fetch all recipe categories and create a category map
    const recipeCategories = await db.recipeCategories.findMany({
      where: { isPublished: true },
    });
    const categoryMap = recipeCategories.reduce((map, category) => {
      map[category.slug] = category.id;
      if (category.slug === "egg") {
        map.eggetarian = category.id;
      }
      if (category.slug === "non-veg") {
        map["non veg"] = category.id;
      }
      return map;
    }, {} as { [key: string]: string });
    const categorySlugById = recipeCategories.reduce((map, category) => {
      map[category.id] = category.slug;
      return map;
    }, {} as { [key: string]: string });

    // Extract user preference IDs from related tables
    const userAllergyIds = userData.UserAllrgies.map(
      (allergy) => allergy.allergyId
    );
    const userCuisineIds = userData.userCuisines.map(
      (cuisine) => cuisine.cuisineId
    );
    // Fetch recipe-related data
    const recipeAllergies = await db.recipeAllergies.findMany();
    const recipeCuisines = await db.recipeCuisines.findMany();

    // Create maps for filtering
    const recipeAllergyMap = recipeAllergies.reduce((map, allergy) => {
      if (!map[allergy.recipeId]) {
        map[allergy.recipeId] = [];
      }
      map[allergy.recipeId].push(allergy.allergyId);
      return map;
    }, {} as { [key: string]: string[] });

    const recipeCuisineMap = recipeCuisines.reduce((map, cuisine) => {
      if (!map[cuisine.recipeId]) {
        map[cuisine.recipeId] = [];
      }
      map[cuisine.recipeId].push(cuisine.cuisineId);
      return map;
    }, {} as { [key: string]: string[] });
    const selectedPreferenceSlug = userData.foodPreferenceId
      ? categorySlugById[userData.foodPreferenceId]
      : undefined;
    const allowedCategoryIds = selectedPreferenceSlug
      ? getFoodPreferenceCategoryIds(selectedPreferenceSlug, categoryMap)
      : [];

    const preferenceFilteredRecipes = allRecipes.filter((recipe) => {
      // Check if recipe matches user's food preferences

      const recipeCategoryId = recipe.recipeCategoriesId;
      const matchesFoodPreference =
        typeof recipeCategoryId === "string" &&
        allowedCategoryIds.includes(recipeCategoryId);

      // Check if recipe contains any allergens
      const containsAllergens = recipeAllergyMap[recipe.id]?.some((allergyId) =>
        userAllergyIds.includes(allergyId)
      );

      // Check if recipe matches user's preferred cuisines
      const matchesCuisinePreference = recipeCuisineMap[recipe.id]?.some(
        (cuisineId) => userCuisineIds.includes(cuisineId)
      );

      const matchesAnyPreference =
        matchesFoodPreference &&
        !containsAllergens &&
        (userCuisineIds.length === 0 || matchesCuisinePreference);

      return matchesAnyPreference;
    });

    const userSkillPosition = userData.cookingSkill?.position ?? null;
    const reviewedDifficultyRecipes = preferenceFilteredRecipes.filter((recipe) => {
      if (!recipe.recipeDifficulty?.position) return false;
      if (!userSkillPosition) return true;
      return recipe.recipeDifficulty.position <= userSkillPosition;
    });
    const difficultyFallbackRecipes = preferenceFilteredRecipes.filter(
      (recipe) => !recipe.recipeDifficulty?.position
    );
    const filteredRecipes =
      reviewedDifficultyRecipes.length >= MIN_REVIEWED_RECIPE_POOL
        ? reviewedDifficultyRecipes
        : [...reviewedDifficultyRecipes, ...difficultyFallbackRecipes];

    // Filter recipes by season
    const filteredRecipesBySeason = await filterRecipesBySeason(
      filteredRecipes,
      currentMonth
    );

    return filteredRecipesBySeason;
  } catch (error) {
    console.error("[filterRecipesByUserPreferences] Error:", error);
    throw error;
  }
};
