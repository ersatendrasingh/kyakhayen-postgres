import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { normalizeIngredientDisplayName } from "@/lib/ingredients";
import {
  canonicalPrimaryIngredientValue,
  isPrimaryIngredientValue,
} from "@/lib/primary-ingredients";
import { publishedRecipeWhere } from "@/lib/recipe-publication";

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function valueForIngredient(name: string, slug: string | null) {
  return normalize(normalizeIngredientDisplayName(name) || slug || name);
}

function slugValue(value: string) {
  return normalize(value).replace(/\s+/g, "-");
}

function titleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const MAIN_INGREDIENT_PATTERN =
  /\b(paneer|tofu|chicken|egg|fish|mutton|potato|aloo|tomato|onion|pyaz|cauliflower|gobhi|cabbage|brinjal|baingan|bhindi|okra|mushroom|capsicum|carrot|peas|matar|rice|chawal|roti|wheat|atta|dal|lentil|moong|chana|rajma|chickpea|beans|poha|bread|milk|curd|yogurt)\b/;
const SUPPORTING_INGREDIENT_PATTERN =
  /\b(garlic|ginger|chilli|coriander|cumin|jeera|mustard|turmeric|salt|pepper|masala|oil|ghee|lemon|lime|curry leaves)\b/;
const LOW_SIGNAL_INGREDIENT_PATTERN =
  /\b(water|broth|stock|powder|extract|sauce|vinegar|sweetener|soda|yeast|herb|spice)\b/;

const publicRecipeWhere = {
  AND: [publishedRecipeWhere(), { imageUrl: { not: null } }],
} satisfies Prisma.RecipesWhereInput;

const ingredientSelect = {
  id: true,
  name: true,
  slug: true,
  IngredientCategories: {
    select: {
      name: true,
      slug: true,
      position: true,
    },
  },
  _count: {
    select: {
      RecipeIngredients: {
        where: {
          recipe: publicRecipeWhere,
        },
      },
    },
  },
} satisfies Prisma.IngredientsSelect;

type IngredientRecord = Prisma.IngredientsGetPayload<{
  select: typeof ingredientSelect;
}>;

function ingredientWords(name: string, slug: string | null) {
  return normalize(`${name} ${normalizeIngredientDisplayName(name)} ${slug || ""}`)
    .split(" ")
    .filter((word) => word.length > 2);
}

function scoreIngredient(ingredient: IngredientRecord, query: string) {
  const name = normalize(ingredient.name);
  const label = normalize(normalizeIngredientDisplayName(ingredient.name));
  const value = valueForIngredient(ingredient.name, ingredient.slug);
  const publicRecipeCount = ingredient._count.RecipeIngredients;
  const categoryPosition = ingredient.IngredientCategories?.position;
  const wordCount = ingredientWords(ingredient.name, ingredient.slug).length;

  let score =
    Math.min(publicRecipeCount, 1200) +
    (categoryPosition ? Math.max(0, 32 - categoryPosition) : 0);

  if (MAIN_INGREDIENT_PATTERN.test(label)) score += 820;
  if (SUPPORTING_INGREDIENT_PATTERN.test(label)) score += query ? 160 : -150;
  if (LOW_SIGNAL_INGREDIENT_PATTERN.test(label)) score -= 240;
  if (!query && wordCount > 5) score -= 120;

  if (query) {
    if (name === query || label === query || value === query) score += 900;
    if (name.startsWith(query) || label.startsWith(query) || value.startsWith(query)) {
      score += 620;
    }
    if (name.includes(query) || label.includes(query) || value.includes(query)) {
      score += 260;
    }
  }

  return score;
}

function queryMatchRank(ingredient: IngredientRecord, query: string) {
  if (!query) return 0;

  const name = normalize(ingredient.name);
  const label = normalize(normalizeIngredientDisplayName(ingredient.name));
  const value = valueForIngredient(ingredient.name, ingredient.slug);
  const nameWords = `${label} ${name}`.split(" ");
  const valueWords = value.split(" ");

  if (label === query || name === query || value === query) return 5;
  if (label.startsWith(query) || name.startsWith(query)) return 4;
  if (nameWords.some((word) => word.startsWith(query))) return 3;
  if (value.startsWith(query)) return 2;
  if (valueWords.some((word) => word.startsWith(query))) return 1;
  if (label.includes(query) || name.includes(query)) return 0;

  return -1;
}

async function recipeTopicSuggestion(query: string, existingValues: Set<string>) {
  if (query.length < 2 || existingValues.has(query) || !isPrimaryIngredientValue(query)) {
    return null;
  }

  const recipeCount = await db.recipes.count({
    where: {
      AND: [
        publicRecipeWhere,
        {
          OR: [
            { title: { contains: query } },
            { slug: { contains: slugValue(query) } },
            {
              recipeIngredients: {
                some: {
                  ingredient: {
                    OR: [
                      { name: { contains: query } },
                      { slug: { contains: slugValue(query) } },
                    ],
                  },
                },
              },
            },
          ],
        },
      ],
    },
  });

  if (recipeCount === 0) return null;

  return {
    id: `recipe-topic-${slugValue(query)}`,
    label: titleCase(query),
    value: query,
    recipeCount,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = canonicalPrimaryIngredientValue(searchParams.get("q") || "");
    const limit = Math.min(
      Math.max(Number(searchParams.get("limit") || 18), 1),
      30,
    );

    const ingredients = await db.ingredients.findMany({
      where: {
        isPublished: true,
        RecipeIngredients: { some: { recipe: publicRecipeWhere } },
        ...(query
          ? {
              OR: [
                { name: { contains: query } },
                { slug: { contains: slugValue(query) } },
              ],
            }
          : {}),
      },
      select: ingredientSelect,
      orderBy: [{ RecipeIngredients: { _count: "desc" } }, { name: "asc" }],
      take: query ? Math.max(limit * 4, 40) : 160,
    });

    const suggestions = ingredients
      .map((ingredient) => ({
        id: ingredient.id,
        label: normalizeIngredientDisplayName(ingredient.name),
        value: valueForIngredient(ingredient.name, ingredient.slug),
        recipeCount: ingredient._count.RecipeIngredients,
        queryRank: queryMatchRank(ingredient, query),
        score: scoreIngredient(ingredient, query),
      }))
      .filter((suggestion) =>
        isPrimaryIngredientValue(`${suggestion.label} ${suggestion.value}`),
      )
      .sort((left, right) => {
        if (query && left.queryRank !== right.queryRank) {
          return right.queryRank - left.queryRank;
        }

        return right.score - left.score || right.recipeCount - left.recipeCount;
      })
      .slice(0, limit)
      .map((suggestion) => ({
        id: suggestion.id,
        label: suggestion.label,
        value: suggestion.value,
        recipeCount: suggestion.recipeCount,
      }));

    const existingValues = new Set(suggestions.map((suggestion) => suggestion.value));
    const fallbackSuggestion =
      suggestions.length === 0
        ? await recipeTopicSuggestion(query, existingValues)
        : null;
    const finalSuggestions = fallbackSuggestion
      ? [fallbackSuggestion, ...suggestions].slice(0, limit)
      : suggestions;

    return NextResponse.json(
      { suggestions: finalSuggestions },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("[INGREDIENT_SUGGESTIONS]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
