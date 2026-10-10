export type RecipeEditorOption = {
  id: string;
  label: string;
};

export type RecipeSeasonality = "UNREVIEWED" | "ALL_YEAR" | "SEASONAL";

export type RecipeEditorIngredient = {
  id: string;
  ingredientId: string;
  quantity: number;
  unitId: string;
  formId: string;
  position: number;
  ingredientName: string;
  unitName: string;
  formName: string;
};

export type RecipeEditorStep = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  position: number;
  isPublished: boolean;
};

export type RecipeEditorRecord = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  recipeCategoriesId: string | null;
  recipeDifficultyId: string | null;
  recipeSeasonsId: string | null;
  seasonality: RecipeSeasonality;
  isPublished: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  metaSlug: string | null;
  recipeCookingTime: {
    prepTime: number;
    cookTime: number;
    restTime: number;
    totalTime?: number;
  } | null;
  views: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  contentUpdatedAt: string | null;
  ingredients: RecipeEditorIngredient[];
  steps: RecipeEditorStep[];
  cuisineIds: string[];
  cookingMethodIds: string[];
  allergyIds: string[];
  mealTimeIds: string[];
  nutrientIds: string[];
  dietTypeIds: string[];
  recipeTypeIds: string[];
  bodyTypeIds: string[];
  seasonIds: string[];
};

export type RecipeEditorOptions = {
  categories: RecipeEditorOption[];
  ingredients: RecipeEditorOption[];
  units: RecipeEditorOption[];
  forms: RecipeEditorOption[];
  difficulties: RecipeEditorOption[];
  seasons: RecipeEditorOption[];
  cuisines: RecipeEditorOption[];
  cookingMethods: RecipeEditorOption[];
  allergies: RecipeEditorOption[];
  mealTimes: RecipeEditorOption[];
  nutrients: RecipeEditorOption[];
  dietTypes: RecipeEditorOption[];
  recipeTypes: RecipeEditorOption[];
  bodyTypes: RecipeEditorOption[];
};
