import { Prisma, RecipeSeasonality } from "@prisma/client";

import { RecipesDashboard } from "@/components/admin/recipes/recipes-dashboard";
import type { RecipeListRecord } from "@/components/admin/recipes/recipe-types";
import { auditRecipeContent } from "@/lib/recipe-content-audit";
import { db } from "@/lib/db";

const PAGE_SIZE = 12;

type RecipeSearchParams = Promise<{
  q?: string | string[];
  category?: string | string[];
  cuisine?: string | string[];
  mealTime?: string | string[];
  status?: string | string[];
  difficulty?: string | string[];
  seasonality?: string | string[];
  season?: string | string[];
  cookingMethod?: string | string[];
  allergy?: string | string[];
  nutrient?: string | string[];
  dietType?: string | string[];
  recipeType?: string | string[];
  bodyType?: string | string[];
  ingredient?: string | string[];
  minTime?: string | string[];
  maxTime?: string | string[];
  audit?: string | string[];
  page?: string | string[];
}>;

const singleParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? (value[0] ?? "") : (value ?? "");

const minuteParam = (value: string) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
};

const contentReadyFilter: Prisma.RecipesWhereInput = {
  description: { not: null },
  imageUrl: { not: null },
  recipeIngredients: { some: {} },
  recipeMethods: { some: {} },
};

const seasonReviewedFilter: Prisma.RecipesWhereInput = {
  OR: [
    { seasonality: RecipeSeasonality.ALL_YEAR },
    {
      AND: [
        { seasonality: RecipeSeasonality.SEASONAL },
        {
          OR: [
            { recipeSeasonsId: { not: null } },
            { recipeSeasonTags: { some: {} } },
          ],
        },
      ],
    },
  ],
};

const needsSeasonReviewFilter: Prisma.RecipesWhereInput = {
  OR: [
    { seasonality: RecipeSeasonality.UNREVIEWED },
    {
      AND: [
        { seasonality: RecipeSeasonality.SEASONAL },
        { recipeSeasonsId: null },
        { recipeSeasonTags: { none: {} } },
      ],
    },
  ],
};

const taggingReadyFilter: Prisma.RecipesWhereInput = {
  AND: [{ recipeDifficultyId: { not: null } }, seasonReviewedFilter],
};

const needsTagsFilter: Prisma.RecipesWhereInput = {
  OR: [{ recipeDifficultyId: null }, needsSeasonReviewFilter],
};

