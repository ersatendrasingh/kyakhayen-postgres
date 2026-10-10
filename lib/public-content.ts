import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { publishedRecipeAnd, publishedRecipeWhere } from "@/lib/recipe-publication";
import { articleHref, recipeHref } from "@/lib/seo";
import type { PostWithCategory } from "@/types/article";
import type { RecipeWithCategory } from "@/types/recipe";

const PUBLIC_CONTENT_REVALIDATE_SECONDS = 15 * 60;

export type RecipeSidebarTaxonomyItem = {
  id: string;
  name?: string;
  title?: string;
  slug: string;
  imageUrl: string | null;
};

const publicRecipeInclude = {
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
    where: { isPublished: true },
    orderBy: { position: "asc" },
  },
  recipeRecipeType: {
    where: { recipeType: { isPublished: true } },
    include: { recipeType: true },
  },
  recipeDietType: {
    where: { dietType: { isPublished: true } },
    include: { dietType: true },
  },
  recipeNutrient: {
    where: { nutrient: { isPublished: true } },
    include: { nutrient: true },
  },
  recipeCookingMethods: {
    include: { cookingMethod: true },
  },
  recipeCuisine: {
    include: { cuisine: true },
  },
  recipeCookingTime: true,
  recipeMealTime: true,
  recipeDifficulty: true,
  recipeSeasons: true,
  recipeSeasonTags: {
    include: { season: true },
  },
  recipeComments: {
    where: { isPublished: true },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  },
  Review: {
    where: { isPublished: true },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  },
} satisfies Prisma.RecipesInclude;

const publicRecipeMetadataInclude = {
  RecipeCategories: true,
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
} satisfies Prisma.RecipesInclude;

const publicArticleInclude = {
  PostCategory: {
    include: { category: true },
  },
  PostTag: {
    include: { tag: true },
  },
  articleComments: {
    where: { isPublished: true },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  },
} satisfies Prisma.PostInclude;

const publicArticleMetadataInclude = {
  PostCategory: {
    include: { category: true },
  },
  PostTag: {
    include: { tag: true },
  },
} satisfies Prisma.PostInclude;

function routeSlugCandidates(routeSlug: string) {
  const parts = routeSlug.split("-").filter(Boolean);
  const candidates = [{ slug: routeSlug, metaSlug: null as string | null }];

  for (let index = 1; index < parts.length; index += 1) {
    candidates.push({
      slug: parts.slice(0, index).join("-"),
      metaSlug: parts.slice(index).join("-"),
    });
  }

  return candidates;
}

