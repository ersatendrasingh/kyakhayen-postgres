import type { LucideIcon } from "lucide-react";

export type SituationKey = "ingredients" | "daily" | "guests" | "budget" | "moms";

export type Situation = {
  key: SituationKey;
  title: string;
  shortTitle: string;
  prompt: string;
  icon: LucideIcon;
};

export type IngredientSuggestion = {
  id: string;
  label: string;
  value: string;
  recipeCount: number;
};

export type SituationRecipe = {
  id: string;
  title: string;
  slug: string;
  metaSlug: string | null;
  imageUrl: string | null;
  matchLabel?: string;
  RecipeCategories: { name: string; slug?: string | null } | null;
  recipeCookingTime: {
    prepTime: number;
    cookTime: number;
    restTime: number;
  } | null;
  recipeNutrient?: Array<{ nutrient: { title: string } }> | null;
  recipeIngredients?: Array<{
    ingredient: {
      name: string;
      slug?: string | null;
      IngredientCategories?: { slug: string } | null;
    };
  }> | null;
  recipeMealTime?: Array<{ mealTime: { title: string; slug: string } }> | null;
  recipeCuisine?: Array<{
    cuisine: { title: string; slug?: string | null };
  }> | null;
  recipeRecipeType?: Array<{
    recipeType: { title: string; slug: string };
  }> | null;
  ingredientCount?: number;
  estimatedCostInr?: number | null;
  costConfidence?: number;
  pricedIngredientCount?: number;
  missingPriceCount?: number;
  missingConversionCount?: number;
};

export type RecipeSuggestion = {
  key: string;
  title: string;
  meta: string;
  tag: string;
  badge: string;
  href: string;
  imageUrl: string;
  context: string;
};

export type ResultCopy = {
  heading: string;
  subheading: string;
  highlights: string[];
  quickTip: string;
  emptyTitle: string;
  emptyBody: string;
};

export type RecipePagination = {
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type InitialRecipePage = RecipePagination & {
  recipes: SituationRecipe[];
};