const RecipesPage = async ({
  searchParams,
}: {
  searchParams: RecipeSearchParams;
}) => {
  const params = await searchParams;
  const search = singleParam(params.q).trim();
  const categoryId = singleParam(params.category);
  const cuisineId = singleParam(params.cuisine);
  const mealTimeId = singleParam(params.mealTime);
  const status = singleParam(params.status);
  const difficultyId = singleParam(params.difficulty);
  const seasonality = singleParam(params.seasonality);
  const seasonId = singleParam(params.season);
  const cookingMethodId = singleParam(params.cookingMethod);
  const allergyId = singleParam(params.allergy);
  const nutrientId = singleParam(params.nutrient);
  const dietTypeId = singleParam(params.dietType);
  const recipeTypeId = singleParam(params.recipeType);
  const bodyTypeId = singleParam(params.bodyType);
  const ingredientId = singleParam(params.ingredient);
  const minTime = singleParam(params.minTime);
  const maxTime = singleParam(params.maxTime);
  const auditParam = singleParam(params.audit);
  const auditStatus =
    auditParam ||
    (status === "audit-fix-first"
      ? "fix-first"
      : status === "audit-needs-work"
        ? "needs-work"
        : status === "audit-good"
          ? "good"
          : "");
  const minTimeValue = minuteParam(minTime);
  const maxTimeValue = minuteParam(maxTime);
  const requestedPage = Math.max(
    Number.parseInt(singleParam(params.page) || "1", 10) || 1,
    1
  );
  const statusWhere: Prisma.RecipesWhereInput =
    status === "published"
      ? { isPublished: true }
      : status === "draft"
        ? { isPublished: false }
        : status.startsWith("audit-")
          ? {}
        : status === "incomplete"
          ? { NOT: contentReadyFilter }
          : status === "needs-tags"
            ? needsTagsFilter
            : status === "missing-difficulty"
              ? { recipeDifficultyId: null }
              : status === "needs-season-review"
                ? needsSeasonReviewFilter
                : status === "ready-to-publish"
                  ? { isPublished: false, AND: [contentReadyFilter, taggingReadyFilter] }
                  : {};

  const whereClauses: Prisma.RecipesWhereInput[] = [];

  if (search) {
    whereClauses.push({
      OR: [
        { title: { contains: search } },
        { slug: { contains: search } },
      ],
    });
  }
  if (categoryId) whereClauses.push({ recipeCategoriesId: categoryId });
  if (cuisineId) whereClauses.push({ recipeCuisine: { some: { cuisineId } } });
  if (mealTimeId) whereClauses.push({ recipeMealTime: { some: { mealTimeId } } });
  if (difficultyId) whereClauses.push({ recipeDifficultyId: difficultyId });
  if (
    seasonality &&
    Object.values(RecipeSeasonality).includes(seasonality as RecipeSeasonality)
  ) {
    whereClauses.push({ seasonality: seasonality as RecipeSeasonality });
  }
  if (seasonId) {
    whereClauses.push({
      OR: [
        { recipeSeasonsId: seasonId },
        { recipeSeasonTags: { some: { recipeSeasonsId: seasonId } } },
      ],
    });
  }
  if (cookingMethodId) {
    whereClauses.push({ recipeCookingMethods: { some: { cookingMethodId } } });
  }
  if (allergyId) whereClauses.push({ recipeAllergies: { some: { allergyId } } });
  if (nutrientId) whereClauses.push({ recipeNutrient: { some: { nutrientId } } });
  if (dietTypeId) whereClauses.push({ recipeDietType: { some: { dietTypeId } } });
  if (recipeTypeId) whereClauses.push({ recipeRecipeType: { some: { recipeTypeId } } });
  if (bodyTypeId) whereClauses.push({ recipeBodyTypes: { some: { bodyTypeId } } });
  if (ingredientId) {
    whereClauses.push({ recipeIngredients: { some: { ingredientId } } });
  }
  if (minTimeValue !== undefined || maxTimeValue !== undefined) {
    whereClauses.push({
      recipeCookingTime: {
        is: {
          totalTime: {
            ...(minTimeValue !== undefined ? { gte: minTimeValue } : {}),
            ...(maxTimeValue !== undefined ? { lte: maxTimeValue } : {}),
          },
        },
      },
    });
  }
  if (Object.keys(statusWhere).length) whereClauses.push(statusWhere);

  const where: Prisma.RecipesWhereInput = whereClauses.length
    ? { AND: whereClauses }
    : {};

  const [
    total,
    published,
    categories,
    cuisines,
    mealTimes,
    difficulties,
    seasons,
    cookingMethods,
    allergies,
    nutrients,
    dietTypes,
    recipeTypes,
    bodyTypes,
    ingredients,
  ] = await Promise.all([
    db.recipes.count(),
    db.recipes.count({ where: { isPublished: true } }),
    db.recipeCategories.findMany({
      orderBy: [{ position: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
    db.cuisines.findMany({
      where: { recipeCuisine: { some: {} } },
      orderBy: [{ position: "asc" }, { title: "asc" }],
      select: { id: true, title: true },
    }),
    db.mealTimes.findMany({
      where: { recipeMealTime: { some: {} } },
      orderBy: [{ position: "asc" }, { title: "asc" }],
      select: { id: true, title: true },
    }),
    db.recipeDifficulty.findMany({
      orderBy: [{ position: "asc" }, { title: "asc" }],
      select: { id: true, title: true },
    }),
    db.recipeSeasons.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
    db.cookingMethods.findMany({
      orderBy: [{ position: "asc" }, { title: "asc" }],
      select: { id: true, title: true },
    }),
    db.allergies.findMany({
      orderBy: [{ position: "asc" }, { title: "asc" }],
      select: { id: true, title: true },
    }),
    db.nutrient.findMany({
      orderBy: [{ position: "asc" }, { title: "asc" }],
      select: { id: true, title: true },
    }),
    db.dietTypes.findMany({
      orderBy: [{ position: "asc" }, { title: "asc" }],
      select: { id: true, title: true },
    }),
    db.recipeTypes.findMany({
      orderBy: [{ position: "asc" }, { title: "asc" }],
      select: { id: true, title: true },
    }),
    db.bodyTypes.findMany({
      orderBy: [{ position: "asc" }, { title: "asc" }],
      select: { id: true, title: true },
    }),
    db.ingredients.findMany({
      where: { RecipeIngredients: { some: {} } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const allEntries = await db.recipes.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
    include: {
      RecipeCategories: { select: { id: true, name: true } },
      recipeDifficulty: { select: { id: true, title: true } },
      recipeSeasons: { select: { id: true, title: true } },
      recipeSeasonTags: {
        include: { season: { select: { id: true, title: true } } },
      },
      recipeCookingTime: {
        select: { prepTime: true, cookTime: true, restTime: true, totalTime: true },
      },
      recipeIngredients: {
        select: {
          quantity: true,
          ingredient: { select: { name: true } },
        },
        orderBy: { position: "asc" },
      },
      recipeMethods: {
        select: {
          title: true,
          description: true,
          imageUrl: true,
          videoUrl: true,
          isPublished: true,
        },
        orderBy: { position: "asc" },
      },
      recipeCuisine: { select: { cuisineId: true } },
      recipeCookingMethods: { select: { cookingMethodId: true } },
      recipeMealTime: { select: { mealTimeId: true } },
      recipeDietType: { select: { dietTypeId: true } },
      recipeRecipeType: { select: { recipeTypeId: true } },
      recipeBodyTypes: { select: { bodyTypeId: true } },
    },
  });

  const auditedEntries = allEntries.map((recipe) => {
    const seasons = recipe.recipeSeasonTags.length
      ? recipe.recipeSeasonTags.map((tag) => tag.season)
      : recipe.recipeSeasons
        ? [recipe.recipeSeasons]
        : [];
    const audit = auditRecipeContent({
      title: recipe.title,
      slug: recipe.slug,
      metaTitle: recipe.metaTitle,
      metaDescription: recipe.metaDescription,
      metaSlug: recipe.metaSlug,
      description: recipe.description,
      imageUrl: recipe.imageUrl,
      recipeCategoriesId: recipe.recipeCategoriesId,
      recipeDifficultyId: recipe.recipeDifficultyId,
      seasonality: recipe.seasonality,
      isPublished: recipe.isPublished,
      contentUpdatedAt: recipe.contentUpdatedAt?.toISOString() ?? null,
      ingredients: recipe.recipeIngredients.map((ingredient) => ({
        ingredientName: ingredient.ingredient.name,
        quantity: Number(ingredient.quantity),
      })),
      steps: recipe.recipeMethods.map((step) => ({
        title: step.title,
        description: step.description,
        imageUrl: step.imageUrl,
        videoUrl: step.videoUrl,
        isPublished: step.isPublished,
      })),
      recipeCookingTime: recipe.recipeCookingTime,
      cuisineIds: recipe.recipeCuisine.map((tag) => tag.cuisineId),
      cookingMethodIds: recipe.recipeCookingMethods.map((tag) => tag.cookingMethodId),
      mealTimeIds: recipe.recipeMealTime.map((tag) => tag.mealTimeId),
      dietTypeIds: recipe.recipeDietType.map((tag) => tag.dietTypeId),
      recipeTypeIds: recipe.recipeRecipeType.map((tag) => tag.recipeTypeId),
      bodyTypeIds: recipe.recipeBodyTypes.map((tag) => tag.bodyTypeId),
      seasonIds: seasons.map((season) => season.id),
    });

    const totalMinutes = recipe.recipeCookingTime
      ? recipe.recipeCookingTime.totalTime ||
        recipe.recipeCookingTime.prepTime +
          recipe.recipeCookingTime.cookTime +
          recipe.recipeCookingTime.restTime
      : null;

    return {
      recipe,
      audit,
      seasons,
      record: {
        id: recipe.id,
        title: recipe.title,
        slug: recipe.slug,
        description: recipe.description,
        imageUrl: recipe.imageUrl,
        isPublished: recipe.isPublished,
        updatedAt: recipe.updatedAt.toISOString(),
        category: recipe.RecipeCategories,
        difficulty: recipe.recipeDifficulty,
        seasonality: recipe.seasonality,
        seasons,
        totalMinutes,
        auditScore: Math.round((audit.score / audit.maxScore) * 100),
        auditGrade: audit.grade,
        auditCriticalCount: audit.criticalCount,
        auditWarningCount: audit.warningCount,
        ingredientCount: recipe.recipeIngredients.length,
        methodCount: recipe.recipeMethods.length,
      } satisfies RecipeListRecord,
    };
  });

  const filteredEntries = auditedEntries.filter(({ audit, record }) => {
    if (!auditStatus) return true;
    if (auditStatus === "fix-first") {
      return audit.criticalCount > 0 || audit.grade === "Weak";
    }
    if (auditStatus === "needs-work") {
      return audit.grade === "Needs work" && audit.criticalCount === 0;
    }
    if (auditStatus === "good") {
      return audit.grade === "Good" || audit.grade === "Excellent";
    }
    if (auditStatus === "excellent") {
      return audit.grade === "Excellent";
    }
    if (auditStatus === "weak") {
      return record.auditGrade === "Weak";
    }
    return true;
  });

  const totalFiltered = filteredEntries.length;
  const pageCount = Math.max(Math.ceil(totalFiltered / PAGE_SIZE), 1);
  const page = Math.min(requestedPage, pageCount);
  const recipes: RecipeListRecord[] = filteredEntries
    .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    .map((entry) => entry.record);
  const averageAuditScore = Math.round(
    (filteredEntries.reduce((sum, entry) => sum + entry.record.auditScore, 0) || 0) /
      Math.max(filteredEntries.length, 1),
  );

  return (
    <RecipesDashboard
      key={[
        search,
        categoryId,
        cuisineId,
        mealTimeId,
        status,
        difficultyId,
        seasonality,
        seasonId,
        cookingMethodId,
        allergyId,
        nutrientId,
        dietTypeId,
        recipeTypeId,
        bodyTypeId,
        ingredientId,
        minTime,
        maxTime,
        auditStatus,
        page,
      ].join(":")}
      recipes={recipes}
      categories={categories.map((category) => ({ id: category.id, label: category.name }))}
      cuisines={cuisines.map((cuisine) => ({ id: cuisine.id, label: cuisine.title }))}
      mealTimes={mealTimes.map((mealTime) => ({ id: mealTime.id, label: mealTime.title }))}
      difficulties={difficulties.map((difficulty) => ({ id: difficulty.id, label: difficulty.title }))}
      seasons={seasons.map((season) => ({ id: season.id, label: season.title }))}
      cookingMethods={cookingMethods.map((method) => ({ id: method.id, label: method.title }))}
      allergies={allergies.map((allergy) => ({ id: allergy.id, label: allergy.title }))}
      nutrients={nutrients.map((nutrient) => ({ id: nutrient.id, label: nutrient.title }))}
      dietTypes={dietTypes.map((dietType) => ({ id: dietType.id, label: dietType.title }))}
      recipeTypes={recipeTypes.map((recipeType) => ({ id: recipeType.id, label: recipeType.title }))}
      bodyTypes={bodyTypes.map((bodyType) => ({ id: bodyType.id, label: bodyType.title }))}
      ingredients={ingredients.map((ingredient) => ({ id: ingredient.id, label: ingredient.name }))}
      stats={{
        total,
        published,
        drafts: total - published,
        averageAuditScore,
      }}
      filters={{
        search,
        categoryId,
        cuisineId,
        mealTimeId,
        status,
        difficultyId,
        seasonality,
        seasonId,
        cookingMethodId,
        allergyId,
        nutrientId,
        dietTypeId,
        recipeTypeId,
        bodyTypeId,
        ingredientId,
        minTime,
        maxTime,
        auditStatus,
      }}
      page={page}
      pageCount={pageCount}
      totalFiltered={totalFiltered}
    />
  );
};

export default RecipesPage;