function trimRoutePath(path: string) {
  return path.replace(/^\//, "");
}

function normalizeRecipe(recipe: Prisma.RecipesGetPayload<{ include: typeof publicRecipeInclude }>): RecipeWithCategory {
  return {
    ...recipe,
    recipeIngredients: recipe.recipeIngredients.map((ingredient) => ({
      ...ingredient,
      quantity: Number(ingredient.quantity),
    })),
  };
}

async function findRecipeByRouteSlug(routeSlug: string) {
  const exactRecipe = await db.recipes.findFirst({
    where: publishedRecipeAnd([{ slug: routeSlug }]),
    include: publicRecipeInclude,
  });

  if (exactRecipe) return normalizeRecipe(exactRecipe);

  const combinedSlugCandidates = routeSlugCandidates(routeSlug)
    .filter((candidate) => candidate.metaSlug)
    .map((candidate) => ({
      slug: candidate.slug,
      metaSlug: candidate.metaSlug as string,
    }));

  if (combinedSlugCandidates.length === 0) return null;

  const recipes = await db.recipes.findMany({
    where: publishedRecipeAnd([
      { slug: { in: combinedSlugCandidates.map((candidate) => candidate.slug) } },
    ]),
    include: publicRecipeInclude,
  });
  const recipe = combinedSlugCandidates
    .map((candidate) =>
      recipes.find(
        (item) =>
          (item.slug === candidate.slug && item.metaSlug === candidate.metaSlug) ||
          trimRoutePath(recipeHref(item)) === routeSlug,
      ),
    )
    .find((item): item is NonNullable<typeof item> => Boolean(item));

  return recipe ? normalizeRecipe(recipe) : null;
}

async function findRecipeMetadataByRouteSlug(routeSlug: string) {
  const exactRecipe = await db.recipes.findFirst({
    where: publishedRecipeAnd([{ slug: routeSlug }]),
    include: publicRecipeMetadataInclude,
  });

  if (exactRecipe) return exactRecipe;

  const combinedSlugCandidates = routeSlugCandidates(routeSlug)
    .filter((candidate) => candidate.metaSlug)
    .map((candidate) => ({
      slug: candidate.slug,
      metaSlug: candidate.metaSlug as string,
    }));

  if (combinedSlugCandidates.length === 0) return null;

  const recipes = await db.recipes.findMany({
    where: publishedRecipeAnd([
      { slug: { in: combinedSlugCandidates.map((candidate) => candidate.slug) } },
    ]),
    include: publicRecipeMetadataInclude,
  });

  return combinedSlugCandidates
    .map((candidate) =>
      recipes.find(
        (item) =>
          (item.slug === candidate.slug && item.metaSlug === candidate.metaSlug) ||
          trimRoutePath(recipeHref(item)) === routeSlug,
      ),
    )
    .find((item): item is NonNullable<typeof item> => Boolean(item)) ?? null;
}

async function findArticleByRouteSlug(routeSlug: string): Promise<PostWithCategory | null> {
  const exactArticle = await db.post.findFirst({
    where: { isPublished: true, slug: routeSlug },
    include: publicArticleInclude,
  });

  if (exactArticle) return exactArticle;

  const combinedSlugCandidates = routeSlugCandidates(routeSlug)
    .filter((candidate) => candidate.metaSlug)
    .map((candidate) => ({
      slug: candidate.slug,
      metaSlug: candidate.metaSlug as string,
    }));

  if (combinedSlugCandidates.length === 0) return null;

  const articles = await db.post.findMany({
    where: {
      isPublished: true,
      slug: { in: combinedSlugCandidates.map((candidate) => candidate.slug) },
    },
    include: publicArticleInclude,
  });

  return (
    combinedSlugCandidates
      .map((candidate) =>
        articles.find(
          (item) =>
            (item.slug === candidate.slug && item.metaSlug === candidate.metaSlug) ||
            trimRoutePath(articleHref(item)) === routeSlug,
        ),
      )
      .find((item): item is NonNullable<typeof item> => Boolean(item)) ?? null
  );
}

async function findArticleMetadataByRouteSlug(routeSlug: string) {
  const exactArticle = await db.post.findFirst({
    where: { isPublished: true, slug: routeSlug },
    include: publicArticleMetadataInclude,
  });

  if (exactArticle) return exactArticle;

  const combinedSlugCandidates = routeSlugCandidates(routeSlug)
    .filter((candidate) => candidate.metaSlug)
    .map((candidate) => ({
      slug: candidate.slug,
      metaSlug: candidate.metaSlug as string,
    }));

  if (combinedSlugCandidates.length === 0) return null;

  const articles = await db.post.findMany({
    where: {
      isPublished: true,
      slug: { in: combinedSlugCandidates.map((candidate) => candidate.slug) },
    },
    include: publicArticleMetadataInclude,
  });

  return (
    combinedSlugCandidates
      .map((candidate) =>
        articles.find(
          (item) =>
            (item.slug === candidate.slug && item.metaSlug === candidate.metaSlug) ||
            trimRoutePath(articleHref(item)) === routeSlug,
        ),
      )
      .find((item): item is NonNullable<typeof item> => Boolean(item)) ?? null
  );
}

export const getPublicRecipeByRouteSlug = unstable_cache(
  findRecipeByRouteSlug,
  ["public-recipe-by-route-slug-v2"],
  {
    revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS,
    tags: ["recipes", "public-content"],
  },
);

export const getPublicRecipeMetadataByRouteSlug = unstable_cache(
  findRecipeMetadataByRouteSlug,
  ["public-recipe-metadata-by-route-slug-v2"],
  {
    revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS,
    tags: ["recipes", "public-content"],
  },
);

export const getPublicArticleByRouteSlug = unstable_cache(
  findArticleByRouteSlug,
  ["public-article-by-route-slug-v2"],
  {
    revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS,
    tags: ["articles", "public-content"],
  },
);

export const getPublicArticleMetadataByRouteSlug = unstable_cache(
  findArticleMetadataByRouteSlug,
  ["public-article-metadata-by-route-slug-v2"],
  {
    revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS,
    tags: ["articles", "public-content"],
  },
);

export const getRecipeSidebarTaxonomy = unstable_cache(
  async (): Promise<{
    recipeCategories: RecipeSidebarTaxonomyItem[];
    recipeMealTimes: RecipeSidebarTaxonomyItem[];
    recipeTypes: RecipeSidebarTaxonomyItem[];
  }> => {
    const recipeImageWhere = {
      ...publishedRecipeWhere(),
      imageUrl: { not: null },
    } satisfies Prisma.RecipesWhereInput;
    const [recipeCategories, recipeMealTimes, recipeTypes] = await Promise.all([
      db.recipeCategories.findMany({
        where: { isPublished: true },
        include: {
          recipe: {
            where: recipeImageWhere,
            select: { imageUrl: true },
            orderBy: [{ views: "desc" }, { updatedAt: "desc" }],
            take: 1,
          },
        },
        orderBy: [{ position: "asc" }, { name: "asc" }],
      }),
      db.mealTimes.findMany({
        where: { isPublished: true },
        include: {
          recipeMealTime: {
            where: { recipe: recipeImageWhere },
            select: { recipe: { select: { imageUrl: true } } },
            orderBy: { recipe: { views: "desc" } },
            take: 1,
          },
        },
        orderBy: [{ position: "asc" }, { title: "asc" }],
      }),
      db.recipeTypes.findMany({
        where: { isPublished: true },
        include: {
          recipeRecipeType: {
            where: { recipe: recipeImageWhere },
            select: { recipe: { select: { imageUrl: true } } },
            orderBy: { recipe: { views: "desc" } },
            take: 1,
          },
        },
        orderBy: [{ position: "asc" }, { title: "asc" }],
      }),
    ]);

    return {
      recipeCategories: recipeCategories.map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        imageUrl: item.imageUrl || item.recipe[0]?.imageUrl || null,
      })),
      recipeMealTimes: recipeMealTimes.map((item) => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        imageUrl: item.imageUrl || item.recipeMealTime[0]?.recipe.imageUrl || null,
      })),
      recipeTypes: recipeTypes.map((item) => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        imageUrl: item.imageUrl || item.recipeRecipeType[0]?.recipe.imageUrl || null,
      })),
    };
  },
  ["recipe-sidebar-taxonomy-v2"],
  {
    revalidate: 60 * 60,
    tags: ["recipes", "navigation"],
  },
);

