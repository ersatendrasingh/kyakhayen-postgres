import type { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

import {
  foodCompareGoals,
  type FoodCompareFood,
  type FoodCompareGoalId,
  type FoodCompareHealthTone,
  type FoodCompareMetric,
  type FoodCompareNutrition,
  type FoodComparePoint,
  type FoodCompareResult,
  type FoodCompareSide,
  type FoodCompareSuggestion,
  type FoodCompareWinner,
} from "@/components/sections/food-compare/types";
import {
  calculateRecipeNutrition,
  recipeIngredientGrams,
} from "@/lib/calculate-recipe-nutrition";
import { db } from "@/lib/db";
import { publishedRecipeWhere } from "@/lib/recipe-publication";
import { recipeHref, stripHtml } from "@/lib/seo";
import type { RecipeIngredientType } from "@/types/recipe";

const recipeSelect = {
  id: true,
  title: true,
  slug: true,
  metaSlug: true,
  description: true,
  imageUrl: true,
  views: true,
  RecipeCategories: { select: { name: true, slug: true } },
  recipeCookingTime: {
    select: { prepTime: true, cookTime: true, restTime: true },
  },
  recipeMealTime: {
    where: { mealTime: { isPublished: true } },
    select: { mealTime: { select: { title: true, slug: true } } },
    take: 4,
  },
  recipeRecipeType: {
    where: { recipeType: { isPublished: true } },
    select: { recipeType: { select: { title: true, slug: true } } },
    take: 4,
  },
  recipeCuisine: {
    where: { cuisine: { isPublished: true } },
    select: { cuisine: { select: { title: true, slug: true } } },
    take: 4,
  },
  recipeCookingMethods: {
    where: { cookingMethod: { isPublished: true } },
    select: { cookingMethod: { select: { title: true, slug: true } } },
    take: 4,
  },
  recipeIngredients: {
    select: {
      id: true,
      ingredientId: true,
      quantity: true,
      formId: true,
      unitId: true,
      position: true,
      recipeId: true,
      unit: { select: { id: true, title: true, shortName: true, position: true } },
      ingredientForm: { select: { id: true, name: true, position: true } },
      ingredient: {
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
          nutritionSource: true,
          nutritionBasisGrams: true,
          calories: true,
          carbohydrate: true,
          totalFat: true,
          dietaryFiber: true,
          protein: true,
          vitaminA: true,
          ascorbicAcids: true,
          vitaminD: true,
          tocopherolEquivalent: true,
          vitaminK: true,
          thiamine: true,
          riboflavin: true,
          totalB6: true,
          folates: true,
          calcium: true,
          iron: true,
          phosphorus: true,
          potassium: true,
          sodium: true,
          zinc: true,
          marketPriceInr: true,
          marketPriceBasisGrams: true,
          marketPriceSource: true,
          marketPriceUpdatedAt: true,
          ingredientCategoriesId: true,
          isPublished: true,
          createdAt: true,
          updatedAt: true,
          IngredientUnitMeasurements: {
            select: { id: true, ingredientId: true, unitId: true, values: true },
          },
        },
      },
    },
    orderBy: { position: "asc" },
  },
} satisfies Prisma.RecipesSelect;

type CompareRecipe = Prisma.RecipesGetPayload<{ select: typeof recipeSelect }>;

const mainFoodTypeSlugs = new Set([
  "meal",
  "protein",
  "cooked vegetable",
  "grains",
  "snacks",
  "desserts",
].map(normalize));

const lowValueRecipeTypeSlugs = new Set([
  "drink teas",
  "drink infusions",
  "drink juices",
  "drink coolers sharbat",
  "drink smoothies",
  "drink shakes",
  "drink lassi buttermilk",
  "drink detox",
  "drink hot sips",
  "morning hydration",
  "chutneydips",
  "curdraita",
].map(normalize));

const friedSignals = [
  "deep fried",
  "deep fry",
  "fried",
  "fry",
  "samosa",
  "kachori",
  "pakora",
  "pakoda",
  "bhatura",
  "bhature",
  "poori",
  "puri",
  "chips",
  "fries",
];

const lighterCookingSignals = [
  "steamed",
  "steam",
  "boiled",
  "boil",
  "baked",
  "bake",
  "grilled",
  "grill",
  "roasted",
  "roast",
  "air fried",
  "air fry",
];

const titleStopTokens = new Set([
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
  "masala",
  "recipe",
  "restaurant",
  "style",
  "the",
  "with",
]);

const competitorFamilies = [
  {
    id: "noodles",
    signals: [
      "noodle",
      "noodles",
      "chowmein",
      "chow mein",
      "hakka",
      "schezwan noodles",
    ],
  },
  {
    id: "rice-meal",
    signals: [
      "rice",
      "fried rice",
      "pulao",
      "biryani",
      "khichdi",
      "tehri",
    ],
  },
  {
    id: "breakfast-bowl",
    signals: ["poha", "upma", "sabudana", "daliya", "oats upma"],
  },
  {
    id: "south-breakfast",
    signals: ["idli", "dosa", "uttapam", "appam", "pongal"],
  },
  {
    id: "fried-snack",
    signals: ["samosa", "kachori", "pakora", "pakoda", "vada"],
  },
  {
    id: "light-snack",
    signals: ["dhokla", "khandvi", "idli", "sprouts", "chaat"],
  },
  {
    id: "bread-curry",
    signals: ["bhature", "bhatura", "poori", "puri", "kulcha", "paratha", "naan"],
  },
  {
    id: "flatbread",
    signals: ["roti", "chapati", "phulka", "paratha", "naan", "kulcha"],
  },
  {
    id: "paneer-tofu",
    signals: ["paneer", "tofu", "soy chaap", "chaap"],
  },
  {
    id: "dal-beans",
    signals: ["dal", "rajma", "chole", "chana", "beans", "lentil"],
  },
  {
    id: "sabzi",
    signals: ["sabzi", "subzi", "bhindi", "aloo", "gobi", "matar", "palak"],
  },
  {
    id: "egg-protein",
    signals: ["egg", "omelette", "omelet", "anda", "bhurji"],
  },
  {
    id: "halwa",
    signals: ["halwa", "sheera"],
  },
  {
    id: "kheer",
    signals: ["kheer", "payasam", "phirni"],
  },
  {
    id: "laddu",
    signals: ["laddu", "ladoo"],
  },
  {
    id: "barfi",
    signals: ["barfi", "burfi", "katli"],
  },
  {
    id: "mithai",
    signals: [
      "mithai",
      "sweet",
      "dessert",
      "gulab jamun",
      "rasgulla",
      "jalebi",
      "rasmalai",
      "kulfi",
      "ice cream",
    ],
  },
];

const relatedFamilyPairs = [
  ["fried-snack", "light-snack"],
  ["bread-curry", "flatbread"],
  ["noodles", "rice-meal"],
  ["paneer-tofu", "egg-protein"],
  ["dal-beans", "paneer-tofu"],
  ["halwa", "kheer"],
  ["laddu", "barfi"],
  ["kheer", "mithai"],
  ["halwa", "mithai"],
];

