export type RecipeSeasonality = "UNREVIEWED" | "ALL_YEAR" | "SEASONAL";

export type RecipeListRecord = {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  description: string | null;
  isPublished: boolean;
  updatedAt: string;
  category: {
    id: string;
    name: string;
  } | null;
  difficulty: {
    id: string;
    title: string;
  } | null;
  seasonality: RecipeSeasonality;
  seasons: Array<{
    id: string;
    title: string;
  }>;
  totalMinutes: number | null;
  auditScore: number;
  auditGrade: "Excellent" | "Good" | "Needs work" | "Weak";
  auditCriticalCount: number;
  auditWarningCount: number;
  ingredientCount: number;
  methodCount: number;
};

export type RecipeFilterOption = {
  id: string;
  label: string;
};

export type RecipeFilters = {
  search: string;
  categoryId: string;
  cuisineId: string;
  mealTimeId: string;
  status: string;
  difficultyId: string;
  seasonality: string;
  seasonId: string;
  cookingMethodId: string;
  allergyId: string;
  nutrientId: string;
  dietTypeId: string;
  recipeTypeId: string;
  bodyTypeId: string;
  ingredientId: string;
  minTime: string;
  maxTime: string;
  auditStatus: string;
};
