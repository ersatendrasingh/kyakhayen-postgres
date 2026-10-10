"use server";

import { db } from "@/lib/db";
import { RecipeWithCategory } from "@/types/recipe";
import { assignRecipesToMealTimes } from "@/helpers/recipeHelpers";
import { addRecentRecipe, getRecentRecipes } from "@/store/recentRecipesStore";
import { filterRecipesByUserPreferences } from "@/lib/filterRecipes";

export const generateRecipesForDate = async (
  userId: string,
  date: Date
): Promise<{ [key: string]: RecipeWithCategory[] } | null> => {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        userCuisines: true,
        UserAllrgies: true,
      },
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    // Fetch meal times (assuming predefined meal times in the database)
    const mealTimes = await db.mealTimes.findMany({
      where: { isPublished: true },
      orderBy: { position: "asc" },
    });

    // Fetch recently used recipes
    const recentRecipeIds = new Set<string>(getRecentRecipes(userId, 6)); // Fetch recipes used in the last 6 days

    // Filter recipes based on user preferences

    const filteredRecipes = await filterRecipesByUserPreferences(userId);

    // Categorize recipes based on their types dynamically
    const categorizedRecipes: { [key: string]: RecipeWithCategory[] } = {};
    filteredRecipes.forEach((recipe) => {
      recipe.recipeRecipeType?.forEach((rt) => {
        const type = rt.recipeType.title;
        if (!categorizedRecipes[type]) {
          categorizedRecipes[type] = [];
        }
        categorizedRecipes[type].push(recipe);
      });
    });

    // Shuffle arrays to ensure randomness
    const shuffleArray = <T,>(array: T[]) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    };

    Object.keys(categorizedRecipes).forEach((type) =>
      shuffleArray(categorizedRecipes[type])
    );

    // Assign recipes to meal times
    const mealsByTime = assignRecipesToMealTimes(
      mealTimes,
      categorizedRecipes,
      recentRecipeIds
    );

    // Save the assigned recipes in the in-memory store
    for (const mealTimeSlug in mealsByTime) {
      const mealRecipes = mealsByTime[mealTimeSlug];
      for (const recipe of mealRecipes) {
        addRecentRecipe(userId, date, recipe.id);
      }
    }

    // Return recipes for the given date
    return mealsByTime;
  } catch (error) {
    console.error("Error generating recipes for date:", error);
    // Return null or an empty object as appropriate
    return null;
  }
};
