// recipeHelpers.ts

import { MealTimes } from "@prisma/client";
import { RecipeWithCategory } from "@/types/recipe";

// Function to assign a unique recipe of a specific type to a meal time
const assignUniqueRecipeByType = (
  type: string,
  mealTime: MealTimes,
  categorizedRecipes: { [key: string]: RecipeWithCategory[] },
  mealsByTime: { [key: string]: RecipeWithCategory[] },
  recentRecipeIds: Set<string>,
  allowRepeatFallback: boolean = false,
  excludeRecipeIds: string[] = [],
  permittedMealTimeIds: string[] = [mealTime.id],
) => {
  if (categorizedRecipes[type]?.length > 0) {
    const recipesOfType = categorizedRecipes[type];

    let availableRecipes = recipesOfType.filter(
      (recipe) =>
        !recentRecipeIds.has(recipe.id) &&
        !excludeRecipeIds.includes(recipe.id) &&
        recipe.recipeMealTime?.some((mt) =>
          permittedMealTimeIds.includes(mt.mealTimeId),
        ),
    );

    if (availableRecipes.length === 0 && allowRepeatFallback) {
      availableRecipes = recipesOfType.filter(
        (recipe) =>
          !excludeRecipeIds.includes(recipe.id) &&
          recipe.recipeMealTime?.some((mt) =>
            permittedMealTimeIds.includes(mt.mealTimeId),
          ),
      );
    }

    if (availableRecipes.length > 0) {
      // Choose a random recipe from available ones
      const randomIndex = Math.floor(Math.random() * availableRecipes.length);
      const selectedRecipe = availableRecipes[randomIndex];

      mealsByTime[mealTime.slug].push(selectedRecipe);
      recentRecipeIds.add(selectedRecipe.id); // Track recently used recipe

      // If this assignment is for dinner, add this recipe to exclude list for dinner
      if (mealTime.title === "Dinner") {
        excludeRecipeIds.push(selectedRecipe.id);
      }
    }
  }
};
export const assignRecipesToMealTimes = (
  mealTimes: MealTimes[],
  categorizedRecipes: { [key: string]: RecipeWithCategory[] },
  recentRecipeIds: Set<string>
): { [key: string]: RecipeWithCategory[] } => {
  const mealsByTime: { [key: string]: RecipeWithCategory[] } = {};

  try {
    const morningPoolIds = mealTimes
      .filter((time) => ["Early Morning", "Breakfast", "Mid Morning"].includes(time.title))
      .map((time) => time.id);

    mealTimes.forEach((time) => {
      mealsByTime[time.slug] = [];

      switch (time.title) {
        case "Early Morning":
          assignUniqueRecipeByType(
            "Beverage/Smoothie",
            time,
            categorizedRecipes,
            mealsByTime,
            recentRecipeIds,
            true,
            [],
            morningPoolIds,
          );
          break;

        case "Breakfast":
          assignUniqueRecipeByType(
            "Meal",
            time,
            categorizedRecipes,
            mealsByTime,
            recentRecipeIds
          );
          assignUniqueRecipeByType(
            "Protein",
            time,
            categorizedRecipes,
            mealsByTime,
            recentRecipeIds
          );
          break;

        case "Mid Morning":
          assignUniqueRecipeByType(
            "Fruit Salad",
            time,
            categorizedRecipes,
            mealsByTime,
            recentRecipeIds
          );
          assignUniqueRecipeByType(
            "Beverage/Smoothie",
            time,
            categorizedRecipes,
            mealsByTime,
            recentRecipeIds
          );
          break;

        case "Lunch":
          assignUniqueRecipeByType(
            "Cooked Vegetable",
            time,
            categorizedRecipes,
            mealsByTime,
            recentRecipeIds
          );
          assignUniqueRecipeByType(
            "Grains",
            time,
            categorizedRecipes,
            mealsByTime,
            recentRecipeIds
          );
          assignUniqueRecipeByType(
            "Vegetable Salad",
            time,
            categorizedRecipes,
            mealsByTime,
            recentRecipeIds
          );
          assignUniqueRecipeByType(
            "Protein",
            time,
            categorizedRecipes,
            mealsByTime,
            recentRecipeIds,
            true
          ); // Rice is optional
          break;

        case "Evening":
          assignUniqueRecipeByType(
            "Snacks",
            time,
            categorizedRecipes,
            mealsByTime,
            recentRecipeIds
          );
          assignUniqueRecipeByType(
            "Fruit Salad",
            time,
            categorizedRecipes,
            mealsByTime,
            recentRecipeIds
          );
          assignUniqueRecipeByType(
            "Beverage/Smoothie",
            time,
            categorizedRecipes,
            mealsByTime,
            recentRecipeIds
          );
          break;

        case "Dinner":
          // For dinner, pass lunch recipes as usedRecipeIds to exclude them
          const lunchRecipes = mealsByTime["lunch"] || [];
          const usedRecipeIds = lunchRecipes.map((recipe) => recipe.id);

          assignUniqueRecipeByType(
            "Cooked Vegetable",
            time,
            categorizedRecipes,
            mealsByTime,
            recentRecipeIds,
            false,
            usedRecipeIds
          );
          assignUniqueRecipeByType(
            "Grains",
            time,
            categorizedRecipes,
            mealsByTime,
            recentRecipeIds,
            false,
            usedRecipeIds
          );
          assignUniqueRecipeByType(
            "Vegetable Salad",
            time,
            categorizedRecipes,
            mealsByTime,
            recentRecipeIds,
            false,
            usedRecipeIds
          );
          assignUniqueRecipeByType(
            "Protein",
            time,
            categorizedRecipes,
            mealsByTime,
            recentRecipeIds,
            true,
            usedRecipeIds
          ); // Rice is optional
          break;

        default:
          console.log(`No specific logic for ${time.title}`);
          break;
      }
    });
  } catch (error) {
    console.error("Error assigning recipes to meal times:", error);
  }

  return mealsByTime;
};
