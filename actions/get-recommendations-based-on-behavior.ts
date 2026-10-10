import { RecipeWithCategory } from "@/types/recipe";

export function getRecommendationsBasedOnBehavior(
  allRecipes: RecipeWithCategory[],
  behaviorData: Record<string, number>,
  categoryData: Record<string, number>
): RecipeWithCategory[] {
  const weightedRecipes = allRecipes.map((recipe) => {
    let weight = 0;

    if (behaviorData[recipe.id]) {
      weight += behaviorData[recipe.id] * 2; // e.g., double the weight for direct interactions
    }

    // Increase weight based on category interactions
    if (categoryData[recipe.RecipeCategories!.id]) {
      weight += categoryData[recipe.RecipeCategories!.id]; // Add the weight based on category interaction
    }

    return { ...recipe, weight };
  });

  // Sort recipes by weight (descending order)
  const sortedRecipes = weightedRecipes.sort((a, b) => b.weight - a.weight);

  // Filter out recipes with zero weight (optional, if no interaction)
  const filteredRecipes = sortedRecipes.filter((recipe) => recipe.weight > 0);

  return filteredRecipes;
}
