"use server";

import { db } from "@/lib/db";
import { RecipeWithCategory } from "@/types/recipe";

export const getRecipes = async (): Promise<RecipeWithCategory[]> => {
  try {
    const recipes = await db.recipes.findMany({
      include: {
        RecipeCategories: true,
        recipeIngredients: {
          include: {
            unit: true,
            ingredientForm: true,
            ingredient: {
              include: {
                IngredientUnitMeasurements: true,
              },
            },
          },
          orderBy: {
            position: "asc",
          },
        },
        recipeMethods: {
          orderBy: {
            position: "asc",
          },
        },
        recipeCookingMethods: {
          include: {
            cookingMethod: true,
          },
        },
        recipeCuisine: {
          include: {
            cuisine: true,
          },
        },
        recipeDietType: {
          where: {
            dietType: {
              isPublished: true,
            },
          },
          include: {
            dietType: true,
          },
        },
        recipeRecipeType: {
          where: {
            recipeType: {
              isPublished: true,
            },
          },
          include: {
            recipeType: true,
          },
        },
        recipeNutrient: {
          where: {
            nutrient: {
              isPublished: true,
            },
          },
          include: {
            nutrient: true,
          },
        },
        recipeCookingTime: true,
        recipeMealTime: true,
        recipeDifficulty: true,
        recipeSeasons: true,
        recipeSeasonTags: {
          include: { season: true },
        },
        Review: true,
        recipeComments: {
          where: {
            isPublished: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        title: "asc",
      },
    });

    return recipes;
  } catch (error) {
    console.error("[GET_ALL_RECIPES]", error);
    return [];
  }
};
