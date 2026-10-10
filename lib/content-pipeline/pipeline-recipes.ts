import { db } from "@/lib/db";
import type { PipelineRecipe } from "@/lib/content-pipeline/reel-draft";

type GetPipelineRecipesOptions = {
  query?: string;
  limit?: number;
};

type RecipeForPipeline = Awaited<ReturnType<typeof fetchPipelineRecipes>>[number];

const MAX_RECIPE_LIMIT = 50;

export const fallbackPipelineRecipes: PipelineRecipe[] = [
  {
    id: "sample-paneer-butter-masala",
    title: "Paneer Butter Masala",
    slug: "paneer-butter-masala-paneer-butter-masala",
    description:
      "Cook Paneer Butter Masala with practical timing, clear steps and home-style flavour.",
    imageUrl:
      "https://res.cloudinary.com/dfm6dhu3l/image/upload/v1791613247/recipes/cb4714dd-db8e-4589-b9a8-a0a6f5b4696a/paneer-butter-masala.webp",
    category: "Veg",
    cuisines: ["North Indian", "Punjabi"],
    totalMinutes: 45,
    ingredients: [
      "300 g paneer cubes",
      "2 finely chopped onion",
      "3 pureed tomato",
      "ginger garlic paste",
      "fresh cream",
      "butter",
      "kasuri methi",
    ],
    methods: [
      {
        title: "Cook the masala",
        description:
          "Saute onions, ginger, garlic, tomatoes and spices until the masala turns glossy and aromatic.",
      },
      {
        title: "Finish restaurant style",
        description: "Add cream, butter, kasuri methi, garam masala and coriander.",
      },
    ],
  },
];

function quantityLabel(quantity: number) {
  if (Number.isInteger(quantity)) return String(quantity);
  return quantity.toFixed(2).replace(/\.?0+$/, "");
}

function normalizeLimit(limit: number | undefined) {
  if (!limit || Number.isNaN(limit)) return 30;
  return Math.min(Math.max(limit, 1), MAX_RECIPE_LIMIT);
}

function mapRecipeToPipelineRecipe(recipe: RecipeForPipeline): PipelineRecipe {
  return {
    id: recipe.id,
    title: recipe.title,
    slug: recipe.slug,
    description: recipe.description,
    imageUrl: recipe.imageUrl,
    category: recipe.RecipeCategories?.name ?? null,
    cuisines: recipe.recipeCuisine.map((item) => item.cuisine.title),
    totalMinutes: recipe.recipeCookingTime?.totalTime ?? null,
    ingredients: recipe.recipeIngredients.map((item) =>
      [
        quantityLabel(item.quantity),
        item.unit.shortName,
        item.ingredientForm.name,
        item.ingredient.name,
      ]
        .filter(Boolean)
        .join(" ")
    ),
    methods: recipe.recipeMethods.map((method) => ({
      title: method.title,
      description: method.description,
    })),
  };
}

async function fetchPipelineRecipes({
  query,
  limit,
  excludedRecipeIds = [],
  publishedOnly = false,
}: {
  query?: string;
  limit: number;
  excludedRecipeIds?: string[];
  publishedOnly?: boolean;
}) {
  const search = query?.trim();

  return db.recipes.findMany({
    where: {
      imageUrl: { not: null },
      recipeIngredients: { some: {} },
      recipeMethods: publishedOnly ? { some: { isPublished: true } } : { some: {} },
      ...(publishedOnly ? { isPublished: true } : {}),
      ...(excludedRecipeIds.length ? { id: { notIn: excludedRecipeIds } } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search } },
              { slug: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      imageUrl: true,
      RecipeCategories: { select: { name: true } },
      recipeCookingTime: { select: { totalTime: true } },
      recipeCuisine: {
        select: {
          cuisine: { select: { title: true } },
        },
      },
      recipeIngredients: {
        orderBy: { position: "asc" },
        take: 10,
        select: {
          quantity: true,
          ingredient: { select: { name: true } },
          ingredientForm: { select: { name: true } },
          unit: { select: { shortName: true } },
        },
      },
      recipeMethods: {
        where: publishedOnly ? { isPublished: true } : undefined,
        orderBy: { position: "asc" },
        take: 5,
        select: {
          title: true,
          description: true,
        },
      },
    },
  });
}

export async function getPipelineRecipes({
  query,
  limit,
}: GetPipelineRecipesOptions = {}): Promise<PipelineRecipe[]> {
  const search = query?.trim();

  try {
    const recipes = await fetchPipelineRecipes({
      query: search,
      limit: normalizeLimit(limit),
    });

    if (!recipes.length) return search ? [] : fallbackPipelineRecipes;

    return recipes.map(mapRecipeToPipelineRecipe);
  } catch (error) {
    console.error("Unable to load recipes for content pipeline", error);
    return search ? [] : fallbackPipelineRecipes;
  }
}

export async function getNextAutomationRecipeCandidate(excludedRecipeIds: string[]) {
  const recipes = await fetchPipelineRecipes({
    limit: 1,
    excludedRecipeIds,
    publishedOnly: true,
  });
  return recipes[0] ? mapRecipeToPipelineRecipe(recipes[0]) : null;
}