const metricDefinitions = [
  {
    key: "calories",
    label: "Calories",
    unit: "kcal",
    lowerIsBetter: true,
  },
  {
    key: "protein",
    label: "Protein",
    unit: "g",
    lowerIsBetter: false,
  },
  {
    key: "dietaryFiber",
    label: "Fiber",
    unit: "g",
    lowerIsBetter: false,
  },
  {
    key: "carbohydrate",
    label: "Carbs",
    unit: "g",
    lowerIsBetter: false,
  },
  {
    key: "totalFat",
    label: "Fat",
    unit: "g",
    lowerIsBetter: true,
  },
  {
    key: "sodium",
    label: "Sodium",
    unit: "mg",
    lowerIsBetter: true,
  },
  {
    key: "timeMinutes",
    label: "Time",
    unit: "min",
    lowerIsBetter: true,
  },
] satisfies Array<{
  key: keyof FoodCompareNutrition | "timeMinutes";
  label: string;
  unit: string;
  lowerIsBetter: boolean;
}>;

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

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function wordTokens(value: string) {
  return normalize(value)
    .split(" ")
    .filter((token) => token.length >= 2);
}

function typoCandidateTerms(query: string) {
  const normalizedQuery = normalize(query);
  const tokens = wordTokens(normalizedQuery);
  const terms = new Set([normalizedQuery]);

  for (const token of tokens) {
    if (token.length >= 3) terms.add(token.slice(0, 3));
    if (token.length >= 4) terms.add(token.slice(0, -1));

    for (let index = 1; index < token.length; index += 1) {
      if (token[index] === token[index - 1]) {
        terms.add(`${token.slice(0, index)}${token.slice(index + 1)}`);
      }
    }
  }

  return uniqueValues([...terms]).filter((term) => term.length >= 3).slice(0, 8);
}

function editDistance(leftValue: string, rightValue: string) {
  const left = leftValue.trim();
  const right = rightValue.trim();

  if (left === right) return 0;
  if (!left) return right.length;
  if (!right) return left.length;

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = leftIndex - 1;
    previous[0] = leftIndex;

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const oldValue = previous[rightIndex];
      const cost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      previous[rightIndex] = Math.min(
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + 1,
        diagonal + cost,
      );
      diagonal = oldValue;
    }
  }

  return previous[right.length];
}

function tokenMatchScore(queryToken: string, targetToken: string) {
  if (queryToken === targetToken) return 1;
  if (targetToken.startsWith(queryToken)) return 0.92;
  if (queryToken.length >= 4 && queryToken.startsWith(targetToken)) return 0.82;

  const maxLength = Math.max(queryToken.length, targetToken.length);
  if (maxLength < 4) return 0;

  const distance = editDistance(queryToken, targetToken);
  const score = 1 - distance / maxLength;

  if (maxLength <= 5) return distance <= 1 ? score : 0;
  if (maxLength <= 8) return distance <= 2 ? score : 0;
  return distance <= 3 ? score : 0;
}

