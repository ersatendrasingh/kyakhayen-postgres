"use server";

import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { getRecipeCategoryWhereForBrowse } from "@/lib/recipe-category-compatibility";
import { publishedRecipeWhere } from "@/lib/recipe-publication";
import { RecipeWithCategory } from "@/types/recipe";

type GetRecipes = {
  title?: string;
  searchSlug?: string;
  searchType?: "category" | "mealTime";
  page?: number;
  pageSize?: number;
};

const PAGE_SIZE = 8; // Default page size

export const getPopularRecipes = async ({
  title,
  searchSlug,
  searchType,
  page = 1,
  pageSize = PAGE_SIZE,
}: GetRecipes): Promise<{
  recipes: RecipeWithCategory[];
  hasMore: boolean;
}> => {
  try {
    const whereClause: Prisma.RecipesWhereInput = publishedRecipeWhere();

    if (title) {
      whereClause.title = {
        contains: title,
      };
    }

    if (searchType && searchSlug) {
      if (searchType === "category") {
        const categoryWhere = await getRecipeCategoryWhereForBrowse(searchSlug);

        if (!categoryWhere) {
          return { recipes: [], hasMore: false };
        }

        Object.assign(whereClause, categoryWhere);
      } else if (searchType === "mealTime") {
        const mealTime = await db.mealTimes.findFirst({
          where: { slug: searchSlug, isPublished: true },
        });

        if (!mealTime) {
          return { recipes: [], hasMore: false };
        }

        whereClause.recipeMealTime = {
          some: { mealTimeId: mealTime.id },
        };
      }
    }

    // Fetch the total count of recipes
    const totalRecipesCount = await db.recipes.count({
      where: whereClause,
    });

    // Fetch the recipes with pagination
    const recipes = await db.recipes.findMany({
      where: whereClause,
      include: {
        RecipeCategories: {
          select: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
            isPublished: true,
            position: true,
          },
        },
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
        Review: true, // Include Review to match the RecipeWithCategory type
        recipeComments: true, // Include recipeComments to match the RecipeWithCategory type
      },
      orderBy: {
        contentUpdatedAt: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const hasMore = page * pageSize < totalRecipesCount;

    return { recipes, hasMore };
  } catch (error) {
    console.error("[GET_RECIPES_ERROR]", error);
    return { recipes: [], hasMore: false };
  }
};
