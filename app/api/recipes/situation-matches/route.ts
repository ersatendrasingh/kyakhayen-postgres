import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  filterPrimaryIngredientValues,
  isExtraPrimaryIngredientValue,
  isSupportingPrimaryIngredientValue,
  matchesSelectedPrimaryIngredient,
  primaryIngredientSearchTerms,
} from "@/lib/primary-ingredients";
import { publishedRecipeWhere } from "@/lib/recipe-publication";

const NON_VEG_TOKENS = ["chicken", "mutton", "fish", "prawn", "egg"];
const MAIN_RECIPE_TYPE_SLUGS = new Set(["meal", "protein", "cooked-vegetable"]);
const BREAKFAST_RECIPE_TYPE_SLUGS = new Set(["meal", "grains", "protein", "snacks"]);
const LUNCH_DINNER_RECIPE_TYPE_SLUGS = new Set([
  "meal",
  "protein",
  "cooked-vegetable",
]);
const UTILITY_RECIPE_TYPE_SLUGS = new Set([
  "beveragesmoothie",
  "drink-teas",
  "drink-infusions",
  "drink-juices",
  "drink-coolers-sharbat",
  "drink-smoothies",
  "drink-shakes",
  "drink-lassi-buttermilk",
  "drink-detox",
  "drink-hot-sips",
  "morning-hydration",
  "fruits",
  "fruit-salad",
]);
const BREAKFAST_BLOCKED_TYPE_SLUGS = new Set([
  "cooked-vegetable",
  "vegetable-salad",
  "soup",
  "chutneydips",
  "curdraita",
  "desserts",
  ...UTILITY_RECIPE_TYPE_SLUGS,
]);
const LIGHT_RECIPE_TYPE_SLUGS = new Set([
  "snacks",
  "soup",
  "vegetable-salad",
  "chutneydips",
  "curdraita",
  "desserts",
  ...UTILITY_RECIPE_TYPE_SLUGS,
]);
const SUPPORT_ONLY_BLOCKED_TYPE_SLUGS = new Set([
  "grains",
  "meal",
  "protein",
  "snacks",
]);
const SUPPORT_ONLY_ALLOWED_TYPE_SLUGS = [
  "vegetable-salad",
  "soup",
  "chutneydips",
  "curdraita",
] as const;
const GUEST_AVOID_TYPE_SLUGS = new Set([
  "grains",
  "soup",
  "vegetable-salad",
  "chutneydips",
  "curdraita",
  "desserts",
  ...UTILITY_RECIPE_TYPE_SLUGS,
]);
const KIDS_FRIENDLY_TYPE_SLUGS = new Set(["meal", "grains", "protein", "snacks"]);
const KIDS_AVOID_PATTERN =
  /\b(spicy|chilli|mirchi|schezwan|thecha|pickle|achaar|pepper fry)\b/;
const BREAKFAST_TITLE_PATTERN =
  /\b(breakfast|cheela|chila|oats|poha|upma|idli|dosa|uttapam|sandwich|toast|pancake)\b/;
const MAIN_MEAL_TITLE_PATTERN =
  /\b(sabzi|sabji|curry|dal|chana|channa|gravy|stuffed|bharwa|kofta|bharta|kadhi|masala)\b/;
const LIGHT_MEAL_TITLE_PATTERN =
  /\b(cheela|chila|oats|salad|kheer|dessert|smoothie|juice|shake|raita|chutney)\b/;

const recipeSelect = {
  id: true,
  title: true,
  slug: true,
  metaSlug: true,
  imageUrl: true,
  views: true,
  RecipeCategories: { select: { name: true, slug: true } },
  recipeCookingTime: {
    select: { prepTime: true, cookTime: true, restTime: true },
  },
  recipeNutrient: {
    where: { nutrient: { isPublished: true } },
    select: { nutrient: { select: { title: true } } },
    take: 1,
  },
  recipeIngredients: {
    select: {
      position: true,
      quantity: true,
      unitId: true,
      unit: { select: { title: true, shortName: true } },
      ingredient: {
        select: {
          id: true,
          name: true,
          slug: true,
          marketPriceInr: true,
          marketPriceBasisGrams: true,
          IngredientCategories: { select: { slug: true } },
          IngredientUnitMeasurements: {
            select: { unitId: true, values: true },
          },
        },
      },
    },
  },
  recipeMealTime: {
    where: { mealTime: { isPublished: true } },
    select: { mealTime: { select: { title: true, slug: true } } },
    take: 4,
  },
  recipeCuisine: {
    where: { cuisine: { isPublished: true } },
    select: { cuisine: { select: { title: true, slug: true } } },
    take: 3,
  },
  recipeRecipeType: {
    where: { recipeType: { isPublished: true } },
    select: { recipeType: { select: { title: true, slug: true } } },
    take: 4,
  },
  _count: { select: { recipeIngredients: true } },
} satisfies Prisma.RecipesSelect;

type RecipeRecord = Prisma.RecipesGetPayload<{ select: typeof recipeSelect }>;
type RecipeIngredientRecord = RecipeRecord["recipeIngredients"][number];

