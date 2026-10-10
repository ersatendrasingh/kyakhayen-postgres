import { Prisma } from "@prisma/client";

import { IngredientsDashboard } from "@/components/admin/ingredients/ingredients-dashboard";
import type { IngredientRecord } from "@/components/admin/ingredients/ingredient-types";
import { db } from "@/lib/db";

const PAGE_SIZE = 10;
const GRAM_UNITS = new Set(["g", "gm"]);

type IngredientSearchParams = Promise<{
  q?: string | string[];
  category?: string | string[];
  status?: string | string[];
  nutrition?: string | string[];
  page?: string | string[];
}>;

const singleParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? (value[0] ?? "") : (value ?? "");

const nutritionCompleteFilter: Prisma.IngredientsWhereInput = {
  calories: { not: null },
  carbohydrate: { not: null },
  totalFat: { not: null },
  dietaryFiber: { not: null },
  protein: { not: null },
  vitaminA: { not: null },
  ascorbicAcids: { not: null },
  vitaminD: { not: null },
  tocopherolEquivalent: { not: null },
  vitaminK: { not: null },
  thiamine: { not: null },
  riboflavin: { not: null },
  totalB6: { not: null },
  folates: { not: null },
  calcium: { not: null },
  iron: { not: null },
  phosphorus: { not: null },
  potassium: { not: null },
  sodium: { not: null },
  zinc: { not: null },
};

const IngredientsPage = async ({
  searchParams,
}: {
  searchParams: IngredientSearchParams;
}) => {
  const params = await searchParams;
  const search = singleParam(params.q).trim();
  const categoryId = singleParam(params.category);
  const status = singleParam(params.status);
  const nutrition = singleParam(params.nutrition);
  const requestedPage = Math.max(
    Number.parseInt(singleParam(params.page) || "1", 10) || 1,
    1
  );

  const where: Prisma.IngredientsWhereInput = {
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { slug: { contains: search } },
          ],
        }
      : {}),
    ...(categoryId ? { ingredientCategoriesId: categoryId } : {}),
    ...(status === "published"
      ? { isPublished: true }
      : status === "draft"
        ? { isPublished: false }
        : {}),
    ...(nutrition === "ready"
      ? nutritionCompleteFilter
      : nutrition === "missing"
        ? { NOT: nutritionCompleteFilter }
        : {}),
  };

  const [
    total,
    published,
    nutritionComplete,
    categories,
    totalFiltered,
    recipeIngredientRows,
    measurements,
  ] = await Promise.all([
    db.ingredients.count(),
    db.ingredients.count({ where: { isPublished: true } }),
    db.ingredients.count({ where: nutritionCompleteFilter }),
    db.ingredientCategories.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.ingredients.count({ where }),
    db.recipeIngredients.findMany({
      select: {
        recipeId: true,
        ingredientId: true,
        unitId: true,
        unit: { select: { shortName: true } },
      },
    }),
    db.ingredientUnitMeasurements.findMany({
      select: { ingredientId: true, unitId: true },
    }),
  ]);

  const pageCount = Math.max(Math.ceil(totalFiltered / PAGE_SIZE), 1);
  const page = Math.min(requestedPage, pageCount);
  const entries = await db.ingredients.findMany({
    where,
    orderBy: [{ isPublished: "desc" }, { name: "asc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: {
      IngredientCategories: { select: { id: true, name: true } },
      _count: {
        select: {
          RecipeIngredients: true,
          IngredientUnitMeasurements: true,
        },
      },
    },
  });

  const mappedUnitKeys = new Set(
    measurements.map(
      (measurement) => `${measurement.ingredientId}:${measurement.unitId}`
    )
  );
  const missingConversionRows = recipeIngredientRows.filter(
    (row) =>
      !GRAM_UNITS.has(row.unit.shortName.toLowerCase()) &&
      !mappedUnitKeys.has(`${row.ingredientId}:${row.unitId}`)
  );
  const recipesMissingConversion = new Set(
    missingConversionRows.map((row) => row.recipeId)
  ).size;
  const missingConversionsByIngredient = missingConversionRows.reduce(
    (counts, row) => {
      counts.set(row.ingredientId, (counts.get(row.ingredientId) ?? 0) + 1);
      return counts;
    },
    new Map<string, number>()
  );

  const ingredients: IngredientRecord[] = entries.map((ingredient) => ({
    id: ingredient.id,
    name: ingredient.name,
    slug: ingredient.slug,
    imageUrl: ingredient.imageUrl,
    isPublished: ingredient.isPublished,
    category: ingredient.IngredientCategories,
    nutritionComplete: [
      ingredient.calories,
      ingredient.carbohydrate,
      ingredient.totalFat,
      ingredient.dietaryFiber,
      ingredient.protein,
      ingredient.vitaminA,
      ingredient.ascorbicAcids,
      ingredient.vitaminD,
      ingredient.tocopherolEquivalent,
      ingredient.vitaminK,
      ingredient.thiamine,
      ingredient.riboflavin,
      ingredient.totalB6,
      ingredient.folates,
      ingredient.calcium,
      ingredient.iron,
      ingredient.phosphorus,
      ingredient.potassium,
      ingredient.sodium,
      ingredient.zinc,
    ].every((value) => value !== null),
    recipeUsageCount: ingredient._count.RecipeIngredients,
    unitMappingCount: ingredient._count.IngredientUnitMeasurements,
    missingConversionCount:
      missingConversionsByIngredient.get(ingredient.id) ?? 0,
  }));

  return (
    <div>
      <IngredientsDashboard
        key={[search, categoryId, status, nutrition, page].join(":")}
        ingredients={ingredients}
        categories={categories}
        stats={{ total, published, nutritionComplete, recipesMissingConversion }}
        filters={{ search, categoryId, status, nutrition }}
        page={page}
        pageCount={pageCount}
        totalFiltered={totalFiltered}
      />
    </div>
  );
};

export default IngredientsPage;
