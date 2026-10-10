import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

const BROWSE_CATEGORY_SLUGS: Record<string, string[]> = {
  egg: ["eggetarian", "egg"],
  eggetarian: ["eggetarian", "egg"],
  veg: ["veg"],
};

const FOOD_PREFERENCE_SLUGS: Record<string, string[]> = {
  vegan: ["vegan"],
  veg: ["veg", "vegan"],
  egg: ["eggetarian", "egg", "veg", "vegan"],
  eggetarian: ["eggetarian", "egg", "veg", "vegan"],
  pescetarian: ["pescetarian", "veg", "vegan"],
  "non veg": ["non-veg", "pescetarian", "eggetarian", "egg", "veg", "vegan"],
  "non-veg": ["non-veg", "pescetarian", "eggetarian", "egg", "veg", "vegan"],
};

type CategoryIdMap = Record<string, string | undefined>;

function normalizeSlug(slug: string) {
  return slug.trim().toLowerCase();
}

function unique(values: string[]) {
  return [...new Set(values)];
}

export function getBrowseCategorySlugs(slug: string) {
  const normalized = normalizeSlug(slug);

  return unique(BROWSE_CATEGORY_SLUGS[normalized] || [normalized]);
}

export function getFoodPreferenceCategorySlugs(slug: string) {
  const normalized = normalizeSlug(slug);

  return unique(FOOD_PREFERENCE_SLUGS[normalized] || [normalized]);
}

export async function getRecipeCategoryWhereForBrowse(
  slug: string,
): Promise<Pick<Prisma.RecipesWhereInput, "recipeCategoriesId"> | null> {
  return getRecipeCategoryWhereForSlugs(getBrowseCategorySlugs(slug));
}

export async function getRecipeCategoryWhereForFoodPreference(
  slug: string,
): Promise<Pick<Prisma.RecipesWhereInput, "recipeCategoriesId"> | null> {
  return getRecipeCategoryWhereForSlugs(getFoodPreferenceCategorySlugs(slug));
}

export function getFoodPreferenceCategoryIds(
  preferenceSlug: string,
  categoryIdsBySlug: CategoryIdMap,
) {
  return getFoodPreferenceCategorySlugs(preferenceSlug)
    .map((slug) => categoryIdsBySlug[slug])
    .filter((id): id is string => Boolean(id));
}

async function getRecipeCategoryWhereForSlugs(
  slugs: string[],
): Promise<Pick<Prisma.RecipesWhereInput, "recipeCategoriesId"> | null> {
  const categories = await db.recipeCategories.findMany({
    where: { isPublished: true, slug: { in: slugs } },
    select: { id: true },
  });

  const ids = categories.map((category) => category.id);
  if (ids.length === 0) return null;

  return {
    recipeCategoriesId: ids.length === 1 ? ids[0] : { in: ids },
  };
}