const GRAM_UNIT_SHORT_NAMES = new Set(["g", "gm", "gram", "grams"]);
const KILOGRAM_UNIT_SHORT_NAMES = new Set(["kg", "kgs", "kilogram", "kilograms"]);
const MILLIGRAM_UNIT_SHORT_NAMES = new Set(["mg", "milligram", "milligrams"]);
const MILLILITER_UNIT_SHORT_NAMES = new Set(["ml", "milliliter", "milliliters"]);
const LITER_UNIT_SHORT_NAMES = new Set(["l", "ltr", "liter", "liters", "litre", "litres"]);

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugValue(value: string) {
  return normalize(value).replace(/\s+/g, "-");
}

function normalizedSlug(value: string) {
  return slugValue(value);
}

function titleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function tokens(value: string) {
  return normalize(value)
    .split(" ")
    .filter((token) => token.length > 2);
}

function recipeIngredientNames(recipe: RecipeRecord) {
  return recipe.recipeIngredients.map((item) => normalize(item.ingredient.name));
}

function selectedSearchTerms(value: string) {
  return primaryIngredientSearchTerms(value).map(normalize).filter(Boolean);
}

function recipeTokenSet(recipe: RecipeRecord) {
  return new Set(
    tokens(
      [
        recipe.title,
        recipe.RecipeCategories?.name,
        ...recipe.recipeMealTime.map((item) => item.mealTime.title),
        ...recipe.recipeRecipeType.map((item) => item.recipeType.title),
        ...recipe.recipeNutrient.map((item) => item.nutrient.title),
        ...recipe.recipeIngredients.map((item) => item.ingredient.name),
      ]
        .filter(Boolean)
        .join(" "),
    ),
  );
}

function totalMinutes(recipe: RecipeRecord) {
  if (!recipe.recipeCookingTime) return 0;

  return (
    recipe.recipeCookingTime.prepTime +
    recipe.recipeCookingTime.cookTime +
    recipe.recipeCookingTime.restTime
  );
}

function unitShortName(value: string | null | undefined) {
  return normalize(value ?? "").replace(/\s+/g, "");
}

function ingredientGrams(recipeIngredient: RecipeIngredientRecord) {
  const mappedMeasurement = recipeIngredient.ingredient.IngredientUnitMeasurements.find(
    (measurement) => measurement.unitId === recipeIngredient.unitId,
  );

  if (mappedMeasurement) return mappedMeasurement.values * recipeIngredient.quantity;

  const shortName = unitShortName(recipeIngredient.unit.shortName);

  if (GRAM_UNIT_SHORT_NAMES.has(shortName)) return recipeIngredient.quantity;
  if (KILOGRAM_UNIT_SHORT_NAMES.has(shortName)) return recipeIngredient.quantity * 1000;
  if (MILLIGRAM_UNIT_SHORT_NAMES.has(shortName)) return recipeIngredient.quantity / 1000;
  if (MILLILITER_UNIT_SHORT_NAMES.has(shortName)) return recipeIngredient.quantity;
  if (LITER_UNIT_SHORT_NAMES.has(shortName)) return recipeIngredient.quantity * 1000;

  return null;
}

function roundCostInr(value: number) {
  const interval = value < 100 ? 5 : 10;

  return Math.max(interval, Math.round(value / interval) * interval);
}

function recipeCostEstimate(recipe: RecipeRecord) {
  let total = 0;
  let pricedIngredientCount = 0;
  let convertibleIngredientCount = 0;
  let missingPriceCount = 0;
  let missingConversionCount = 0;

  for (const recipeIngredient of recipe.recipeIngredients) {
    const grams = ingredientGrams(recipeIngredient);

    if (grams === null) {
      missingConversionCount += 1;
      continue;
    }

    convertibleIngredientCount += 1;

    const price = recipeIngredient.ingredient.marketPriceInr;
    const basisGrams = recipeIngredient.ingredient.marketPriceBasisGrams || 100;

    if (price === null || price <= 0 || basisGrams <= 0) {
      missingPriceCount += 1;
      continue;
    }

    total += (grams / basisGrams) * price;
    pricedIngredientCount += 1;
  }

  const ingredientCount = recipe.recipeIngredients.length;
  const costConfidence = ingredientCount > 0 ? pricedIngredientCount / ingredientCount : 0;

  return {
    estimatedCostInr: pricedIngredientCount > 0 ? roundCostInr(total) : null,
    rawCostInr: pricedIngredientCount > 0 ? total : null,
    costConfidence,
    pricedIngredientCount,
    convertibleIngredientCount,
    missingPriceCount,
    missingConversionCount,
  };
}

