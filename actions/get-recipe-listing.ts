"use server";

import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import type { RecipeCardRecipe } from "@/components/recipes/recipe-card";
import {
  getRecipeCategoryWhereForBrowse,
  getRecipeCategoryWhereForFoodPreference,
} from "@/lib/recipe-category-compatibility";
import { ingredientCollectionIngredientWhere } from "@/lib/ingredient-collection-hubs";
import { publishedRecipeWhere } from "@/lib/recipe-publication";

export type RecipeListingFilters = {
  searchSlug?: string;
  searchType?: string;
  foodPreferenceSlug?: string;
};

type RecipeListingPageInput = RecipeListingFilters & {
  cursor?: string | null;
  limit?: number;
};

export type RecipeListingPage = {
  recipes: RecipeCardRecipe[];
  nextCursor: string | null;
};

const listingInclude = {
  RecipeCategories: {
    select: { id: true, name: true },
  },
  recipeCookingTime: true,
  recipeCuisine: {
    include: { cuisine: true },
    take: 1,
  },
  recipeNutrient: {
    where: { nutrient: { isPublished: true } },
    include: { nutrient: true },
    take: 1,
  },
  Review: {
    select: { rating: true },
  },
} satisfies Prisma.RecipesInclude;

function excludeDessertsFromCategoryBrowse(where: Prisma.RecipesWhereInput) {
  where.NOT = [
    ...((Array.isArray(where.NOT) ? where.NOT : where.NOT ? [where.NOT] : []) as Prisma.RecipesWhereInput[]),
    { recipeRecipeType: { some: { recipeType: { slug: "desserts" } } } },
  ];
}

async function buildListingWhere({
  searchSlug,
  searchType,
  foodPreferenceSlug,
}: RecipeListingFilters): Promise<Prisma.RecipesWhereInput | null> {
  const where: Prisma.RecipesWhereInput = {
    ...publishedRecipeWhere(),
    imageUrl: { not: null },
  };

  if (searchType === "category" && searchSlug) {
    const categoryWhere = await getRecipeCategoryWhereForBrowse(searchSlug);

    if (!categoryWhere) return null;
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

    if (!mealTime) return null;
    where.recipeMealTime = { some: { mealTimeId: mealTime.id } };
  }

  if (searchType === "cuisine" && searchSlug) {
    const cuisine = await db.cuisines.findFirst({
      where: { isPublished: true, slug: searchSlug },
      select: { id: true },
    });

    if (!cuisine) return null;
    where.recipeCuisine = { some: { cuisineId: cuisine.id } };
  }

  if (searchType === "recipeType" && searchSlug) {
    const recipeType = await db.recipeTypes.findFirst({
      where: { isPublished: true, slug: searchSlug },
      select: { id: true },
    });

    if (!recipeType) return null;
    where.recipeRecipeType = { some: { recipeTypeId: recipeType.id } };
  }

  if (searchType === "cookingMethod" && searchSlug) {
    const cookingMethod = await db.cookingMethods.findFirst({
      where: { isPublished: true, slug: searchSlug },
      select: { id: true },
    });

    if (!cookingMethod) return null;
    where.recipeCookingMethods = { some: { cookingMethodId: cookingMethod.id } };
  }

  if (searchType === "dietType" && searchSlug) {
    const dietType = await db.dietTypes.findFirst({
      where: { isPublished: true, slug: searchSlug },
      select: { id: true },
    });

    if (!dietType) return null;
    where.recipeDietType = { some: { dietTypeId: dietType.id } };
  }

  if (searchType === "season" && searchSlug) {
    const season = await db.recipeSeasons.findFirst({
      where: { title: { equals: searchSlug } },
      select: { id: true },
    });

    if (!season) return null;
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

    if (ingredientIds.length === 0) return null;
    where.recipeIngredients = { some: { ingredientId: { in: ingredientIds } } };
  }

  if (foodPreferenceSlug && searchType !== "category") {
    const foodPreferenceWhere =
      await getRecipeCategoryWhereForFoodPreference(foodPreferenceSlug);

    if (!foodPreferenceWhere) return null;
    Object.assign(where, foodPreferenceWhere);
  }

  return where;
}

export const GetRecipeListingPage = async ({
  cursor,
  limit = 12,
  ...filters
}: RecipeListingPageInput): Promise<RecipeListingPage> => {
  try {
    const where = await buildListingWhere(filters);
    if (!where) return { recipes: [], nextCursor: null };

    const recipes = await db.recipes.findMany({
      where,
      include: listingInclude,
      orderBy: [{ contentUpdatedAt: "desc" }, { updatedAt: "desc" }, { id: "desc" }],
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : undefined,
      take: limit + 1,
    });
    const hasMore = recipes.length > limit;
    const visibleRecipes = hasMore ? recipes.slice(0, limit) : recipes;

    return {
      recipes: visibleRecipes,
      nextCursor: hasMore ? visibleRecipes.at(-1)?.id || null : null,
    };
  } catch (error) {
    console.error("[GET_RECIPE_LISTING_PAGE]", error);
    return { recipes: [], nextCursor: null };
  }
};

export const GetRecipeListingHeroRecipes = async ({
  limit = 4,
  ...filters
}: RecipeListingFilters & { limit?: number }): Promise<RecipeCardRecipe[]> => {
  try {
    const where = await buildListingWhere(filters);
    if (!where) return [];

    return await db.recipes.findMany({
      where,
      include: listingInclude,
      orderBy: [
        { views: "desc" },
        { contentUpdatedAt: "desc" },
        { updatedAt: "desc" },
        { id: "desc" },
      ],
      take: limit,
    });
  } catch (error) {
    console.error("[GET_RECIPE_LISTING_HERO_RECIPES]", error);
    return [];
  }
};