const relatedRecipeSelect = {
  id: true,
  title: true,
  slug: true,
  metaSlug: true,
  imageUrl: true,
  views: true,
  recipeCategoriesId: true,
  RecipeCategories: { select: { name: true } },
  recipeCookingTime: {
    select: { prepTime: true, cookTime: true, restTime: true },
  },
  recipeIngredients: {
    select: {
      ingredientId: true,
      position: true,
      ingredient: { select: { name: true, slug: true } },
    },
    orderBy: { position: "asc" },
    take: 18,
  },
  recipeRecipeType: {
    where: { recipeType: { isPublished: true } },
    select: { recipeTypeId: true, recipeType: { select: { title: true, slug: true } } },
    take: 5,
  },
  recipeMealTime: {
    where: { mealTime: { isPublished: true } },
    select: { mealTimeId: true, mealTime: { select: { title: true, slug: true } } },
    take: 5,
  },
  recipeCuisine: {
    where: { cuisine: { isPublished: true } },
    select: { cuisineId: true, cuisine: { select: { title: true, slug: true } } },
    take: 4,
  },
  recipeCookingMethods: {
    where: { cookingMethod: { isPublished: true } },
    select: {
      cookingMethodId: true,
      cookingMethod: { select: { title: true, slug: true } },
    },
    take: 5,
  },
  recipeNutrient: {
    where: { nutrient: { isPublished: true } },
    select: { nutrientId: true, nutrient: { select: { title: true, slug: true } } },
    take: 3,
  },
} satisfies Prisma.RecipesSelect;

