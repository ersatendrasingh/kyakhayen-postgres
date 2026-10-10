type RecipeUsage = {
  userId: string;
  date: Date;
  recipeId: string;
};

const recentRecipes: RecipeUsage[] = [];

// Add a recipe to the recent recipes
export const addRecentRecipe = (
  userId: string,
  date: Date,
  recipeId: string
) => {
  recentRecipes.push({ userId, date, recipeId });
};

// Get recent recipes for a user within a specified number of days
export const getRecentRecipes = (userId: string, days: number): string[] => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  return recentRecipes
    .filter((usage) => usage.userId === userId && usage.date >= cutoffDate)
    .map((usage) => usage.recipeId);
};
