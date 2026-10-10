import { cache } from "react";

import { db } from "@/lib/db";
import {
  getIngredientCollectionHub,
  ingredientCollectionHubSlugs,
  ingredientCollectionIngredientWhere,
} from "@/lib/ingredient-collection-hubs";
import { recipeCollectionHref } from "@/lib/recipe-collection-url";
import { publishedRecipeWhere } from "@/lib/recipe-publication";

export type RecipeCollectionType =
  | "category"
  | "mealTime"
  | "cuisine"
  | "recipeType"
  | "cookingMethod"
  | "dietType"
  | "ingredient"
  | "season";

export type RecipeCollectionRoute = {
  title: string;
  slug: string;
  type: RecipeCollectionType;
  href: string;
};

const seasonTitlesBySlug: Record<string, string> = {
  summer: "Summer",
  rainy: "Rainy",
  winter: "Winter",
};

const visibleRecipeWhere = {
  ...publishedRecipeWhere(),
  imageUrl: { not: null },
};

function route(title: string, slug: string, type: RecipeCollectionType): RecipeCollectionRoute {
  return {
    title,
    slug,
    type,
    href: recipeCollectionHref(slug),
  };
}

async function seasonRoute(slug: string) {
  const title = seasonTitlesBySlug[slug];
  if (!title) return null;

  const season = await db.recipeSeasons.findFirst({
    where: { title: { equals: title } },
    select: { id: true, title: true },
  });

  if (!season) return null;

  const recipes = await db.recipes.count({
    where: {
      ...visibleRecipeWhere,
      seasonality: "SEASONAL",
      OR: [
        { recipeSeasonsId: season.id },
        { recipeSeasonTags: { some: { recipeSeasonsId: season.id } } },
      ],
    },
  });

  return recipes > 0 ? route(season.title, slug, "season") : null;
}

export const resolveRecipeCollectionRoute = cache(
  async (rawSlug: string): Promise<RecipeCollectionRoute | null> => {
    const slug = decodeURIComponent(rawSlug).trim().toLowerCase();
    if (!slug) return null;

    const season = await seasonRoute(slug);
    if (season) return season;

    const ingredientHub = getIngredientCollectionHub(slug);
    const [category, cuisine, mealTime, recipeType, dietType, cookingMethod, ingredient] =
      await Promise.all([
        db.recipeCategories.findFirst({
          where: {
            isPublished: true,
            slug,
            recipe: { some: visibleRecipeWhere },
          },
          select: { name: true, slug: true },
        }),
        db.cuisines.findFirst({
          where: {
            isPublished: true,
            slug,
            recipeCuisine: { some: { recipe: visibleRecipeWhere } },
          },
          select: { title: true, slug: true },
        }),
        db.mealTimes.findFirst({
          where: {
            isPublished: true,
            slug,
            recipeMealTime: { some: { recipe: visibleRecipeWhere } },
          },
          select: { title: true, slug: true },
        }),
        db.recipeTypes.findFirst({
          where: {
            isPublished: true,
            slug,
            recipeRecipeType: { some: { recipe: visibleRecipeWhere } },
          },
          select: { title: true, slug: true },
        }),
        db.dietTypes.findFirst({
          where: {
            isPublished: true,
            slug,
            recipeDietType: { some: { recipe: visibleRecipeWhere } },
          },
          select: { title: true, slug: true },
        }),
        db.cookingMethods.findFirst({
          where: {
            isPublished: true,
            slug,
            recipeCookingMethod: { some: { recipe: visibleRecipeWhere } },
          },
          select: { title: true, slug: true },
        }),
        db.ingredients.findFirst({
          where: {
            ...ingredientCollectionIngredientWhere(slug),
            RecipeIngredients: { some: { recipe: visibleRecipeWhere } },
          },
          select: { name: true, slug: true },
        }),
      ]);

    if (category) return route(category.name, category.slug, "category");
    if (cuisine) return route(cuisine.title, cuisine.slug, "cuisine");
    if (mealTime) return route(mealTime.title, mealTime.slug, "mealTime");
    if (recipeType) return route(recipeType.title, recipeType.slug, "recipeType");
    if (dietType) return route(dietType.title, dietType.slug, "dietType");
    if (cookingMethod) return route(cookingMethod.title, cookingMethod.slug, "cookingMethod");
    if (ingredientHub && ingredient) {
      return route(ingredientHub.title, ingredientHub.slug, "ingredient");
    }
    if (ingredient?.slug) return route(ingredient.name, ingredient.slug, "ingredient");

    return null;
  },
);

export const getPublishedRecipeCollectionRoutes = cache(async () => {
  const [
    categories,
    cuisines,
    mealTimes,
    recipeTypes,
    dietTypes,
    cookingMethods,
    ingredientHubs,
  ] =
    await Promise.all([
      db.recipeCategories.findMany({
        where: { isPublished: true, recipe: { some: visibleRecipeWhere } },
        select: { name: true, slug: true },
      }),
      db.cuisines.findMany({
        where: { isPublished: true, recipeCuisine: { some: { recipe: visibleRecipeWhere } } },
        select: { title: true, slug: true },
      }),
      db.mealTimes.findMany({
        where: { isPublished: true, recipeMealTime: { some: { recipe: visibleRecipeWhere } } },
        select: { title: true, slug: true },
      }),
      db.recipeTypes.findMany({
        where: { isPublished: true, recipeRecipeType: { some: { recipe: visibleRecipeWhere } } },
        select: { title: true, slug: true },
      }),
      db.dietTypes.findMany({
        where: { isPublished: true, recipeDietType: { some: { recipe: visibleRecipeWhere } } },
        select: { title: true, slug: true },
      }),
      db.cookingMethods.findMany({
        where: { isPublished: true, recipeCookingMethod: { some: { recipe: visibleRecipeWhere } } },
        select: { title: true, slug: true },
      }),
      Promise.all(
        ingredientCollectionHubSlugs.map(async (slug) => {
          const hub = getIngredientCollectionHub(slug);
          if (!hub) return null;

          const recipes = await db.recipes.count({
            where: {
              ...visibleRecipeWhere,
              recipeIngredients: {
                some: { ingredient: ingredientCollectionIngredientWhere(slug) },
              },
            },
          });

          return recipes > 0 ? route(hub.title, hub.slug, "ingredient") : null;
        }),
      ),
    ]);

  const seasons = (
    await Promise.all(Object.keys(seasonTitlesBySlug).map((slug) => seasonRoute(slug)))
  ).filter((item): item is RecipeCollectionRoute => Boolean(item));
  const ingredientRoutes = ingredientHubs.filter(
    (item): item is RecipeCollectionRoute => Boolean(item),
  );

  return [
    ...seasons,
    ...ingredientRoutes,
    ...categories.map((item) => route(item.name, item.slug, "category")),
    ...cuisines.map((item) => route(item.title, item.slug, "cuisine")),
    ...mealTimes.map((item) => route(item.title, item.slug, "mealTime")),
    ...recipeTypes.map((item) => route(item.title, item.slug, "recipeType")),
    ...dietTypes.map((item) => route(item.title, item.slug, "dietType")),
    ...cookingMethods.map((item) => route(item.title, item.slug, "cookingMethod")),
  ];
});
