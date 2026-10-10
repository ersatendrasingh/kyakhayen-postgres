import type { Prisma } from "@prisma/client";

type RecipeDateFields = {
  createdAt: Date | string;
  updatedAt: Date | string;
  publishedAt?: Date | string | null;
  contentUpdatedAt?: Date | string | null;
};

function recipeVisibilityWindow(now: Date): Prisma.RecipesWhereInput {
  return { OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] };
}

export function publishedRecipeWhere(now = new Date()): Prisma.RecipesWhereInput {
  return {
    isPublished: true,
    AND: [recipeVisibilityWindow(now)],
  };
}

export function publishedRecipeAnd(
  conditions: Prisma.RecipesWhereInput[],
  now = new Date(),
): Prisma.RecipesWhereInput {
  return {
    isPublished: true,
    AND: [recipeVisibilityWindow(now), ...conditions],
  };
}

export function recipePublishedAt(recipe: Pick<RecipeDateFields, "createdAt" | "publishedAt">) {
  return recipe.publishedAt ?? recipe.createdAt;
}

export function recipeContentUpdatedAt(recipe: RecipeDateFields) {
  return recipe.contentUpdatedAt ?? recipe.updatedAt ?? recipe.publishedAt ?? recipe.createdAt;
}