type RelatedRecipeRecord = Prisma.RecipesGetPayload<{
  select: typeof relatedRecipeSelect;
}>;

const relatedStopTokens = new Set([
  "add",
  "and",
  "best",
  "easy",
  "food",
  "for",
  "fresh",
  "home",
  "homemade",
  "how",
  "indian",
  "make",
  "recipe",
  "style",
  "with",
]);

const genericIngredientSignals = [
  "water",
  "salt",
  "oil",
  "ghee",
  "butter",
  "sugar",
  "jaggery",
  "masala",
  "spice",
  "powder",
  "turmeric",
  "haldi",
  "chilli",
  "chili",
  "cumin",
  "jeera",
  "coriander",
  "dhaniya",
  "ginger",
  "adrak",
  "garlic",
  "lehsun",
  "onion",
  "pyaz",
  "tomato",
  "lemon",
  "lime",
];

function normalizeRelatedText(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function relatedTokens(value: string | null | undefined) {
  return normalizeRelatedText(value)
    .split(/\s+/)
    .filter((token) => token.length >= 3)
    .filter((token) => !relatedStopTokens.has(token));
}

function titleTokenSet(recipe: Pick<RelatedRecipeRecord, "title" | "slug">) {
  return new Set(relatedTokens(`${recipe.title} ${recipe.slug}`));
}

function isGenericIngredient(name: string) {
  const text = normalizeRelatedText(name);
  return genericIngredientSignals.some((signal) => text.includes(signal));
}

function setOverlap(left: Set<string>, right: Set<string>) {
  let count = 0;
  left.forEach((value) => {
    if (right.has(value)) count += 1;
  });
  return count;
}

function idSet<T>(items: T[], pick: (item: T) => string | null | undefined) {
  return new Set(items.map(pick).filter((value): value is string => Boolean(value)));
}

function keyIngredientIds(recipe: RelatedRecipeRecord) {
  const titleTokens = titleTokenSet(recipe);
  const picked: string[] = [];

  for (const item of recipe.recipeIngredients) {
    const ingredientTokens = relatedTokens(`${item.ingredient.name} ${item.ingredient.slug}`);
    const appearsInTitle = ingredientTokens.some((token) => titleTokens.has(token));
    const isEarlyIngredient = item.position === null || item.position <= 8;

    if ((!isGenericIngredient(item.ingredient.name) && isEarlyIngredient) || appearsInTitle) {
      picked.push(item.ingredientId);
    }

    if (picked.length >= 8) break;
  }

  return new Set(picked);
}

function titleIngredientIds(recipe: RelatedRecipeRecord) {
  const titleTokens = titleTokenSet(recipe);
  return new Set(
    recipe.recipeIngredients
      .filter((item) =>
        relatedTokens(`${item.ingredient.name} ${item.ingredient.slug}`).some((token) =>
          titleTokens.has(token),
        ),
      )
      .map((item) => item.ingredientId),
  );
}

function relatedCandidateScore(base: RelatedRecipeRecord, candidate: RelatedRecipeRecord) {
  const baseKeyIngredients = keyIngredientIds(base);
  const candidateKeyIngredients = keyIngredientIds(candidate);
  const baseTitleIngredients = titleIngredientIds(base);
  const candidateIngredientIds = idSet(
    candidate.recipeIngredients,
    (item) => item.ingredientId,
  );
  const baseTitleTokens = titleTokenSet(base);
  const candidateTitleTokens = titleTokenSet(candidate);
  const baseTypeIds = idSet(base.recipeRecipeType, (item) => item.recipeTypeId);
  const candidateTypeIds = idSet(candidate.recipeRecipeType, (item) => item.recipeTypeId);
  const baseMealIds = idSet(base.recipeMealTime, (item) => item.mealTimeId);
  const candidateMealIds = idSet(candidate.recipeMealTime, (item) => item.mealTimeId);
  const baseCuisineIds = idSet(base.recipeCuisine, (item) => item.cuisineId);
  const candidateCuisineIds = idSet(candidate.recipeCuisine, (item) => item.cuisineId);
  const baseMethodIds = idSet(
    base.recipeCookingMethods,
    (item) => item.cookingMethodId,
  );
  const candidateMethodIds = idSet(
    candidate.recipeCookingMethods,
    (item) => item.cookingMethodId,
  );
  const baseNutrientIds = idSet(base.recipeNutrient, (item) => item.nutrientId);
  const candidateNutrientIds = idSet(candidate.recipeNutrient, (item) => item.nutrientId);

  const titleIngredientOverlap = setOverlap(baseTitleIngredients, candidateIngredientIds);
  const keyIngredientOverlap = setOverlap(baseKeyIngredients, candidateKeyIngredients);
  const titleOverlap = setOverlap(baseTitleTokens, candidateTitleTokens);
  const typeOverlap = setOverlap(baseTypeIds, candidateTypeIds);
  const mealOverlap = setOverlap(baseMealIds, candidateMealIds);
  const cuisineOverlap = setOverlap(baseCuisineIds, candidateCuisineIds);
  const methodOverlap = setOverlap(baseMethodIds, candidateMethodIds);
  const nutrientOverlap = setOverlap(baseNutrientIds, candidateNutrientIds);
  const sameCategory =
    base.recipeCategoriesId !== null &&
    base.recipeCategoriesId === candidate.recipeCategoriesId;

  let score = 0;
  score += titleIngredientOverlap * 260;
  score += keyIngredientOverlap * 145;
  score += Math.min(titleOverlap, 3) * 70;
  score += typeOverlap * 52;
  score += mealOverlap * 34;
  score += cuisineOverlap * 28;
  score += methodOverlap * 22;
  score += nutrientOverlap * 18;
  if (sameCategory) score += 38;
  score += Math.log10(Math.max(candidate.views, 0) + 10) * 7;

  const hasRealRelation =
    titleIngredientOverlap > 0 ||
    keyIngredientOverlap > 0 ||
    titleOverlap > 0 ||
    (typeOverlap > 0 && (mealOverlap > 0 || cuisineOverlap > 0 || sameCategory));

  if (!hasRealRelation) score -= 160;

  return score;
}

function relatedCardRecipe(recipe: RelatedRecipeRecord) {
  return {
    id: recipe.id,
    title: recipe.title,
    slug: recipe.slug,
    metaSlug: recipe.metaSlug,
    imageUrl: recipe.imageUrl,
    RecipeCategories: recipe.RecipeCategories,
    recipeCookingTime: recipe.recipeCookingTime,
    recipeNutrient: recipe.recipeNutrient.slice(0, 1),
  };
}

export const getPublicRelatedRecipes = unstable_cache(
  async (recipeId: string) => {
    const baseRecipe = await db.recipes.findFirst({
      where: { id: recipeId, AND: [publishedRecipeWhere()] },
      select: relatedRecipeSelect,
    });

    if (!baseRecipe) return [];

    const baseKeyIngredients = Array.from(keyIngredientIds(baseRecipe));
    const baseTitleIngredients = Array.from(titleIngredientIds(baseRecipe));
    const baseIngredientIds = Array.from(
      new Set([...baseTitleIngredients, ...baseKeyIngredients]),
    );
    const baseTypeIds = Array.from(idSet(baseRecipe.recipeRecipeType, (item) => item.recipeTypeId));
    const baseMealIds = Array.from(idSet(baseRecipe.recipeMealTime, (item) => item.mealTimeId));
    const baseCuisineIds = Array.from(idSet(baseRecipe.recipeCuisine, (item) => item.cuisineId));
    const baseMethodIds = Array.from(
      idSet(baseRecipe.recipeCookingMethods, (item) => item.cookingMethodId),
    );
    const signalFilters: Prisma.RecipesWhereInput[] = [
      ...(baseIngredientIds.length > 0
        ? [{ recipeIngredients: { some: { ingredientId: { in: baseIngredientIds } } } }]
        : []),
      ...(baseTypeIds.length > 0
        ? [{ recipeRecipeType: { some: { recipeTypeId: { in: baseTypeIds } } } }]
        : []),
      ...(baseMealIds.length > 0
        ? [{ recipeMealTime: { some: { mealTimeId: { in: baseMealIds } } } }]
        : []),
      ...(baseCuisineIds.length > 0
        ? [{ recipeCuisine: { some: { cuisineId: { in: baseCuisineIds } } } }]
        : []),
      ...(baseMethodIds.length > 0
        ? [{ recipeCookingMethods: { some: { cookingMethodId: { in: baseMethodIds } } } }]
        : []),
      ...(baseRecipe.recipeCategoriesId
        ? [{ recipeCategoriesId: baseRecipe.recipeCategoriesId }]
        : []),
    ];
    const [signalCandidates, fallbackCandidates] = await Promise.all([
      db.recipes.findMany({
        where: publishedRecipeAnd([
          { id: { not: recipeId } },
          { imageUrl: { not: null } },
          ...(signalFilters.length > 0 ? [{ OR: signalFilters }] : []),
        ]),
        select: relatedRecipeSelect,
        orderBy: [{ views: "desc" }, { contentUpdatedAt: "desc" }, { updatedAt: "desc" }],
        take: 220,
      }),
      db.recipes.findMany({
        where: publishedRecipeAnd([
          { id: { not: recipeId } },
          { imageUrl: { not: null } },
          ...(baseRecipe.recipeCategoriesId
            ? [{ recipeCategoriesId: baseRecipe.recipeCategoriesId }]
            : []),
        ]),
        select: relatedRecipeSelect,
        orderBy: [{ views: "desc" }, { contentUpdatedAt: "desc" }, { updatedAt: "desc" }],
        take: 80,
      }),
    ]);
    const candidates = Array.from(
      new Map(
        [...signalCandidates, ...fallbackCandidates].map((recipe) => [recipe.id, recipe]),
      ).values(),
    );
    const ranked = candidates
      .map((recipe) => ({
        recipe,
        score: relatedCandidateScore(baseRecipe, recipe),
      }))
      .filter((item) => item.score >= 80)
      .sort((left, right) => right.score - left.score || right.recipe.views - left.recipe.views);
    const fallbackRanked =
      ranked.length >= 10
        ? ranked
        : candidates
            .map((recipe) => ({
              recipe,
              score: relatedCandidateScore(baseRecipe, recipe),
            }))
            .sort((left, right) => right.score - left.score || right.recipe.views - left.recipe.views);

    return fallbackRanked.slice(0, 10).map((item) => relatedCardRecipe(item.recipe));
  },
  ["public-related-recipes-v2"],
  {
    revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS,
    tags: ["recipes", "public-content"],
  },
);
