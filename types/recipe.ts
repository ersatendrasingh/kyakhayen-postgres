import {
  Comment,
  CookingMethods,
  Cuisines,
  IngredientUnitMeasurements,
  Ingredients,
  IngredientsForm,
  Nutrient,
  RecipeCategories,
  RecipeCookingTime,
  RecipeDifficulty,
  RecipeIngredients,
  RecipeMethods,
  RecipeSeasons,
  RecipeSeasonAssignment,
  Recipes,
  Review,
  Units,
  recipeMealTime,
} from "@prisma/client";
import type { PublicCommentUser } from "@/types/comment";

type RecipeCookingMethod = {
  id: string;
  cookingMethodId: string;
  recipeId: string;
  cookingMethod: CookingMethods;
};

type RecipeCuisines = {
  id: string;
  cuisineId: string;
  recipeId: string;
  cuisine: Cuisines;
};

type RecipeDietType = {
  id: string;
  recipeId: string;
  dietTypeId: string;
  dietType: {
    id: string;
    title: string;
    slug: string;
    imageUrl: string | null;
  };
};

type RecipeRecipeType = {
  id: string;
  recipeId: string;
  recipeTypeId: string;
  recipeType: {
    id: string;
    title: string;
    slug: string;
    imageUrl: string | null;
  };
};

type RecipeNutrient = {
  id: string;
  recipeId: string;
  nutrientId: string;
  nutrient: Nutrient;
};

type RecipeReview = Review & {
  user?: PublicCommentUser | null;
};

export type RecipeIngredientType = RecipeIngredients & {
  unit?: Units;
  ingredientForm?: IngredientsForm;
  ingredient: Ingredients & {
    IngredientUnitMeasurements: IngredientUnitMeasurements[];
  };
};

export type RecipeWithCategory = Recipes & {
  RecipeCategories: RecipeCategories | null;
  recipeIngredients: RecipeIngredientType[];
  recipeMethods: RecipeMethods[];
  recipeCookingTime: RecipeCookingTime | null;
  recipeDietType: RecipeDietType[] | null;
  recipeRecipeType: RecipeRecipeType[] | null;
  recipeDifficulty: RecipeDifficulty | null;
  recipeSeasons: RecipeSeasons | null;
  recipeSeasonTags?: (RecipeSeasonAssignment & { season?: RecipeSeasons })[] | null;
  recipeCookingMethods: RecipeCookingMethod[] | null;
  recipeCuisine: RecipeCuisines[] | null;
  recipeNutrient: RecipeNutrient[] | null;
  recipeMealTime: recipeMealTime[] | null;
  recipeComments: Comment[] | null;
  Review: RecipeReview[] | null;
};
