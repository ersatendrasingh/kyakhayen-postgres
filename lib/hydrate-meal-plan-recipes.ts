import { db } from "@/lib/db";
import type { RecipeWithCategory } from "@/types/recipe";

type StoredMealPlanRecipe = {
  id?: string;
  recipeId?: string;
};

type MealsByTime = Record<string, Array<RecipeWithCategory | StoredMealPlanRecipe>>;

function mealPlanRecipeId(recipe: RecipeWithCategory | StoredMealPlanRecipe) {
  if ("recipeId" in recipe && recipe.recipeId) return recipe.recipeId;
  return recipe.id;
}

/**
 * Saved meal plans preserve selection history, while current recipe identity
 * remains authoritative in the database after editorial or SEO updates.
 */
export async function hydrateMealPlanRecipes(
  mealsByTime: MealsByTime,
): Promise<Record<string, RecipeWithCategory[]>> {
  const recipeIds = Array.from(
    new Set(
      Object.values(mealsByTime).flatMap((recipes) =>
        recipes.flatMap((recipe) => mealPlanRecipeId(recipe) ?? []),
      ),
    ),
  );

  if (recipeIds.length === 0) {
    return Object.fromEntries(Object.keys(mealsByTime).map((mealTime) => [mealTime, []]));
  }

  const currentRecipes = await db.recipes.findMany({
    where: {
      id: { in: recipeIds },
      isPublished: true,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      metaSlug: true,
      imageUrl: true,
      RecipeCategories: true,
      recipeCookingTime: true,
      recipeRecipeType: {
        take: 1,
        include: { recipeType: true },
      },
      recipeNutrient: {
        take: 1,
        include: { nutrient: true },
      },
    },
  });
  const currentById = new Map(currentRecipes.map((recipe) => [recipe.id, recipe]));

  return Object.fromEntries(
    Object.entries(mealsByTime).map(([mealTime, recipes]) => [
      mealTime,
      recipes.flatMap((recipe) => {
        const recipeId = mealPlanRecipeId(recipe);
        if (!recipeId) return [];
        const current = currentById.get(recipeId);
        return current ? [{ ...recipe, ...current } as RecipeWithCategory] : [];
      }),
    ]),
  );
}