function recipeDiscoveryText(recipe: RecipeRecord) {
  return normalize(
    [
      recipe.title,
      recipe.slug,
      recipe.RecipeCategories?.name,
      ...recipe.recipeMealTime.map((item) => item.mealTime.title),
      ...recipe.recipeMealTime.map((item) => item.mealTime.slug),
      ...recipe.recipeRecipeType.map((item) => item.recipeType.title),
      ...recipe.recipeRecipeType.map((item) => item.recipeType.slug),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function recipeTypeSlugSet(recipe: RecipeRecord) {
  return new Set(
    recipe.recipeRecipeType.map((item) => normalizedSlug(item.recipeType.slug)),
  );
}

function recipeMealSlugSet(recipe: RecipeRecord) {
  return new Set(recipe.recipeMealTime.map((item) => normalizedSlug(item.mealTime.slug)));
}

function hasAnyType(recipe: RecipeRecord, slugs: Set<string>) {
  return recipe.recipeRecipeType.some((item) =>
    slugs.has(normalizedSlug(item.recipeType.slug)),
  );
}

function hasTypeSlug(recipe: RecipeRecord, slug: string) {
  return recipeTypeSlugSet(recipe).has(normalizedSlug(slug));
}

function mainMealScore(recipe: RecipeRecord) {
  const minutes = totalMinutes(recipe);
  const typeSlugs = recipeTypeSlugSet(recipe);
  let score = 0;

  if (hasMealFocus(recipe, "lunch")) score += 160;
  if (hasMealFocus(recipe, "dinner")) score += 150;
  if (typeSlugs.has("meal")) score += 240;
  if (typeSlugs.has("protein")) score += 220;
  if (typeSlugs.has("cooked-vegetable")) score += 210;
  if (typeSlugs.has("grains")) score -= 55;
  if (typeSlugs.has("snacks")) score -= 150;
  if (hasAnyType(recipe, UTILITY_RECIPE_TYPE_SLUGS)) score -= 520;
  if (minutes >= 18 && minutes <= 90) score += 35;
  if (minutes > 120) score -= 40;

  return score;
}

function popularityScore(recipe: RecipeRecord) {
  return Math.log10(Math.max(recipe.views, 0) + 10) * 80;
}

function hasMealFocus(recipe: RecipeRecord, focus: string) {
  const target = normalize(focus).replace(/\s+/g, "-");
  const mealSlugs = recipeMealSlugSet(recipe);

  return mealSlugs.has(target);
}

function isEarlyMorningRecipe(recipe: RecipeRecord) {
  return hasMealFocus(recipe, "early-morning");
}

function isUtilityDrinkRecipe(recipe: RecipeRecord) {
  return hasAnyType(recipe, UTILITY_RECIPE_TYPE_SLUGS);
}

function isBareIngredientRecipe(recipe: RecipeRecord) {
  return (
    recipe._count.recipeIngredients <= 1 &&
    !hasAnyType(recipe, MAIN_RECIPE_TYPE_SLUGS) &&
    !hasAnyType(recipe, BREAKFAST_RECIPE_TYPE_SLUGS)
  );
}

function isAllowedSituationRecipe(recipe: RecipeRecord) {
  return (
    !isEarlyMorningRecipe(recipe) &&
    !isUtilityDrinkRecipe(recipe) &&
    !isBareIngredientRecipe(recipe)
  );
}

function isLightRecipe(recipe: RecipeRecord) {
  return hasAnyType(recipe, LIGHT_RECIPE_TYPE_SLUGS);
}

function isSnackRecipe(recipe: RecipeRecord) {
  return hasTypeSlug(recipe, "snacks");
}

function isMainSituationRecipe(recipe: RecipeRecord) {
  return (
    isAllowedSituationRecipe(recipe) &&
    hasAnyType(recipe, MAIN_RECIPE_TYPE_SLUGS) &&
    !hasAnyType(recipe, UTILITY_RECIPE_TYPE_SLUGS)
  );
}

function isGuestFullRecipe(recipe: RecipeRecord) {
  return (
    isMainSituationRecipe(recipe) &&
    !hasAnyType(recipe, GUEST_AVOID_TYPE_SLUGS) &&
    (hasMealFocus(recipe, "lunch") || hasMealFocus(recipe, "dinner"))
  );
}

function isGuestQuickRecipe(recipe: RecipeRecord) {
  return (
    isAllowedSituationRecipe(recipe) &&
    !hasAnyType(recipe, UTILITY_RECIPE_TYPE_SLUGS) &&
    !hasAnyType(recipe, new Set(["desserts", "chutneydips", "curdraita"])) &&
    (isMainSituationRecipe(recipe) || isSnackRecipe(recipe))
  );
}

function recipeCategoryText(recipe: RecipeRecord) {
  return normalize(
    `${recipe.RecipeCategories?.name || ""} ${recipe.RecipeCategories?.slug || ""}`,
  );
}

function recipeBaseWhere(where: Prisma.RecipesWhereInput = {}): Prisma.RecipesWhereInput {
  return {
    AND: [publishedRecipeWhere(), { imageUrl: { not: null } }, where],
  };
}

function foodTypeWhere(foodType: string): Prisma.RecipesWhereInput {
  const normalized = normalize(foodType);

  if (normalized === "veg") {
    return {
      RecipeCategories: {
        OR: [{ slug: { in: ["veg", "vegan"] } }, { name: { in: ["Veg", "Vegan"] } }],
      },
    };
  }

  if (normalized === "non veg" || normalized === "non-veg") {
    return {
      RecipeCategories: {
        OR: [
          { slug: { in: ["non-veg", "pescetarian"] } },
          { name: { in: ["Non Veg", "Pescetarian"] } },
        ],
      },
    };
  }

  return {};
}

function ingredientSearchWhere(value: string) {
  return selectedSearchTerms(value).map((term) => {
    const slug = slugValue(term);

    return {
      recipeIngredients: {
        some: {
          ingredient: {
            OR: [
              { name: { contains: term } },
              { slug: { contains: slug } },
            ],
          },
        },
      },
    } satisfies Prisma.RecipesWhereInput;
  });
}

function recipeIngredientIdentity(recipeIngredient: RecipeIngredientRecord) {
  return `${recipeIngredient.ingredient.name} ${
    recipeIngredient.ingredient.slug ?? ""
  }`;
}

function hasSelectedIngredientMatch(recipe: RecipeRecord, selected: string[]) {
  return recipe.recipeIngredients.some((recipeIngredient) =>
    matchesSelectedPrimaryIngredient(recipeIngredientIdentity(recipeIngredient), selected),
  );
}

function hasNoExtraPrimaryIngredientMatch(recipe: RecipeRecord, selected: string[]) {
  return recipe.recipeIngredients.every((recipeIngredient) => {
    const categorySlug = recipeIngredient.ingredient.IngredientCategories?.slug;

    return !isExtraPrimaryIngredientValue(
      recipeIngredientIdentity(recipeIngredient),
      selected,
      categorySlug,
    );
  });
}

function hasOnlySupportingSelection(selected: string[]) {
  return (
    selected.length > 0 &&
    selected.every((ingredient) => isSupportingPrimaryIngredientValue(ingredient))
  );
}

function isAllowedForSelectedIngredientStrength(
  recipe: RecipeRecord,
  selected: string[],
) {
  if (!hasOnlySupportingSelection(selected)) return true;

  return !hasAnyType(recipe, SUPPORT_ONLY_BLOCKED_TYPE_SLUGS);
}

function hasLunchOrDinnerFocus(recipe: RecipeRecord) {
  return hasMealFocus(recipe, "lunch") || hasMealFocus(recipe, "dinner");
}

function isLunchDinnerMainMeal(recipe: RecipeRecord, text: string) {
  return (
    hasLunchOrDinnerFocus(recipe) &&
    hasAnyType(recipe, LUNCH_DINNER_RECIPE_TYPE_SLUGS) &&
    !isSnackRecipe(recipe) &&
    !isLightRecipe(recipe) &&
    !BREAKFAST_TITLE_PATTERN.test(text) &&
    !(LIGHT_MEAL_TITLE_PATTERN.test(text) && !MAIN_MEAL_TITLE_PATTERN.test(text))
  );
}

function normalizedMealFocus(value: string) {
  const focus = normalize(value).replace(/\s+/g, "-");

  if (focus === "breakfast" || focus === "lunch" || focus === "dinner") {
    return focus;
  }

  return "full-day";
}

function isAllowedForIngredientMealFocus(recipe: RecipeRecord, mealFocus: string) {
  const focus = normalizedMealFocus(mealFocus);
  const text = recipeDiscoveryText(recipe);

  if (focus === "breakfast") {
    return (
      hasMealFocus(recipe, "breakfast") &&
      hasAnyType(recipe, BREAKFAST_RECIPE_TYPE_SLUGS) &&
      !hasAnyType(recipe, BREAKFAST_BLOCKED_TYPE_SLUGS) &&
      !LIGHT_MEAL_TITLE_PATTERN.test(text) &&
      (!MAIN_MEAL_TITLE_PATTERN.test(text) || BREAKFAST_TITLE_PATTERN.test(text))
    );
  }

  if (focus === "lunch" || focus === "dinner") {
    return isLunchDinnerMainMeal(recipe, text);
  }

  return true;
}

function ingredientMealFocusScore(recipe: RecipeRecord, mealFocus: string) {
  const focus = normalizedMealFocus(mealFocus);
  const text = recipeDiscoveryText(recipe);

  if (focus === "full-day") return 0;

  if (focus === "breakfast") {
    return (
      (hasMealFocus(recipe, "breakfast") ? 420 : 0) +
      (BREAKFAST_TITLE_PATTERN.test(text) ? 260 : 0) +
      (hasAnyType(recipe, BREAKFAST_RECIPE_TYPE_SLUGS) ? 140 : 0) -
      (MAIN_MEAL_TITLE_PATTERN.test(text) && !hasMealFocus(recipe, "breakfast")
        ? 260
        : 0) -
      (hasAnyType(recipe, LUNCH_DINNER_RECIPE_TYPE_SLUGS) &&
      !hasMealFocus(recipe, "breakfast")
        ? 120
        : 0)
    );
  }

  return (
    (isAssignedToMealFocus(recipe, focus) ? 420 : 0) +
    (MAIN_MEAL_TITLE_PATTERN.test(text) ? 360 : 0) +
    (hasAnyType(recipe, LUNCH_DINNER_RECIPE_TYPE_SLUGS) ? 220 : 0) -
    (BREAKFAST_TITLE_PATTERN.test(text) ? 360 : 0) -
    (LIGHT_MEAL_TITLE_PATTERN.test(text) ? 320 : 0) -
    (isSnackRecipe(recipe) ? 260 : 0) -
    (isLightRecipe(recipe) ? 180 : 0)
  );
}

function scoreIngredientRecipe(
  recipe: RecipeRecord,
  selected: string[],
  mealFocus: string,
) {
  const title = normalize(recipe.title);
  const ingredientNames = recipeIngredientNames(recipe);
  let score =
    popularityScore(recipe) +
    mainMealScore(recipe) +
    ingredientMealFocusScore(recipe, mealFocus);

  selected.forEach((ingredient, index) => {
    const weight = index === 0 ? 70 : 34;
    const terms = selectedSearchTerms(ingredient);
    const ingredientTokens = terms.flatMap(tokens);
    const exactIngredient = ingredientNames.some((name) => name === ingredient);
    const partialIngredient = terms.some((term) =>
      ingredientNames.some((name) => name.includes(term)),
    );
    const titleMatch = terms.some((term) => title.includes(term));
    const tokenMatch = ingredientTokens.some((token) =>
      ingredientNames.some((name) => name.includes(token)),
    );

    if (exactIngredient) score += weight;
    if (partialIngredient) score += Math.round(weight * 0.72);
    if (titleMatch) score += Math.round(weight * 0.74);
    if (tokenMatch) score += Math.round(weight * 0.32);
  });

  if (selected[0] && title.includes(selected[0])) {
    if (hasMealFocus(recipe, "lunch") || hasMealFocus(recipe, "dinner")) {
      score += 220;
    }
    if (hasAnyType(recipe, MAIN_RECIPE_TYPE_SLUGS)) score += 240;
  }

  if (isLightRecipe(recipe)) score -= 160;
  if (isSnackRecipe(recipe)) score -= 120;

  return score;
}

function matchLabelForSelected(recipe: RecipeRecord, selected: string[]) {
  const ingredientNames = recipeIngredientNames(recipe);
  const matched = selected.filter((ingredient) =>
    ingredientNames.some((name) => name.includes(ingredient)),
  );

  if (matched.length === 0) return "Title match";

  return `Matches ${matched.slice(0, 2).map(titleCase).join(", ")}`;
}

function matchLabelForGeneral(recipe: RecipeRecord, mode: string) {
  if (mode === "budget") {
    const cost = recipeCostEstimate(recipe).estimatedCostInr;

    return cost === null ? "Price data needed" : `Approx Rs ${cost}`;
  }

  const mealTime = recipe.recipeMealTime[0]?.mealTime.title;
  const recipeType = recipe.recipeRecipeType[0]?.recipeType.title;

  if (mode === "daily" && mealTime) return `${mealTime} recipe`;
  if (mode === "guests" && recipeType) return recipeType;

  return "Recipe pick";
}

function guestMatchLabel(recipe: RecipeRecord, guestCount: number, guestPlan: string) {
  if (guestPlan === "snacks") return "Snack plate";
  if (guestPlan === "quick") {
    return totalMinutes(recipe) > 0 && totalMinutes(recipe) <= 35
      ? "Quick serve"
      : "Easy serve";
  }

  return guestCount >= 10 ? "Batch-friendly meal" : "Guest meal";
}

function dailyMatchLabel(recipe: RecipeRecord, focus: string, specificFocus: boolean) {
  if (specificFocus) return `${titleCase(focus)} recipe`;

  const preferredMeal = ["lunch", "dinner", "breakfast"].find((meal) =>
    hasMealFocus(recipe, meal),
  );

  return preferredMeal
    ? `${titleCase(preferredMeal)} recipe`
    : matchLabelForGeneral(recipe, "daily");
}

function publicRecipe(recipe: RecipeRecord, matchLabel: string) {
  const cost = recipeCostEstimate(recipe);

  return {
    id: recipe.id,
    title: recipe.title,
    slug: recipe.slug,
    metaSlug: recipe.metaSlug,
    imageUrl: recipe.imageUrl,
    RecipeCategories: recipe.RecipeCategories,
    recipeCookingTime: recipe.recipeCookingTime,
    recipeNutrient: recipe.recipeNutrient,
    recipeIngredients: recipe.recipeIngredients.map((item) => ({
      ingredient: {
        name: item.ingredient.name,
        slug: item.ingredient.slug,
      },
    })),
    recipeMealTime: recipe.recipeMealTime,
    recipeCuisine: recipe.recipeCuisine,
    recipeRecipeType: recipe.recipeRecipeType,
    ingredientCount: recipe._count.recipeIngredients,
    estimatedCostInr: cost.estimatedCostInr,
    costConfidence: cost.costConfidence,
    pricedIngredientCount: cost.pricedIngredientCount,
    missingPriceCount: cost.missingPriceCount,
    missingConversionCount: cost.missingConversionCount,
    matchLabel,
  };
}

type PublicRecipe = ReturnType<typeof publicRecipe>;
type RecipePageResult = {
  recipes: PublicRecipe[];
  total: number;
};

function paginateRecipes<T>(items: T[], pageSize: number, page: number) {
  const safePage = Math.max(page, 0);
  const start = safePage * pageSize;

  return items.slice(start, start + pageSize);
}

function diversifyRecipes(recipes: RecipeRecord[]) {
  const picked: RecipeRecord[] = [];
  const seenGroups = new Set<string>();

  for (const recipe of recipes) {
    const group =
      recipe.recipeRecipeType[0]?.recipeType.slug ||
      recipe.recipeMealTime[0]?.mealTime.slug ||
      recipe.RecipeCategories?.name ||
      recipe.id;

    if (!seenGroups.has(group)) {
      picked.push(recipe);
      seenGroups.add(group);
    }
  }

  for (const recipe of recipes) {
    if (!picked.some((item) => item.id === recipe.id)) {
      picked.push(recipe);
    }
  }

  return picked;
}

function stableRecipeBucket(recipe: RecipeRecord) {
  const value = recipe.slug || recipe.id;
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash % 2;
}

function isAssignedToMealFocus(recipe: RecipeRecord, focus: string) {
  if (focus !== "lunch" && focus !== "dinner") return hasMealFocus(recipe, focus);

  const hasLunch = hasMealFocus(recipe, "lunch");
  const hasDinner = hasMealFocus(recipe, "dinner");

  if (hasLunch && hasDinner) {
    return focus === "lunch"
      ? stableRecipeBucket(recipe) === 0
      : stableRecipeBucket(recipe) === 1;
  }

  return hasMealFocus(recipe, focus);
}

function isGrainLedStaple(recipe: RecipeRecord) {
  return (
    hasTypeSlug(recipe, "grains") &&
    !hasTypeSlug(recipe, "protein") &&
    !hasTypeSlug(recipe, "cooked-vegetable")
  );
}

function isDailyRecipeForFocus(
  recipe: RecipeRecord,
  focus: string,
  specificFocus: boolean,
) {
  if (!specificFocus) return isMainSituationRecipe(recipe) && !isUtilityDrinkRecipe(recipe);

  if (focus === "breakfast") {
    return (
      isAllowedSituationRecipe(recipe) &&
      hasMealFocus(recipe, "breakfast") &&
      hasAnyType(recipe, BREAKFAST_RECIPE_TYPE_SLUGS) &&
      !hasAnyType(recipe, BREAKFAST_BLOCKED_TYPE_SLUGS)
    );
  }

  if (focus === "lunch" || focus === "dinner") {
    return (
      isAllowedSituationRecipe(recipe) &&
      isAssignedToMealFocus(recipe, focus) &&
      hasAnyType(recipe, LUNCH_DINNER_RECIPE_TYPE_SLUGS) &&
      !isGrainLedStaple(recipe) &&
      !hasAnyType(recipe, UTILITY_RECIPE_TYPE_SLUGS)
    );
  }

  return isMainSituationRecipe(recipe);
}

function dailyFocusScore(recipe: RecipeRecord, focus: string, specificFocus: boolean) {
  if (!specificFocus) return 0;

  if (focus === "breakfast") {
    return (
      (hasTypeSlug(recipe, "meal") ? 180 : 0) +
      (hasTypeSlug(recipe, "grains") ? 120 : 0) +
      (hasTypeSlug(recipe, "protein") ? 90 : 0) +
      (hasTypeSlug(recipe, "snacks") ? 40 : 0)
    );
  }

  if (focus === "lunch" || focus === "dinner") {
    return (
      (hasTypeSlug(recipe, "cooked-vegetable") ? 420 : 0) +
      (hasTypeSlug(recipe, "protein") ? 180 : 0) +
      (hasTypeSlug(recipe, "meal") ? 80 : 0) -
      (hasTypeSlug(recipe, "snacks") ? 240 : 0) -
      (hasTypeSlug(recipe, "grains") ? 300 : 0)
    );
  }

  return 0;
}

function buildRecipePage(
  recipes: RecipeRecord[],
  pageSize: number,
  page: number,
  getMatchLabel: (recipe: RecipeRecord) => string,
): RecipePageResult {
  return {
    recipes: paginateRecipes(recipes, pageSize, page).map((recipe) =>
      publicRecipe(recipe, getMatchLabel(recipe)),
    ),
    total: recipes.length,
  };
}

async function fetchIngredientRecipes(
  selected: string[],
  foodType: string,
  pageSize: number,
  page: number,
  mealFocus: string,
) {
  if (selected.length === 0) return { recipes: [], total: 0 };

  const recipes = await db.recipes.findMany({
    where: recipeBaseWhere({
      AND: [
        foodTypeWhere(foodType),
        { OR: selected.flatMap((ingredient) => ingredientSearchWhere(ingredient)) },
        ...(hasOnlySupportingSelection(selected)
          ? [
              {
                recipeRecipeType: {
                  some: {
                    recipeType: {
                      slug: { in: [...SUPPORT_ONLY_ALLOWED_TYPE_SLUGS] },
                    },
                  },
                },
              } satisfies Prisma.RecipesWhereInput,
            ]
          : []),
      ],
    }),
    select: recipeSelect,
    orderBy: [
      { views: "desc" },
      { contentUpdatedAt: "desc" },
      { updatedAt: "desc" },
    ],
  });

  const selectedTokens = new Set(selected.flatMap(tokens));
  const ranked = recipes
    .filter(isAllowedSituationRecipe)
    .filter((recipe) => isAllowedForIngredientMealFocus(recipe, mealFocus))
    .filter((recipe) => {
      const recipeTokens = recipeTokenSet(recipe);
      const hasUnselectedNonVeg = NON_VEG_TOKENS.some(
        (token) => recipeTokens.has(token) && !selectedTokens.has(token),
      );

      return (
        hasSelectedIngredientMatch(recipe, selected) &&
        hasNoExtraPrimaryIngredientMatch(recipe, selected) &&
        isAllowedForSelectedIngredientStrength(recipe, selected) &&
        !hasUnselectedNonVeg
      );
    })
    .map((recipe) => ({
      recipe,
      score: scoreIngredientRecipe(recipe, selected, mealFocus),
    }))
    .sort((left, right) => right.score - left.score)
    .map(({ recipe }) => recipe);

  return buildRecipePage(ranked, pageSize, page, (recipe) =>
    matchLabelForSelected(recipe, selected),
  );
}

async function fetchDailyRecipes(
  mealFocus: string,
  foodType: string,
  pageSize: number,
  page: number,
) {
  const focus = normalize(mealFocus);
  const specificFocus = focus && focus !== "full day" && focus !== "full-day";
  const where: Prisma.RecipesWhereInput = specificFocus
    ? {
        recipeMealTime: {
          some: {
            mealTime: {
              OR: [
                { title: { contains: focus } },
                { slug: { contains: slugValue(focus) } },
              ],
            },
          },
        },
      }
    : {
        recipeMealTime: {
          some: {
            mealTime: {
              OR: [
                { title: { contains: "breakfast" } },
                { slug: { contains: "breakfast" } },
                { title: { contains: "lunch" } },
                { slug: { contains: "lunch" } },
                { title: { contains: "dinner" } },
                { slug: { contains: "dinner" } },
              ],
            },
          },
        },
      };

  const recipes = await db.recipes.findMany({
    where: recipeBaseWhere({ AND: [foodTypeWhere(foodType), where] }),
    select: recipeSelect,
    orderBy: [
      { views: "desc" },
      { contentUpdatedAt: "desc" },
      { updatedAt: "desc" },
    ],
  });

  const ranked = recipes
    .filter((recipe) => isDailyRecipeForFocus(recipe, focus, Boolean(specificFocus)))
    .map((recipe) => {
      const mealMatch =
        specificFocus &&
        (focus === "lunch" || focus === "dinner"
          ? isAssignedToMealFocus(recipe, focus)
          : hasMealFocus(recipe, focus));

      return {
        recipe,
        score:
          popularityScore(recipe) +
          mainMealScore(recipe) +
          dailyFocusScore(recipe, focus, Boolean(specificFocus)) +
          (mealMatch ? 260 : 0) -
          totalMinutes(recipe) / 120,
      };
    })
    .sort((left, right) => right.score - left.score)
    .map(({ recipe }) => recipe);

  const shouldPreserveRankedOrder = focus === "lunch" || focus === "dinner";
  const orderedRecipes = shouldPreserveRankedOrder ? ranked : diversifyRecipes(ranked);

  return buildRecipePage(orderedRecipes, pageSize, page, (recipe) =>
    dailyMatchLabel(recipe, focus, Boolean(specificFocus)),
  );
}

async function fetchGuestRecipes(
  guestCount: number,
  guestPlan: string,
  foodType: string,
  pageSize: number,
  page: number,
) {
  const plan = normalize(guestPlan || "full-meal");
  const useSnackMode = plan === "snacks";
  const useQuickMode = plan === "quick";

  const recipes = await db.recipes.findMany({
    where: recipeBaseWhere(foodTypeWhere(foodType)),
    select: recipeSelect,
    orderBy: [
      { views: "desc" },
      { contentUpdatedAt: "desc" },
      { updatedAt: "desc" },
    ],
  });

  const groupSizePressure = Math.max(1, Math.min(guestCount, 24)) / 12;
  const isLargeGroup = guestCount >= 10;
  const isSmallGroup = guestCount <= 4;
  const ranked = recipes
    .filter((recipe) =>
      useSnackMode
        ? isAllowedSituationRecipe(recipe) && isSnackRecipe(recipe)
        : useQuickMode
          ? isGuestQuickRecipe(recipe)
          : isGuestFullRecipe(recipe),
    )
    .map((recipe) => {
      const minutes = totalMinutes(recipe);
      const ingredientCount = recipe._count.recipeIngredients;

      return {
        recipe,
        score:
          popularityScore(recipe) +
          (useSnackMode ? 360 : mainMealScore(recipe)) +
          (!useSnackMode && hasTypeSlug(recipe, "protein") ? 180 : 0) +
          (!useSnackMode && hasTypeSlug(recipe, "cooked-vegetable") ? 140 : 0) +
          (!useSnackMode && hasTypeSlug(recipe, "meal") ? 90 : 0) +
          (useQuickMode && minutes > 0 && minutes <= 35 ? 320 : 0) +
          (isLargeGroup && minutes <= 90 ? 90 : 0) +
          (isLargeGroup && ingredientCount <= 14 ? 130 : 0) +
          (isSmallGroup && ingredientCount >= 8 ? 95 : 0) -
          (hasTypeSlug(recipe, "snacks") && !useSnackMode ? 170 : 0) -
          ingredientCount *
            groupSizePressure *
            (isLargeGroup ? 0.9 : 0.35) -
          (useQuickMode ? Math.max(minutes - 35, 0) * 2.8 : minutes / 120),
      };
    })
    .sort((left, right) => right.score - left.score)
    .map(({ recipe }) => recipe);

  return buildRecipePage(ranked, pageSize, page, (recipe) =>
    guestMatchLabel(recipe, guestCount, plan),
  );
}

async function fetchBudgetRecipes(
  budget: number,
  foodType: string,
  pageSize: number,
  page: number,
) {
  const recipes = await db.recipes.findMany({
    where: recipeBaseWhere(foodTypeWhere(foodType)),
    select: recipeSelect,
    orderBy: [
      { views: "desc" },
      { contentUpdatedAt: "desc" },
      { updatedAt: "desc" },
    ],
  });

  const budgetUpperBound = budget * 1.08 + 10;
  const pricedRecipes = recipes
    .filter(isMainSituationRecipe)
    .filter((recipe) => !isGrainLedStaple(recipe))
    .map((recipe) => ({ recipe, cost: recipeCostEstimate(recipe) }))
    .filter(({ cost }) => cost.estimatedCostInr !== null && cost.costConfidence >= 0.55);
  const withinBudget = pricedRecipes.filter(
    ({ cost }) => (cost.estimatedCostInr ?? Number.POSITIVE_INFINITY) <= budgetUpperBound,
  );
  const pool =
    withinBudget.length > 0
      ? withinBudget
      : [...pricedRecipes]
          .sort(
            (left, right) =>
              (left.cost.estimatedCostInr ?? Number.POSITIVE_INFINITY) -
              (right.cost.estimatedCostInr ?? Number.POSITIVE_INFINITY),
          )
          .slice(0, 36);
  const targetCost = Math.max(35, budget * (budget <= 100 ? 0.72 : 0.62));
  const ranked = pool
    .map(({ recipe, cost }) => {
      const estimatedCost = cost.estimatedCostInr ?? budgetUpperBound;
      const overBudget = Math.max(estimatedCost - budget, 0);
      const rangeDistance = Math.abs(estimatedCost - targetCost);

      return {
        recipe,
        score:
          popularityScore(recipe) +
          mainMealScore(recipe) +
          (estimatedCost <= budgetUpperBound ? 420 : 0) +
          (hasTypeSlug(recipe, "cooked-vegetable") ? 150 : 0) +
          (hasTypeSlug(recipe, "protein") ? 90 : 0) -
          rangeDistance * (budget <= 100 ? 1.4 : 3.2) -
          overBudget * 5 -
          cost.missingPriceCount * 45 -
          cost.missingConversionCount * 80 -
          totalMinutes(recipe) / 45,
      };
    })
    .sort((left, right) => right.score - left.score)
    .map(({ recipe }) => recipe);

  return buildRecipePage(ranked, pageSize, page, (recipe) =>
    matchLabelForGeneral(recipe, "budget"),
  );
}

async function fetchMomsRecipes(foodType: string, pageSize: number, page: number) {
  const recipes = await db.recipes.findMany({
    where: recipeBaseWhere(foodTypeWhere(foodType)),
    select: recipeSelect,
    orderBy: [
      { views: "desc" },
      { contentUpdatedAt: "desc" },
      { updatedAt: "desc" },
    ],
  });

  const ranked = recipes
    .filter(isAllowedSituationRecipe)
    .filter((recipe) => hasAnyType(recipe, KIDS_FRIENDLY_TYPE_SLUGS))
    .filter((recipe) => !hasAnyType(recipe, UTILITY_RECIPE_TYPE_SLUGS))
    .map((recipe) => {
      const text = recipeDiscoveryText(recipe);
      const category = recipeCategoryText(recipe);

      return {
        recipe,
        score:
          popularityScore(recipe) +
          (hasTypeSlug(recipe, "snacks") ? 180 : 0) +
          (hasTypeSlug(recipe, "grains") ? 140 : 0) +
          (hasTypeSlug(recipe, "protein") ? 110 : 0) +
          (category.includes("veg") ? 45 : 0) +
          mainMealScore(recipe) * 0.6 -
          (KIDS_AVOID_PATTERN.test(text) ? 260 : 0) -
          Math.max(totalMinutes(recipe) - 45, 0) * 2,
      };
    })
    .sort((left, right) => right.score - left.score)
    .map(({ recipe }) => recipe);

  return buildRecipePage(diversifyRecipes(ranked), pageSize, page, () =>
    "Kids-friendly pick",
  );
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = normalize(searchParams.get("mode") || "ingredients");
    const pageSize = Math.min(
      Math.max(Number(searchParams.get("pageSize") || 6), 1),
      12,
    );
    const page = Math.max(Number(searchParams.get("page") || 0), 0);
    const foodType = normalize(searchParams.get("foodType") || "veg");
    let result: RecipePageResult = { recipes: [], total: 0 };

    if (mode === "ingredients") {
      const selected = [
        ...searchParams.getAll("ingredient"),
        ...searchParams.getAll("item"),
      ]
        .flatMap((value) => value.split(","))
        .map(normalize)
        .filter(Boolean);

      result = await fetchIngredientRecipes(
        filterPrimaryIngredientValues(selected, 10),
        foodType,
        pageSize,
        page,
        searchParams.get("mealFocus") || "full-day",
      );
    } else if (mode === "daily") {
      result = await fetchDailyRecipes(
        searchParams.get("mealFocus") || "full-day",
        foodType,
        pageSize,
        page,
      );
    } else if (mode === "guests") {
      result = await fetchGuestRecipes(
        Math.max(Number(searchParams.get("guestCount") || 5), 1),
        searchParams.get("guestPlan") || "full-meal",
        foodType,
        pageSize,
        page,
      );
    } else if (mode === "budget") {
      result = await fetchBudgetRecipes(
        Math.max(Number(searchParams.get("budget") || 150), 1),
        foodType,
        pageSize,
        page,
      );
    } else if (mode === "moms") {
      result = await fetchMomsRecipes(foodType, pageSize, page);
    }

    return NextResponse.json(
      {
        ...result,
        page,
        pageSize,
        hasPrevious: page > 0,
        hasNext: (page + 1) * pageSize < result.total,
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("[SITUATION_RECIPE_MATCHES]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