function fuzzyTokenScore(query: string, text: string) {
  const queryTokens = wordTokens(query);
  const targetTokens = wordTokens(text);

  if (queryTokens.length === 0 || targetTokens.length === 0) return 0;

  const scores = queryTokens.map((queryToken) =>
    targetTokens.reduce(
      (best, targetToken) => Math.max(best, tokenMatchScore(queryToken, targetToken)),
      0,
    ),
  );

  const hasWeakToken = scores.some((score) => score < 0.62);
  if (hasWeakToken) return 0;

  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function safeGoal(value: string | null | undefined): FoodCompareGoalId {
  return foodCompareGoals.some((goal) => goal.id === value)
    ? (value as FoodCompareGoalId)
    : "balanced";
}

function totalMinutes(recipe: CompareRecipe) {
  if (!recipe.recipeCookingTime) return null;

  const total =
    recipe.recipeCookingTime.prepTime +
    recipe.recipeCookingTime.cookTime +
    recipe.recipeCookingTime.restTime;

  return total > 0 ? total : null;
}

function recipeCuisineLabel(recipe: CompareRecipe) {
  return recipe.recipeCuisine[0]?.cuisine.title ?? null;
}

function recipeTypeSlugs(recipe: CompareRecipe) {
  return new Set(recipe.recipeRecipeType.map((item) => normalize(item.recipeType.slug)));
}

function recipeMealSlugs(recipe: CompareRecipe) {
  return new Set(recipe.recipeMealTime.map((item) => normalize(item.mealTime.slug)));
}

function recipeCuisineSlugs(recipe: CompareRecipe) {
  return new Set(recipe.recipeCuisine.map((item) => normalize(item.cuisine.slug)));
}

function recipeCookingMethodSlugs(recipe: CompareRecipe) {
  return new Set(recipe.recipeCookingMethods.map((item) => normalize(item.cookingMethod.slug)));
}

function recipeTypeRawSlugs(recipe: CompareRecipe) {
  return uniqueValues(recipe.recipeRecipeType.map((item) => item.recipeType.slug));
}

function recipeMealRawSlugs(recipe: CompareRecipe) {
  return uniqueValues(recipe.recipeMealTime.map((item) => item.mealTime.slug));
}

function recipeCuisineRawSlugs(recipe: CompareRecipe) {
  return uniqueValues(recipe.recipeCuisine.map((item) => item.cuisine.slug));
}

function recipeCookingMethodRawSlugs(recipe: CompareRecipe) {
  return uniqueValues(recipe.recipeCookingMethods.map((item) => item.cookingMethod.slug));
}

function setOverlapCount(left: Set<string>, right: Set<string>) {
  let count = 0;
  left.forEach((item) => {
    if (right.has(item)) count += 1;
  });
  return count;
}

function recipeTitleTokens(recipe: CompareRecipe) {
  return new Set(
    wordTokens(`${recipe.title} ${recipe.slug}`)
      .filter((token) => token.length >= 3)
      .filter((token) => !titleStopTokens.has(token)),
  );
}

function recipeFamilyText(recipe: CompareRecipe) {
  return normalize(
    [
      recipe.title,
      recipe.slug,
      recipe.RecipeCategories?.name,
      recipe.RecipeCategories?.slug,
      ...recipe.recipeMealTime.map((item) => item.mealTime.title),
      ...recipe.recipeMealTime.map((item) => item.mealTime.slug),
      ...recipe.recipeRecipeType.map((item) => item.recipeType.title),
      ...recipe.recipeRecipeType.map((item) => item.recipeType.slug),
      ...recipe.recipeCuisine.map((item) => item.cuisine.title),
      ...recipe.recipeCuisine.map((item) => item.cuisine.slug),
      ...recipe.recipeCookingMethods.map((item) => item.cookingMethod.title),
      ...recipe.recipeCookingMethods.map((item) => item.cookingMethod.slug),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function recipeFamilies(recipe: CompareRecipe) {
  const text = recipeFamilyText(recipe);
  return new Set(
    competitorFamilies
      .filter((family) => family.signals.some((signal) => text.includes(normalize(signal))))
      .map((family) => family.id),
  );
}

function relatedFamilyScore(left: Set<string>, right: Set<string>) {
  return relatedFamilyPairs.reduce((score, [first, second]) => {
    const matches =
      (left.has(first) && right.has(second)) || (left.has(second) && right.has(first));
    return matches ? score + 68 : score;
  }, 0);
}

function competitorFamilySignals(families: Set<string>) {
  const candidateFamilies = new Set(families);

  relatedFamilyPairs.forEach(([first, second]) => {
    if (families.has(first)) candidateFamilies.add(second);
    if (families.has(second)) candidateFamilies.add(first);
  });

  return uniqueValues(
    competitorFamilies
      .filter((family) => candidateFamilies.has(family.id))
      .flatMap((family) => family.signals)
      .map(normalize)
      .filter((signal) => signal.length >= 3),
  );
}

function competitorMatchScore(base: CompareRecipe, candidate: CompareRecipe) {
  if (base.id === candidate.id) return -10000;

  if (!isUsefulComparableFood(candidate)) return -10000;

  const baseTypes = recipeTypeSlugs(base);
  const candidateTypes = recipeTypeSlugs(candidate);
  const baseMeals = recipeMealSlugs(base);
  const candidateMeals = recipeMealSlugs(candidate);
  const baseCuisines = recipeCuisineSlugs(base);
  const candidateCuisines = recipeCuisineSlugs(candidate);
  const baseMethods = recipeCookingMethodSlugs(base);
  const candidateMethods = recipeCookingMethodSlugs(candidate);
  const baseFamilies = recipeFamilies(base);
  const candidateFamilies = recipeFamilies(candidate);
  const baseTokens = recipeTitleTokens(base);
  const candidateTokens = recipeTitleTokens(candidate);

  const typeOverlap = setOverlapCount(baseTypes, candidateTypes);
  const mealOverlap = setOverlapCount(baseMeals, candidateMeals);
  const cuisineOverlap = setOverlapCount(baseCuisines, candidateCuisines);
  const methodOverlap = setOverlapCount(baseMethods, candidateMethods);
  const familyOverlap = setOverlapCount(baseFamilies, candidateFamilies);
  const titleOverlap = setOverlapCount(baseTokens, candidateTokens);
  const sameCategory =
    normalize(base.RecipeCategories?.slug || base.RecipeCategories?.name || "") ===
    normalize(candidate.RecipeCategories?.slug || candidate.RecipeCategories?.name || "");

  let score = 0;
  if (sameCategory) score += 48;
  score += typeOverlap * 58;
  score += mealOverlap * 44;
  score += cuisineOverlap * 26;
  score += methodOverlap * 20;
  score += familyOverlap * 92;
  score += relatedFamilyScore(baseFamilies, candidateFamilies);
  score += Math.min(titleOverlap, 3) * 24;
  score += Math.log10(Math.max(candidate.views, 0) + 10) * 18;

  if (baseTypes.has("snacks") && candidateTypes.has("snacks")) score += 18;
  if (baseTypes.has("meal") && candidateTypes.has("meal")) score += 18;
  if (baseTypes.has("grains") && candidateTypes.has("grains")) score += 14;

  const hasStrongSignal =
    familyOverlap > 0 ||
    relatedFamilyScore(baseFamilies, candidateFamilies) > 0 ||
    typeOverlap > 0 ||
    mealOverlap > 0 ||
    titleOverlap > 0 ||
    sameCategory;

  if (!hasStrongSignal) score -= 120;

  return score;
}

function competitorMatchReason(base: CompareRecipe, candidate: CompareRecipe) {
  const familyOverlap = setOverlapCount(recipeFamilies(base), recipeFamilies(candidate));
  const familyRelated = relatedFamilyScore(recipeFamilies(base), recipeFamilies(candidate)) > 0;
  const typeOverlap = setOverlapCount(recipeTypeSlugs(base), recipeTypeSlugs(candidate));
  const mealOverlap = setOverlapCount(recipeMealSlugs(base), recipeMealSlugs(candidate));
  const cuisineOverlap = setOverlapCount(recipeCuisineSlugs(base), recipeCuisineSlugs(candidate));

  if (familyOverlap > 0) return "Similar food type";
  if (familyRelated) return "Common alternative";
  if (typeOverlap > 0 && mealOverlap > 0) return "Same meal and recipe type";
  if (typeOverlap > 0) return "Similar recipe type";
  if (mealOverlap > 0) return "Same meal slot";
  if (cuisineOverlap > 0) return "Similar cuisine";
  return "Good comparison match";
}

function recipeCookingMethods(recipe: CompareRecipe) {
  return recipe.recipeCookingMethods.map((item) => item.cookingMethod.title);
}

function recipeHealthText(recipe: CompareRecipe) {
  return normalize(
    [
      recipe.title,
      recipe.slug,
      recipe.RecipeCategories?.name,
      ...recipe.recipeRecipeType.map((item) => item.recipeType.title),
      ...recipe.recipeRecipeType.map((item) => item.recipeType.slug),
      ...recipe.recipeCuisine.map((item) => item.cuisine.title),
      ...recipe.recipeCuisine.map((item) => item.cuisine.slug),
      ...recipe.recipeCookingMethods.map((item) => item.cookingMethod.title),
      ...recipe.recipeCookingMethods.map((item) => item.cookingMethod.slug),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function hasAnySignal(text: string, signals: string[]) {
  return signals.some((signal) => text.includes(signal));
}

function buildFoodHealth({
  recipe,
  nutrients,
}: {
  recipe: CompareRecipe;
  nutrients: FoodCompareNutrition;
}) {
  const healthText = recipeHealthText(recipe);
  const typeSlugs = recipeTypeSlugs(recipe);
  const isFried = hasAnySignal(healthText, friedSignals);
  const hasLighterCooking = hasAnySignal(healthText, lighterCookingSignals);
  let score = 50;
  const positives: string[] = [];
  const watchouts: string[] = [];

  if (nutrients.protein >= 20) {
    score += 12;
    positives.push("strong protein for fullness");
  } else if (nutrients.protein >= 12) {
    score += 8;
    positives.push("decent protein");
  } else if (nutrients.protein < 7) {
    score -= 5;
  }

  if (nutrients.dietaryFiber >= 8) {
    score += 14;
    positives.push("high fiber");
  } else if (nutrients.dietaryFiber >= 4) {
    score += 8;
    positives.push("good fiber");
  } else if (nutrients.dietaryFiber < 2) {
    score -= 6;
    watchouts.push("low fiber, so it may not keep you full for long");
  }

  if (nutrients.calories <= 250) {
    score += 10;
    positives.push("lighter calorie portion");
  } else if (nutrients.calories <= 400) {
    score += 4;
  } else if (nutrients.calories >= 650) {
    score -= 16;
    watchouts.push("calorie-heavy, so portion size matters");
  } else if (nutrients.calories >= 500) {
    score -= 9;
    watchouts.push("moderately calorie-heavy");
  }

  if (nutrients.totalFat <= 8) {
    score += 6;
  } else if (nutrients.totalFat >= 25) {
    score -= 14;
    watchouts.push("higher fat");
  } else if (nutrients.totalFat >= 16) {
    score -= 8;
    watchouts.push("fat is on the higher side");
  }

  if (nutrients.sodium <= 300) {
    score += 5;
  } else if (nutrients.sodium >= 1000) {
    score -= 14;
    watchouts.push("high sodium");
  } else if (nutrients.sodium >= 700) {
    score -= 8;
    watchouts.push("sodium is on the higher side");
  }

  if (hasLighterCooking) {
    score += 8;
    positives.push("lighter cooking method");
  }

  if (isFried) {
    score -= 18;
    watchouts.push("fried or deep-fried style, better kept occasional");
  }

  if (typeSlugs.has("snacks")) score -= 3;

  score = Math.max(0, Math.min(100, Math.round(score)));

  let tone: FoodCompareHealthTone = "balanced";
  let label = "Balanced choice";
  let summary = "Can work in a regular meal when portion size and the rest of the plate are balanced.";

  if (score >= 70) {
    tone = "positive";
    label = "Everyday-friendly";
    summary = "Looks more suitable for regular eating because the nutrition profile is easier to balance.";
  } else if (score < 40 || (isFried && (nutrients.calories >= 450 || nutrients.totalFat >= 14))) {
    tone = "occasional";
    label = "Occasional pick";
    summary = "Better as an occasional or small-portion food for regular eating.";
  } else if (score < 55 || watchouts.length >= 2 || isFried) {
    tone = "watch";
    label = "Portion watch";
    summary = "Can fit sometimes, but portion size and meal balance matter more here.";
  }

  return {
    label,
    tone,
    summary,
    positives: positives.length > 0 ? positives.slice(0, 3) : ["works best with balanced portions"],
    watchouts: watchouts.slice(0, 3),
    score,
  };
}

function isUsefulComparableFood(recipe: CompareRecipe) {
  if (!recipe.imageUrl || recipe.recipeIngredients.length === 0) return false;

  const typeSlugs = recipeTypeSlugs(recipe);
  const hasMainType =
    typeSlugs.size === 0 ||
    recipe.recipeRecipeType.some((item) => mainFoodTypeSlugs.has(normalize(item.recipeType.slug)));
  const isLowValue = recipe.recipeRecipeType.some((item) =>
    lowValueRecipeTypeSlugs.has(normalize(item.recipeType.slug)),
  );

  return hasMainType && !isLowValue;
}

function nutritionForRecipe(recipe: CompareRecipe) {
  const { totals, missingConversions } = calculateRecipeNutrition(
    recipe.recipeIngredients as unknown as RecipeIngredientType[],
  );
  const hasNutrition =
    recipe.recipeIngredients.length > 0 &&
    recipe.recipeIngredients.every((item) => item.ingredient.isPublished) &&
    missingConversions.length === 0;

  return { totals, missingConversions, hasNutrition };
}

function estimateServings(calories: number) {
  if (!Number.isFinite(calories) || calories <= 0) return 1;
  return Math.min(Math.max(Math.ceil(calories / 650), 1), 8);
}

function roundCostInr(value: number) {
  const interval = value < 100 ? 5 : 10;
  return Math.max(interval, Math.round(value / interval) * interval);
}

function recipeCostEstimate(recipe: CompareRecipe) {
  let total = 0;
  let pricedIngredientCount = 0;

  for (const recipeIngredient of recipe.recipeIngredients) {
    const grams = recipeIngredientGrams(recipeIngredient as unknown as RecipeIngredientType);

    if (grams === null) continue;

    const price = recipeIngredient.ingredient.marketPriceInr;
    const basisGrams = recipeIngredient.ingredient.marketPriceBasisGrams || 100;

    if (price === null || price <= 0 || basisGrams <= 0) continue;

    total += (grams / basisGrams) * price;
    pricedIngredientCount += 1;
  }

  return pricedIngredientCount > 0 ? roundCostInr(total) : null;
}

function mapNutrition(
  totals: ReturnType<typeof calculateRecipeNutrition>["totals"],
  servings = 1,
) {
  const scale = (value: number) => value / servings;

  return {
    calories: round(scale(totals.calories), 0),
    protein: round(scale(totals.protein), 1),
    carbohydrate: round(scale(totals.carbohydrate), 1),
    totalFat: round(scale(totals.totalFat), 1),
    dietaryFiber: round(scale(totals.dietaryFiber), 1),
    sodium: round(scale(totals.sodium), 0),
    potassium: round(scale(totals.potassium), 0),
    calcium: round(scale(totals.calcium), 0),
    iron: round(scale(totals.iron), 1),
  } satisfies FoodCompareNutrition;
}

function shortDescription(recipe: CompareRecipe) {
  const text = stripHtml(recipe.description || "");
  if (!text) return null;

  return text.length > 132 ? `${text.slice(0, 129).trim()}...` : text;
}

function mapFood(recipe: CompareRecipe): FoodCompareFood | null {
  const nutrition = nutritionForRecipe(recipe);
  if (!nutrition.hasNutrition) return null;

  const estimatedServings = estimateServings(nutrition.totals.calories);
  const nutrients = mapNutrition(nutrition.totals, estimatedServings);
  const cookingMethods = recipeCookingMethods(recipe);

  return {
    id: recipe.id,
    label: recipe.title,
    href: recipeHref(recipe),
    imageUrl: recipe.imageUrl,
    category: recipe.RecipeCategories?.name ?? null,
    cuisine: recipeCuisineLabel(recipe),
    estimatedCostInr: recipeCostEstimate(recipe),
    timeMinutes: totalMinutes(recipe),
    calories: nutrients.calories,
    protein: nutrients.protein,
    fiber: nutrients.dietaryFiber,
    description: shortDescription(recipe),
    estimatedServings,
    cookingMethods,
    health: buildFoodHealth({ recipe, nutrients }),
    nutrients,
    missingData: nutrition.missingConversions,
  };
}

function mapSuggestion(recipe: CompareRecipe): FoodCompareSuggestion | null {
  const food = mapFood(recipe);
  if (!food) return null;

  return {
    id: food.id,
    label: food.label,
    href: food.href,
    imageUrl: food.imageUrl,
    category: food.category,
    cuisine: food.cuisine,
    estimatedCostInr: food.estimatedCostInr,
    timeMinutes: food.timeMinutes,
    calories: food.calories,
    protein: food.protein,
    fiber: food.fiber,
  };
}

function recipeSearchText(recipe: CompareRecipe) {
  return normalize(
    [
      recipe.title,
      recipe.slug,
      recipe.RecipeCategories?.name,
      ...recipe.recipeMealTime.map((item) => item.mealTime.title),
      ...recipe.recipeRecipeType.map((item) => item.recipeType.title),
      ...recipe.recipeCuisine.map((item) => item.cuisine.title),
      ...recipe.recipeIngredients.map((item) => item.ingredient.name),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function queryRank(recipe: CompareRecipe, query: string) {
  if (!query) return 0;

  const title = normalize(recipe.title);
  const slug = normalize(recipe.slug);
  const text = recipeSearchText(recipe);
  const titleFuzzyScore = fuzzyTokenScore(query, title);
  const textFuzzyScore = fuzzyTokenScore(query, text);

  if (title === query || slug === query) return 5;
  if (title.startsWith(query) || slug.startsWith(query)) return 4;
  if (title.split(" ").some((word) => word.startsWith(query))) return 3;
  if (text.includes(query)) return 2;
  if (titleFuzzyScore >= 0.84) return 1.7;
  if (textFuzzyScore >= 0.78) return 1.1;

  return -1;
}

function scoreRecipe(recipe: CompareRecipe, query: string) {
  if (!isUsefulComparableFood(recipe)) return -10000;

  const typeSlugs = recipeTypeSlugs(recipe);
  let score = Math.log10(Math.max(recipe.views, 0) + 10) * 70;

  if (typeSlugs.has("meal")) score += 180;
  if (typeSlugs.has("protein")) score += 170;
  if (typeSlugs.has("cooked vegetable")) score += 130;
  if (typeSlugs.has("grains")) score += 60;
  if (typeSlugs.has("snacks")) score -= 35;

  const minutes = totalMinutes(recipe);
  if (minutes && minutes <= 35) score += 35;

  if (query) score += queryRank(recipe, query) * 260;

  return score;
}

async function recipeCandidates(query = "", take = 120) {
  const normalizedQuery = normalize(query);

  return db.recipes.findMany({
    where: {
      AND: [
        publishedRecipeWhere(),
        { imageUrl: { not: null } },
        ...(normalizedQuery
          ? [
              {
                OR: [
                  { title: { contains: normalizedQuery } },
                  { slug: { contains: slugValue(normalizedQuery) } },
                  {
                    recipeIngredients: {
                      some: {
                        ingredient: {
                          OR: [
                            { name: { contains: normalizedQuery } },
                            { slug: { contains: slugValue(normalizedQuery) } },
                          ],
                        },
                      },
                    },
                  },
                ],
              } satisfies Prisma.RecipesWhereInput,
            ]
          : []),
      ],
    },
    select: recipeSelect,
    orderBy: [
      { views: "desc" },
      { contentUpdatedAt: "desc" },
      { updatedAt: "desc" },
    ],
    take,
  });
}

async function recipeCompetitorCandidates(baseRecipe: CompareRecipe, take = 220) {
  const familySignals = competitorFamilySignals(recipeFamilies(baseRecipe)).slice(0, 18);
  const titleSignals = [...recipeTitleTokens(baseRecipe)].slice(0, 8);
  const typeSlugs = recipeTypeRawSlugs(baseRecipe);
  const mealSlugs = recipeMealRawSlugs(baseRecipe);
  const cuisineSlugs = recipeCuisineRawSlugs(baseRecipe);
  const methodSlugs = recipeCookingMethodRawSlugs(baseRecipe);
  const categorySlug = baseRecipe.RecipeCategories?.slug;
  const categoryName = baseRecipe.RecipeCategories?.name;
  const orConditions: Prisma.RecipesWhereInput[] = [];

  if (categorySlug) orConditions.push({ RecipeCategories: { slug: categorySlug } });
  if (categoryName) orConditions.push({ RecipeCategories: { name: categoryName } });

  if (typeSlugs.length > 0) {
    orConditions.push({
      recipeRecipeType: { some: { recipeType: { slug: { in: typeSlugs } } } },
    });
  }

  if (mealSlugs.length > 0) {
    orConditions.push({
      recipeMealTime: { some: { mealTime: { slug: { in: mealSlugs } } } },
    });
  }

  if (cuisineSlugs.length > 0) {
    orConditions.push({
      recipeCuisine: { some: { cuisine: { slug: { in: cuisineSlugs } } } },
    });
  }

  if (methodSlugs.length > 0) {
    orConditions.push({
      recipeCookingMethods: { some: { cookingMethod: { slug: { in: methodSlugs } } } },
    });
  }

  [...familySignals, ...titleSignals].forEach((signal) => {
    orConditions.push(
      { title: { contains: signal } },
      { slug: { contains: slugValue(signal) } },
    );
  });

  if (orConditions.length === 0) return recipeCandidates("", Math.min(take, 140));

  const targetedCandidates = await db.recipes.findMany({
    where: {
      AND: [
        publishedRecipeWhere(),
        { imageUrl: { not: null } },
        { id: { not: baseRecipe.id } },
        { OR: orConditions },
      ],
    },
    select: recipeSelect,
    orderBy: [
      { views: "desc" },
      { contentUpdatedAt: "desc" },
      { updatedAt: "desc" },
    ],
    take,
  });

  if (targetedCandidates.length >= Math.min(24, take)) return targetedCandidates;

  const fallbackCandidates = await recipeCandidates("", Math.min(140, take));

  return Array.from(
    new Map(
      [...targetedCandidates, ...fallbackCandidates]
        .filter((recipe) => recipe.id !== baseRecipe.id)
        .map((recipe) => [recipe.id, recipe]),
    ).values(),
  );
}

async function fetchFoodCompareSuggestionsUncached({
  query = "",
  contextId,
  limit = 18,
}: {
  query?: string;
  contextId?: string | null;
  limit?: number;
}) {
  const safeLimit = Math.min(Math.max(limit, 1), 30);
  const normalizedQuery = normalize(query);
  const candidateTerms = normalizedQuery ? typoCandidateTerms(normalizedQuery) : [];
  const [contextRecipe, exactRecipes, ...expandedRecipeLists] = await Promise.all([
    contextId
      ? db.recipes.findFirst({
          where: { id: contextId, AND: [publishedRecipeWhere(), { imageUrl: { not: null } }] },
          select: recipeSelect,
        })
      : Promise.resolve(null),
    recipeCandidates(normalizedQuery, normalizedQuery ? 120 : 180),
    ...candidateTerms
      .filter((term) => term !== normalizedQuery)
      .map((term) => recipeCandidates(term, 80)),
  ]);
  const matchedRecipes = Array.from(
    new Map(
      [...exactRecipes, ...expandedRecipeLists.flat()].map((recipe) => [recipe.id, recipe]),
    ).values(),
  );
  const broadRecipes =
    normalizedQuery.length >= 3 && matchedRecipes.length < safeLimit * 4
      ? await recipeCandidates("", 220)
      : [];
  const recipes = Array.from(
    new Map(
      [...matchedRecipes, ...broadRecipes].map((recipe) => [recipe.id, recipe]),
    ).values(),
  );

  const rankedRecipes = recipes
    .filter(isUsefulComparableFood)
    .map((recipe) => ({
      recipe,
      rank: queryRank(recipe, normalizedQuery),
      score: scoreRecipe(recipe, normalizedQuery),
      competitorScore:
        contextRecipe && isUsefulComparableFood(contextRecipe)
          ? competitorMatchScore(contextRecipe, recipe)
          : 0,
    }))
    .filter((item) => item.recipe.id !== contextRecipe?.id)
    .filter((item) => {
      if (!contextRecipe) return !normalizedQuery || item.rank >= 0;
      if (!normalizedQuery) return item.competitorScore >= 70;
      return item.rank >= 0;
    })
    .sort((left, right) => {
      if (normalizedQuery && left.rank !== right.rank) return right.rank - left.rank;
      if (contextRecipe && left.competitorScore !== right.competitorScore) {
        return right.competitorScore - left.competitorScore;
      }
      return right.score - left.score;
    });

  const suggestions: FoodCompareSuggestion[] = [];

  for (const item of rankedRecipes) {
    const suggestion = mapSuggestion(item.recipe);
    if (!suggestion) continue;

    suggestions.push(suggestion);
    if (suggestions.length >= safeLimit) break;
  }

  return suggestions;
}

const getCachedFoodCompareSuggestions = unstable_cache(
  async (query: string, contextId: string | null, limit: number) =>
    fetchFoodCompareSuggestionsUncached({ query, contextId, limit }),
  ["food-compare-suggestions-v2"],
  { revalidate: 900 },
);

export async function fetchFoodCompareSuggestions({
  query = "",
  contextId,
  limit = 18,
}: {
  query?: string;
  contextId?: string | null;
  limit?: number;
}) {
  return getCachedFoodCompareSuggestions(
    normalize(query),
    contextId ?? null,
    Math.min(Math.max(limit, 1), 30),
  );
}

async function fetchFoodCompareCompetitorsForBase(baseRecipe: CompareRecipe, limit: number) {
  const safeLimit = Math.min(Math.max(limit, 1), 8);
  const candidates = await recipeCompetitorCandidates(baseRecipe, 220);
  const rankedCandidates = candidates
    .filter(isUsefulComparableFood)
    .map((recipe) => ({
      recipe,
      matchScore: competitorMatchScore(baseRecipe, recipe),
      reason: competitorMatchReason(baseRecipe, recipe),
    }))
    .filter((item) => item.matchScore >= 70)
    .sort((left, right) => right.matchScore - left.matchScore);
  const suggestions: Array<FoodCompareSuggestion & { reason: string }> = [];

  for (const item of rankedCandidates) {
    const suggestion = mapSuggestion(item.recipe);
    if (!suggestion) continue;

    suggestions.push({ ...suggestion, reason: item.reason });
    if (suggestions.length >= safeLimit) break;
  }

  return suggestions;
}

async function fetchFoodCompareCompetitorsUncached({
  recipeId,
  limit = 4,
}: {
  recipeId: string;
  limit?: number;
}) {
  const safeLimit = Math.min(Math.max(limit, 1), 8);
  const baseRecipe = await db.recipes.findFirst({
    where: { id: recipeId, AND: [publishedRecipeWhere(), { imageUrl: { not: null } }] },
    select: recipeSelect,
  });

  if (!baseRecipe || !isUsefulComparableFood(baseRecipe) || !mapFood(baseRecipe)) {
    return [];
  }

  return fetchFoodCompareCompetitorsForBase(baseRecipe, safeLimit);
}

const getCachedFoodCompareCompetitors = unstable_cache(
  async (recipeId: string, limit: number) =>
    fetchFoodCompareCompetitorsUncached({ recipeId, limit }),
  ["food-compare-competitors-v2"],
  { revalidate: 1800 },
);

export async function fetchFoodCompareCompetitors({
  recipeId,
  limit = 4,
}: {
  recipeId: string;
  limit?: number;
}) {
  return getCachedFoodCompareCompetitors(recipeId, Math.min(Math.max(limit, 1), 8));
}

async function fetchFoodCompareRecipePromptUncached(recipeId: string) {
  const baseRecipe = await db.recipes.findFirst({
    where: { id: recipeId, AND: [publishedRecipeWhere(), { imageUrl: { not: null } }] },
    select: recipeSelect,
  });

  if (!baseRecipe || !isUsefulComparableFood(baseRecipe)) return null;

  const base = mapSuggestion(baseRecipe);
  if (!base) return null;

  const competitors = await fetchFoodCompareCompetitorsForBase(baseRecipe, 1);
  const competitor = competitors[0];

  if (!competitor) return null;

  return {
    base,
    competitor,
    reason: competitor.reason,
  };
}

const getCachedFoodCompareRecipePrompt = unstable_cache(
  async (recipeId: string) => fetchFoodCompareRecipePromptUncached(recipeId),
  ["food-compare-recipe-prompt-v2"],
  { revalidate: 1800 },
);

export async function fetchFoodCompareRecipePrompt(recipeId: string) {
  return getCachedFoodCompareRecipePrompt(recipeId);
}

async function fetchPopularFoodComparePairsUncached() {
  const preferredPairs = [
    ["poha", "upma"],
    ["roti", "rice"],
    ["paneer", "tofu"],
    ["idli", "dosa"],
    ["samosa", "dhokla"],
    ["chole bhature", "poori"],
    ["veg chowmein", "veg hakka noodles"],
    ["fried rice", "noodles"],
    ["dal rice", "rajma chawal"],
  ];
  const pairs: Array<{
    left: FoodCompareSuggestion;
    right: FoodCompareSuggestion;
    label: string;
  }> = [];
  const seen = new Set<string>();

  for (const [leftQuery, rightQuery] of preferredPairs) {
    const [leftRecipe, rightRecipe] = await Promise.all([
      findComparableRecipe(null, leftQuery),
      findComparableRecipe(null, rightQuery),
    ]);
    const left = leftRecipe ? mapSuggestion(leftRecipe) : null;
    const right = rightRecipe ? mapSuggestion(rightRecipe) : null;

    if (!left || !right || left.id === right.id) continue;

    const key = [left.id, right.id].sort().join(":");
    if (seen.has(key)) continue;

    pairs.push({
      left,
      right,
      label: `${left.label} vs ${right.label}`,
    });
    seen.add(key);

    if (pairs.length >= 6) break;
  }

  return pairs;
}

const getCachedPopularFoodComparePairs = unstable_cache(
  async () => fetchPopularFoodComparePairsUncached(),
  ["food-compare-popular-pairs-v2"],
  { revalidate: 3600 },
);

export async function fetchPopularFoodComparePairs() {
  return getCachedPopularFoodComparePairs();
}

export async function fetchDefaultCompareFoodIds() {
  const preferredPairs = [
    ["poha", "upma"],
    ["paneer", "egg"],
    ["roti", "rice"],
    ["dal", "rice"],
    ["fried rice", "noodles"],
  ];

  for (const [leftQuery, rightQuery] of preferredPairs) {
    const [leftRecipe, rightRecipe] = await Promise.all([
      findComparableRecipe(null, leftQuery),
      findComparableRecipe(null, rightQuery),
    ]);

    if (leftRecipe && rightRecipe && leftRecipe.id !== rightRecipe.id) {
      return [leftRecipe.id, rightRecipe.id];
    }
  }

  const suggestions = await fetchFoodCompareSuggestions({ limit: 12 });
  const picked: FoodCompareSuggestion[] = [];
  const seenCategories = new Set<string>();

  for (const suggestion of suggestions) {
    const category = suggestion.category || suggestion.id;
    if (!seenCategories.has(category)) {
      picked.push(suggestion);
      seenCategories.add(category);
    }
    if (picked.length >= 2) break;
  }

  for (const suggestion of suggestions) {
    if (!picked.some((item) => item.id === suggestion.id)) picked.push(suggestion);
    if (picked.length >= 2) break;
  }

  return picked.slice(0, 2).map((item) => item.id);
}

async function findComparableRecipe(id?: string | null, value?: string | null) {
  if (id) {
    const recipe = await db.recipes.findFirst({
      where: { id, AND: [publishedRecipeWhere(), { imageUrl: { not: null } }] },
      select: recipeSelect,
    });

    if (recipe && isUsefulComparableFood(recipe) && mapFood(recipe)) return recipe;
  }

  const normalizedValue = normalize(value || "");
  if (!normalizedValue) return null;

  const recipes = await recipeCandidates(normalizedValue, 80);

  const rankedRecipes = recipes
    .filter(isUsefulComparableFood)
    .map((recipe) => ({
      recipe,
      rank: queryRank(recipe, normalizedValue),
      score: scoreRecipe(recipe, normalizedValue),
    }))
    .filter((item) => item.rank >= 0)
    .sort((left, right) => right.rank - left.rank || right.score - left.score);

  for (const item of rankedRecipes) {
    if (mapFood(item.recipe)) return item.recipe;
  }

  return null;
}

function goalScore(food: FoodCompareFood, goal: FoodCompareGoalId) {
  const n = food.nutrients;
  const time = food.timeMinutes ?? 90;

  if (goal === "protein") {
    return n.protein * 12 + n.dietaryFiber * 3 - n.calories * 0.025 - n.totalFat * 0.8;
  }

  if (goal === "lighter") {
    return n.protein * 4 + n.dietaryFiber * 7 - n.calories * 0.19 - n.totalFat * 1.8;
  }

  if (goal === "fiber") {
    return n.dietaryFiber * 16 + n.protein * 3 - n.calories * 0.025;
  }

  if (goal === "quick") {
    return n.protein * 2 + n.dietaryFiber * 2 - time * 2.8 - n.calories * 0.01;
  }

  return (
    food.health.score * 4.2 +
    n.protein * 4.8 +
    n.dietaryFiber * 7.6 +
    n.potassium * 0.006 +
    n.calcium * 0.008 +
    n.iron * 0.8 -
    n.calories * 0.075 -
    n.sodium * 0.003 -
    n.totalFat * 0.58
  );
}

function lowerCalorieSide(left: FoodCompareFood, right: FoodCompareFood) {
  return left.nutrients.calories < right.nutrients.calories ? "left" : "right";
}

function foodBySide(side: FoodCompareSide, left: FoodCompareFood, right: FoodCompareFood) {
  return side === "left" ? left : right;
}

function oppositeSide(side: FoodCompareSide): FoodCompareSide {
  return side === "left" ? "right" : "left";
}

function decisiveMetricWinner(
  left: FoodCompareFood,
  right: FoodCompareFood,
  goal: FoodCompareGoalId,
): FoodCompareWinner | null {
  const calorieGap = Math.abs(left.nutrients.calories - right.nutrients.calories);
  const calorieRatio = calorieGap / Math.max(left.nutrients.calories, right.nutrients.calories, 1);

  if (goal === "lighter" && calorieGap >= 90 && calorieRatio >= 0.18) {
    return lowerCalorieSide(left, right);
  }

  if (goal !== "balanced") return null;

  const side = lowerCalorieSide(left, right);
  const lowerCalorieFood = foodBySide(side, left, right);
  const higherCalorieFood = foodBySide(oppositeSide(side), left, right);
  const proteinGap = higherCalorieFood.nutrients.protein - lowerCalorieFood.nutrients.protein;
  const fiberGap = higherCalorieFood.nutrients.dietaryFiber - lowerCalorieFood.nutrients.dietaryFiber;
  const hasComparableProtein =
    lowerCalorieFood.nutrients.protein >= higherCalorieFood.nutrients.protein * 0.82 ||
    proteinGap <= 5;
  const hasComparableFiber =
    lowerCalorieFood.nutrients.dietaryFiber >= higherCalorieFood.nutrients.dietaryFiber * 0.7 ||
    fiberGap <= 3;

  if (calorieGap >= 150 && calorieRatio >= 0.24 && hasComparableProtein && hasComparableFiber) {
    return side;
  }

  return null;
}

function metricsAreCloseEnoughForTie(
  left: FoodCompareFood,
  right: FoodCompareFood,
  goal: FoodCompareGoalId,
) {
  const calorieGap = Math.abs(left.nutrients.calories - right.nutrients.calories);
  const calorieRatio = calorieGap / Math.max(left.nutrients.calories, right.nutrients.calories, 1);
  const proteinGap = Math.abs(left.nutrients.protein - right.nutrients.protein);
  const proteinRatio = proteinGap / Math.max(left.nutrients.protein, right.nutrients.protein, 1);
  const fiberGap = Math.abs(left.nutrients.dietaryFiber - right.nutrients.dietaryFiber);
  const fiberRatio =
    fiberGap / Math.max(left.nutrients.dietaryFiber, right.nutrients.dietaryFiber, 1);
  const timeGap = Math.abs((left.timeMinutes ?? 999) - (right.timeMinutes ?? 999));

  if (goal === "quick") return timeGap <= 8 && calorieRatio <= 0.22;
  if (goal === "protein") return proteinRatio <= 0.12 && calorieRatio <= 0.28;
  if (goal === "fiber") return fiberRatio <= 0.16 && calorieRatio <= 0.28;
  if (goal === "lighter") return calorieGap <= 90 || calorieRatio <= 0.18;

  return calorieGap <= 110 && calorieRatio <= 0.22;
}

function pickWinner(
  leftScore: number,
  rightScore: number,
  left: FoodCompareFood,
  right: FoodCompareFood,
  goal: FoodCompareGoalId,
): FoodCompareWinner {
  const decisiveWinner = decisiveMetricWinner(left, right, goal);
  if (decisiveWinner) return decisiveWinner;

  const difference = leftScore - rightScore;
  const tolerance = Math.max(
    3,
    Math.min(12, (Math.abs(leftScore) + Math.abs(rightScore)) * 0.015),
  );

  if (
    Math.abs(difference) <= tolerance &&
    metricsAreCloseEnoughForTie(left, right, goal)
  ) {
    return "tie";
  }

  return difference > 0 ? "left" : "right";
}

function metricWinner(
  leftValue: number,
  rightValue: number,
  lowerIsBetter: boolean,
): FoodCompareWinner {
  const maxValue = Math.max(Math.abs(leftValue), Math.abs(rightValue), 1);
  if (Math.abs(leftValue - rightValue) / maxValue < 0.06) return "tie";

  if (lowerIsBetter) return leftValue < rightValue ? "left" : "right";
  return leftValue > rightValue ? "left" : "right";
}

function buildMetrics(left: FoodCompareFood, right: FoodCompareFood): FoodCompareMetric[] {
  return metricDefinitions.map((metric) => {
    const leftValue =
      metric.key === "timeMinutes"
        ? (left.timeMinutes ?? 999)
        : left.nutrients[metric.key];
    const rightValue =
      metric.key === "timeMinutes"
        ? (right.timeMinutes ?? 999)
        : right.nutrients[metric.key];

    return {
      ...metric,
      leftValue,
      rightValue,
      winner: metricWinner(leftValue, rightValue, metric.lowerIsBetter),
    };
  });
}

function foodName(side: FoodCompareSide, left: FoodCompareFood, right: FoodCompareFood) {
  return side === "left" ? left.label : right.label;
}

function metricSentence(metric: FoodCompareMetric, left: FoodCompareFood, right: FoodCompareFood) {
  if (metric.winner === "tie") return null;

  const name = foodName(metric.winner, left, right);
  const value = metric.winner === "left" ? metric.leftValue : metric.rightValue;
  const rounded = metric.unit === "kcal" || metric.unit === "mg" || metric.unit === "min"
    ? value.toFixed(0)
    : value.toFixed(1);

  if (metric.lowerIsBetter) {
    return `${name} has lower ${metric.label.toLowerCase()} (${rounded} ${metric.unit}).`;
  }

  return `${name} has more ${metric.label.toLowerCase()} (${rounded} ${metric.unit}).`;
}

function buildKeyPoints(
  metrics: FoodCompareMetric[],
  left: FoodCompareFood,
  right: FoodCompareFood,
  goal: FoodCompareGoalId,
  winner: FoodCompareWinner,
) {
  const priorities: Record<FoodCompareGoalId, FoodCompareMetric["key"][]> = {
    balanced: ["protein", "dietaryFiber", "calories", "sodium"],
    protein: ["protein", "calories", "totalFat"],
    lighter: ["calories", "protein", "dietaryFiber"],
    fiber: ["dietaryFiber", "calories", "protein"],
    quick: ["timeMinutes", "protein", "calories"],
  };
  const prioritySet = new Set(priorities[goal]);
  const points: FoodComparePoint[] = [];

  for (const metric of [...metrics].sort(
    (a, b) => Number(prioritySet.has(b.key)) - Number(prioritySet.has(a.key)),
  )) {
    const body = metricSentence(metric, left, right);
    if (!body || metric.winner === "tie") continue;

    points.push({
      side: metric.winner,
      title: metric.label,
      body,
    });

    if (points.length >= 3) break;
  }

  if (points.length === 0 || winner === "tie") {
    points.unshift({
      side: "both",
      title: "Close choice",
      body: "Both foods are close in this comparison. Pick by taste, portion size, and what else is on the plate.",
    });
  }

  return points.slice(0, 3);
}

function buildCautions(left: FoodCompareFood, right: FoodCompareFood) {
  const cautions: FoodComparePoint[] = [];

  [
    ["left", left],
    ["right", right],
  ].forEach(([side, food]) => {
    const item = food as FoodCompareFood;
    const itemSide = side as FoodCompareSide;

    if (item.nutrients.calories >= 650) {
      cautions.push({
        side: itemSide,
        title: `${item.label}: portion check`,
        body: "This is calorie-heavy, so portion size matters.",
      });
    }

    if (item.nutrients.sodium >= 900) {
      cautions.push({
        side: itemSide,
        title: `${item.label}: sodium is high`,
        body: "If you are watching salt, check the recipe details before choosing.",
      });
    }

    if (item.nutrients.protein < 7 && item.nutrients.dietaryFiber < 3) {
      cautions.push({
        side: itemSide,
        title: `${item.label}: may not fill alone`,
        body: "Pair it with dal, curd, paneer, egg, sprouts, or another filling side.",
      });
    }
  });

  cautions.push({
    side: "both",
    title: "Simple note",
    body: "Use this as a quick comparison and check ingredients before cooking.",
  });

  return cautions.slice(0, 4);
}

function verdictTitle(
  winner: FoodCompareWinner,
  goal: FoodCompareGoalId,
  left: FoodCompareFood,
  right: FoodCompareFood,
) {
  const goalLabel = foodCompareGoals.find((item) => item.id === goal)?.shortLabel ?? "this goal";

  if (winner === "tie") return `${left.label} and ${right.label} are close.`;
  if (goal === "balanced") return `${foodName(winner, left, right)} is the recommended pick.`;

  return `${foodName(winner, left, right)} is better for ${goalLabel}.`;
}

function verdictBody(
  winner: FoodCompareWinner,
  goal: FoodCompareGoalId,
  left: FoodCompareFood,
  right: FoodCompareFood,
) {
  if (winner === "tie") {
    return "The difference is small. Choose based on taste, quantity, and what else you are eating.";
  }

  if (goal === "balanced") {
    return `${foodName(winner, left, right)} fits this comparison better based on nutrition and cooking style.`;
  }

  const goalCopy: Record<FoodCompareGoalId, string> = {
    balanced: "overall nutrition",
    protein: "protein-focused eating",
    lighter: "a lighter meal",
    fiber: "fiber",
    quick: "saving time",
  };

  return `${foodName(winner, left, right)} fits ${goalCopy[goal]} better in this comparison.`;
}

function healthInsight(left: FoodCompareFood, right: FoodCompareFood): FoodComparePoint {
  const difference = left.health.score - right.health.score;
  const side: FoodCompareWinner =
    Math.abs(difference) <= 6 ? "tie" : difference > 0 ? "left" : "right";

  if (side === "tie") {
    const watchouts = [...left.health.watchouts, ...right.health.watchouts];
    return {
      side: "both",
      title: "These are close.",
      body:
        watchouts.length > 0
          ? `Both are similar for regular eating. Main watch-out: ${watchouts[0]}.`
          : "Both can work when portion size and the rest of the meal are balanced.",
    };
  }

  const better = side === "left" ? left : right;
  const other = side === "left" ? right : left;
  const otherWatchout = other.health.watchouts[0];
  const betterPositive = better.health.positives[0];
  const bothOccasional =
    left.health.tone === "occasional" && right.health.tone === "occasional";

  if (bothOccasional) {
    return {
      side: "both",
      title: "Both are better kept occasional.",
      body: `${better.label} may score slightly better in this pair, but both foods are better treated as occasional or portion-controlled picks for regular eating.`,
    };
  }

  return {
    side,
    title: `${better.label} is the better regular pick.`,
    body: otherWatchout
      ? `${better.label} looks easier to fit into regular eating${betterPositive ? ` because it has ${betterPositive}` : ""}. ${other.label} is less ideal for regular eating because ${otherWatchout}.`
      : `${better.label} looks easier to fit into regular eating${betterPositive ? ` because it has ${betterPositive}` : ""}.`,
  };
}

export async function buildFoodComparison({
  leftId,
  rightId,
  leftValue,
  rightValue,
  goal,
}: {
  leftId?: string | null;
  rightId?: string | null;
  leftValue?: string | null;
  rightValue?: string | null;
  goal?: string | null;
  grams?: number | string | null;
}): Promise<FoodCompareResult | null> {
  const safeFoodGoal = safeGoal(goal);
  let resolvedLeftId = leftId;
  let resolvedRightId = rightId;

  if (!resolvedLeftId || !resolvedRightId) {
    const defaults = await fetchDefaultCompareFoodIds();
    resolvedLeftId ||= defaults[0];
    resolvedRightId ||= defaults[1];
  }

  const [leftRecipe, rightRecipe] = await Promise.all([
    findComparableRecipe(resolvedLeftId, leftValue),
    findComparableRecipe(resolvedRightId, rightValue),
  ]);

  if (!leftRecipe || !rightRecipe || leftRecipe.id === rightRecipe.id) return null;

  const left = mapFood(leftRecipe);
  const right = mapFood(rightRecipe);
  if (!left || !right) return null;

  const leftScore = goalScore(left, safeFoodGoal);
  const rightScore = goalScore(right, safeFoodGoal);
  const winner = pickWinner(leftScore, rightScore, left, right, safeFoodGoal);
  const metrics = buildMetrics(left, right);

  return {
    goal: safeFoodGoal,
    left,
    right,
    winner,
    verdictTitle: verdictTitle(winner, safeFoodGoal, left, right),
    verdictBody: verdictBody(winner, safeFoodGoal, left, right),
    healthInsight: healthInsight(left, right),
    keyPoints: buildKeyPoints(metrics, left, right, safeFoodGoal, winner),
    cautions: buildCautions(left, right),
    metrics,
    generatedAt: new Date().toISOString(),
  };
}
