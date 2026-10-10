"use server";

import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import {
  getRecipeCategoryWhereForBrowse,
  getRecipeCategoryWhereForFoodPreference,
} from "@/lib/recipe-category-compatibility";
import { ingredientCollectionIngredientWhere } from "@/lib/ingredient-collection-hubs";
import { publishedRecipeWhere } from "@/lib/recipe-publication";
import type { RecipeWithCategory } from "@/types/recipe";

type GetRecipesInput = {
  title?: string;
  searchSlug?: string;
  searchType?: string;
  foodPreferenceSlug?: string;
};

const recipeInclude = {
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
    orderBy: { position: "asc" },
  },
  recipeMethods: {
    orderBy: { position: "asc" },
  },
  recipeCookingMethods: {
    include: { cookingMethod: true },
  },
  recipeCuisine: {
    include: { cuisine: true },
  },
  recipeDietType: {
    where: { dietType: { isPublished: true } },
    include: { dietType: true },
  },
  recipeRecipeType: {
    where: { recipeType: { isPublished: true } },
    include: { recipeType: true },
  },
  recipeNutrient: {
    where: { nutrient: { isPublished: true } },
    include: { nutrient: true },
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
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
  },
} satisfies Prisma.RecipesInclude;

function excludeDessertsFromCategoryBrowse(where: Prisma.RecipesWhereInput) {
  where.NOT = [
    ...((Array.isArray(where.NOT) ? where.NOT : where.NOT ? [where.NOT] : []) as Prisma.RecipesWhereInput[]),
    { recipeRecipeType: { some: { recipeType: { slug: "desserts" } } } },
  ];
}

export const GetRecipes = async ({
  title,
  searchSlug,
  searchType,
  foodPreferenceSlug,
}: GetRecipesInput): Promise<RecipeWithCategory[]> => {
  try {
    const where: Prisma.RecipesWhereInput = {
      ...publishedRecipeWhere(),
      ...(title ? { title: { contains: title } } : {}),
    };

    if (searchType === "category" && searchSlug) {
      const categoryWhere = await getRecipeCategoryWhereForBrowse(searchSlug);

      if (!categoryWhere) return [];
      Object.assign(where, categoryWhere);
      if (searchSlug !== "desserts") {
        excludeDessertsFromCategoryBrowse(where);
      }
    }

    if (searchType === "mealTime" && searchSlug) {
      const mealTime = await db.mealTimes.findFirst({
        where: { isPublished: true, slug: searchSlug },
        select: { id: true },
      });

      if (!mealTime) return [];
      where.recipeMealTime = { some: { mealTimeId: mealTime.id } };
    }

    if (searchType === "cuisine" && searchSlug) {
      const cuisine = await db.cuisines.findFirst({
        where: { isPublished: true, slug: searchSlug },
        select: { id: true },
      });

      if (!cuisine) return [];
      where.recipeCuisine = { some: { cuisineId: cuisine.id } };
    }

    if (searchType === "recipeType" && searchSlug) {
      const recipeType = await db.recipeTypes.findFirst({
        where: { isPublished: true, slug: searchSlug },
        select: { id: true },
      });

      if (!recipeType) return [];
      where.recipeRecipeType = { some: { recipeTypeId: recipeType.id } };
    }

    if (searchType === "cookingMethod" && searchSlug) {
      const cookingMethod = await db.cookingMethods.findFirst({
        where: { isPublished: true, slug: searchSlug },
        select: { id: true },
      });

      if (!cookingMethod) return [];
      where.recipeCookingMethods = { some: { cookingMethodId: cookingMethod.id } };
    }

    if (searchType === "dietType" && searchSlug) {
      const dietType = await db.dietTypes.findFirst({
        where: { isPublished: true, slug: searchSlug },
        select: { id: true },
      });

      if (!dietType) return [];
      where.recipeDietType = { some: { dietTypeId: dietType.id } };
    }

    if (searchType === "season" && searchSlug) {
      const season = await db.recipeSeasons.findFirst({
        where: { title: { equals: searchSlug } },
        select: { id: true },
      });

      if (!season) return [];
      where.seasonality = "SEASONAL";
      where.OR = [
        { recipeSeasonsId: season.id },
        { recipeSeasonTags: { some: { recipeSeasonsId: season.id } } },
      ];
      if (searchSlug.toLowerCase() === "summer") {
        where.RecipeCategories = { slug: { in: ["veg", "vegan"] } };
      }
    }

    if (searchType === "ingredient" && searchSlug) {
      const ingredients = await db.ingredients.findMany({
        where: ingredientCollectionIngredientWhere(searchSlug),
        select: { id: true },
      });
      const ingredientIds = ingredients.map((ingredient) => ingredient.id);

      if (ingredientIds.length === 0) return [];
      where.recipeIngredients = { some: { ingredientId: { in: ingredientIds } } };
    }

    if (foodPreferenceSlug && searchType !== "category") {
      const foodPreferenceWhere =
        await getRecipeCategoryWhereForFoodPreference(foodPreferenceSlug);

      if (!foodPreferenceWhere) return [];
      Object.assign(where, foodPreferenceWhere);
    }

    return await db.recipes.findMany({
      where,
      include: recipeInclude,
      orderBy: [{ contentUpdatedAt: "desc" }, { updatedAt: "desc" }],
    });
  } catch (error) {
    console.error("[GET_RECIPES]", error);
    return [];
  }
};
