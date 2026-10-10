import { createHash, randomUUID } from "crypto";

import { GetRecipes } from "@/actions/get-recipes";
import { db } from "@/lib/db";
import {
  buildMealRoutineSlot,
  buildOptionalBedtimeSlot,
  mealRoutineKeyFromMealTime,
  sortRoutineSlots,
  type MealPlanRoutineSlot,
} from "@/lib/meal-plan-routine";
import { getFoodPreferenceCategoryIds } from "@/lib/recipe-category-compatibility";
import { monthIsInRange, seasonMonthRange } from "@/lib/season-utils";
import type { RecipeWithCategory } from "@/types/recipe";
import { MealTimes, RecipeSeasonality } from "@prisma/client";
import { formatISO } from "date-fns";

const PLAN_TIMEZONE = "Asia/Kolkata";
const MEAL_PLAN_SCHEMA_VERSION = 3;
const MIN_REVIEWED_RECIPE_POOL = 24;

type UserPlanningContext = {
  userId: string;
  foodPreferenceId: string | null;
  foodPreferenceName?: string;
  foodPreferenceSlug?: string;
  cookingSkillPosition: number | null;
  cookingSkillTitle?: string;
  cuisineIds: string[];
  cuisineNames: string[];
  allergyIds: string[];
  allergyNames: string[];
};

type RecipeMaps = {
  recipeAllergyIds: Map<string, Set<string>>;
};

type RoleKey =
  | "morningHydration"
  | "seasonalDrink"
  | "breakfastMain"
  | "protein"
  | "fruit"
  | "cookedVegetable"
  | "roti"
  | "rice"
  | "grain"
  | "vegetableSalad"
  | "snack";

type SlotRequirement = {
  role: RoleKey;
  label: string;
  recipeTypes: string[];
  optional?: boolean;
  preferCuisine?: boolean;
  maxPerWeek?: number;
  allowedMealKeys?: string[];
  excludedRecipeTypes?: string[];
  onlyIfMealEmpty?: boolean;
  skipIfRoleSelected?: RoleKey[];
  reject?: (recipe: RecipeWithCategory) => boolean;
  match?: (recipe: RecipeWithCategory) => boolean;
  fallbackMatch?: (recipe: RecipeWithCategory) => boolean;
};

type CandidateLayer = {
  key: string;
  allowCuisineFallback: boolean;
  allowDifficultyFallback: boolean;
  allowUnreviewedSeason: boolean;
  allowWeeklyRepeat: boolean;
  allowRoleFallback: boolean;
};

export type MealPlanSelection = {
  recipeId: string;
  role: RoleKey;
  label: string;
  recipeTypes: string[];
  fallbackLevel: string;
  score: number;
};

export type MealPlanDiagnostics = {
  season: string;
  fallbacksUsed: string[];
  emptySlots: string[];
};

export type PlannedMealDay = {
  date: Date;
  dateKey: string;
  season: string;
  mealsByTime: Record<string, RecipeWithCategory[]>;
  selectionsByTime: Record<string, MealPlanSelection[]>;
  routineSlots: MealPlanRoutineSlot[];
  diagnostics: MealPlanDiagnostics;
};

export type WeeklyMealPlan = {
  version: number;
  generationId: string;
  timezone: string;
  planStartDate: string;
  planEndDate: string;
  generatedAt: string;
  preferencesSnapshot: {
    foodStyle?: string;
    cookingComfort?: string;
    cuisines: string[];
    exclusions: string[];
  };
  days: PlannedMealDay[];
};

export type StoredMealPlanRecipe = {
  recipeId: string;
  role?: RoleKey;
  label?: string;
  recipeTypes?: string[];
  score?: number;
  fallbackLevel?: string;
};

export type StoredMealPlanDay = {
  version: number;
  userId: string;
  generationId: string;
  timezone: string;
  date: string;
  planStartDate: string;
  planEndDate: string;
  season: string;
  preferencesSnapshot: WeeklyMealPlan["preferencesSnapshot"];
  mealsByTime: Record<string, StoredMealPlanRecipe[]>;
  routineSlots: MealPlanRoutineSlot[];
  diagnostics: MealPlanDiagnostics;
  generatedAt: string;
};

const NORMALIZED_RECIPE_TYPE_ALIASES: Record<RoleKey, string[]> = {
  morningHydration: ["morninghydration", "hydration", "infusedwater", "water"],
  seasonalDrink: ["beveragesmoothie", "beverage", "smoothie", "drink", "juice"],
  breakfastMain: ["meal", "main", "breakfast"],
  protein: ["protein", "proteinrich"],
  fruit: ["fruitsalad", "fruit", "fruitbowl"],
  cookedVegetable: ["cookedvegetable", "vegetable", "sabzi", "subzi"],
  roti: ["grains", "grain", "bread", "flatbread"],
  rice: ["grains", "grain", "rice"],
  grain: ["grains", "grain"],
  vegetableSalad: ["vegetablesalad", "salad"],
  snack: ["snacks", "snack"],
};

const MEAL_SLOT_RULES: Record<string, SlotRequirement[]> = {
  "early-morning": [
    {
      role: "morningHydration",
      label: "Morning hydration",
      recipeTypes: NORMALIZED_RECIPE_TYPE_ALIASES.morningHydration,
      preferCuisine: false,
      match: isMorningHydrationRecipe,
      fallbackMatch: isMorningHydrationRecipe,
    },
  ],
  breakfast: [
    {
      role: "breakfastMain",
      label: "Breakfast main",
      recipeTypes: NORMALIZED_RECIPE_TYPE_ALIASES.breakfastMain,
      excludedRecipeTypes: [
        ...NORMALIZED_RECIPE_TYPE_ALIASES.seasonalDrink,
        ...NORMALIZED_RECIPE_TYPE_ALIASES.fruit,
        ...NORMALIZED_RECIPE_TYPE_ALIASES.vegetableSalad,
        ...NORMALIZED_RECIPE_TYPE_ALIASES.snack,
      ],
      reject: isDrinkLikeRecipe,
      fallbackMatch: isSubstantialMeal,
    },
    {
      role: "protein",
      label: "Protein side",
      recipeTypes: NORMALIZED_RECIPE_TYPE_ALIASES.protein,
      optional: true,
    },
    {
      role: "fruit",
      label: "Breakfast fruit",
      recipeTypes: NORMALIZED_RECIPE_TYPE_ALIASES.fruit,
      optional: true,
      preferCuisine: false,
      allowedMealKeys: ["mid-morning", "breakfast"],
    },
  ],
  "mid-morning": [
    {
      role: "fruit",
      label: "Fruit or light bite",
      recipeTypes: NORMALIZED_RECIPE_TYPE_ALIASES.fruit,
      preferCuisine: false,
    },
    {
      role: "seasonalDrink",
      label: "Light beverage",
      recipeTypes: NORMALIZED_RECIPE_TYPE_ALIASES.seasonalDrink,
      optional: true,
      preferCuisine: false,
      maxPerWeek: 4,
      onlyIfMealEmpty: true,
      match: isDrinkLikeRecipe,
      fallbackMatch: isDrinkLikeRecipe,
    },
  ],
  lunch: [
    {
      role: "cookedVegetable",
      label: "Cooked vegetable",
      recipeTypes: NORMALIZED_RECIPE_TYPE_ALIASES.cookedVegetable,
    },
    {
      role: "protein",
      label: "Protein",
      recipeTypes: NORMALIZED_RECIPE_TYPE_ALIASES.protein,
    },
    {
      role: "roti",
      label: "Roti or chapati",
      recipeTypes: NORMALIZED_RECIPE_TYPE_ALIASES.roti,
      match: isRotiLikeGrain,
      fallbackMatch: isNonRiceGrain,
    },
    {
      role: "rice",
      label: "Rice add-on",
      recipeTypes: NORMALIZED_RECIPE_TYPE_ALIASES.rice,
      optional: true,
      maxPerWeek: 5,
      match: isRiceLikeGrain,
    },
    {
      role: "vegetableSalad",
      label: "Salad",
      recipeTypes: NORMALIZED_RECIPE_TYPE_ALIASES.vegetableSalad,
      optional: true,
      skipIfRoleSelected: ["rice"],
    },
  ],
  evening: [
    {
      role: "snack",
      label: "Evening snack",
      recipeTypes: NORMALIZED_RECIPE_TYPE_ALIASES.snack,
      optional: true,
    },
    {
      role: "seasonalDrink",
      label: "Evening drink",
      recipeTypes: NORMALIZED_RECIPE_TYPE_ALIASES.seasonalDrink,
      optional: true,
      preferCuisine: false,
      maxPerWeek: 4,
      match: isDrinkLikeRecipe,
      fallbackMatch: isDrinkLikeRecipe,
    },
  ],
  dinner: [
    {
      role: "cookedVegetable",
      label: "Light cooked vegetable",
      recipeTypes: NORMALIZED_RECIPE_TYPE_ALIASES.cookedVegetable,
    },
    {
      role: "protein",
      label: "Protein",
      recipeTypes: NORMALIZED_RECIPE_TYPE_ALIASES.protein,
    },
    {
      role: "roti",
      label: "Roti or chapati",
      recipeTypes: NORMALIZED_RECIPE_TYPE_ALIASES.roti,
      match: isRotiLikeGrain,
      fallbackMatch: isNonRiceGrain,
    },
    {
      role: "vegetableSalad",
      label: "Salad",
      recipeTypes: NORMALIZED_RECIPE_TYPE_ALIASES.vegetableSalad,
      optional: true,
    },
  ],
};

const FALLBACK_LAYERS: CandidateLayer[] = [
  {
    key: "ideal",
    allowCuisineFallback: false,
    allowDifficultyFallback: false,
    allowUnreviewedSeason: false,
    allowWeeklyRepeat: false,
    allowRoleFallback: false,
  },
  {
    key: "cuisine-fallback",
    allowCuisineFallback: true,
    allowDifficultyFallback: false,
    allowUnreviewedSeason: false,
    allowWeeklyRepeat: false,
    allowRoleFallback: false,
  },
  {
    key: "difficulty-fallback",
    allowCuisineFallback: true,
    allowDifficultyFallback: true,
    allowUnreviewedSeason: false,
    allowWeeklyRepeat: false,
    allowRoleFallback: false,
  },
  {
    key: "season-unreviewed-fallback",
    allowCuisineFallback: true,
    allowDifficultyFallback: true,
    allowUnreviewedSeason: true,
    allowWeeklyRepeat: false,
    allowRoleFallback: false,
  },
  {
    key: "role-fallback",
    allowCuisineFallback: true,
    allowDifficultyFallback: true,
    allowUnreviewedSeason: true,
    allowWeeklyRepeat: false,
    allowRoleFallback: true,
  },
  {
    key: "repeat-fallback",
    allowCuisineFallback: true,
    allowDifficultyFallback: true,
    allowUnreviewedSeason: true,
    allowWeeklyRepeat: true,
    allowRoleFallback: true,
  },
];

function normalize(value: string | null | undefined) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function dateKey(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return formatISO(normalized, { representation: "date" });
}

function dateSeed(date: Date) {
  return dateKey(date);
}

function hashNumber(input: string) {
  const hash = createHash("sha256").update(input).digest("hex").slice(0, 12);
  return parseInt(hash, 16) / 0xffffffffffff;
}

function recipeTypeKeys(recipe: RecipeWithCategory) {
  return new Set(
    (recipe.recipeRecipeType ?? []).flatMap(({ recipeType }) => [
      normalize(recipeType.title),
      normalize(recipeType.slug),
    ]),
  );
}

function recipeText(recipe: RecipeWithCategory) {
  return [
    recipe.title,
    recipe.slug,
    recipe.RecipeCategories?.name,
    recipe.RecipeCategories?.slug,
    ...(recipe.recipeRecipeType ?? []).flatMap(({ recipeType }) => [
      recipeType.title,
      recipeType.slug,
    ]),
    ...(recipe.recipeIngredients ?? []).map(({ ingredient }) => ingredient.name),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function hasRecipeType(recipe: RecipeWithCategory, aliases: string[]) {
  const keys = recipeTypeKeys(recipe);
  return aliases.some((alias) => keys.has(normalize(alias)));
}

function isGrain(recipe: RecipeWithCategory) {
  return hasRecipeType(recipe, NORMALIZED_RECIPE_TYPE_ALIASES.grain);
}

function isDrinkLikeRecipe(recipe: RecipeWithCategory) {
  if (hasRecipeType(recipe, NORMALIZED_RECIPE_TYPE_ALIASES.seasonalDrink)) {
    return true;
  }

  const text = recipeText(recipe);
  return /\b(juice|shake|smoothie|drink|beverage|lassi|chaas|buttermilk|sherbet|sharbat|tea|chai|coffee|water)\b/.test(
    text,
  );
}

function isMorningHydrationRecipe(recipe: RecipeWithCategory) {
  if (isJuiceOrSmoothieRecipe(recipe)) return false;
  if (hasRecipeType(recipe, NORMALIZED_RECIPE_TYPE_ALIASES.morningHydration)) {
    return true;
  }

  const text = recipeText(recipe);
  return /\b(water|jeera|cumin|saunf|fennel|ajwain|tulsi|ginger|coriander|cinnamon|mint|cucumber|coconut water|infused)\b/.test(
    text,
  );
}

function isJuiceOrSmoothieRecipe(recipe: RecipeWithCategory) {
  const text = recipeText(recipe);
  return /\b(juice|shake|smoothie|milkshake|frappe)\b/.test(text);
}

function isSubstantialMeal(recipe: RecipeWithCategory) {
  if (isDrinkLikeRecipe(recipe)) return false;
  if (hasRecipeType(recipe, NORMALIZED_RECIPE_TYPE_ALIASES.fruit)) return false;
  if (hasRecipeType(recipe, NORMALIZED_RECIPE_TYPE_ALIASES.vegetableSalad)) return false;
  if (hasRecipeType(recipe, NORMALIZED_RECIPE_TYPE_ALIASES.snack)) return false;

  return true;
}

function isRotiLikeGrain(recipe: RecipeWithCategory) {
  if (!isGrain(recipe)) return false;
  const text = recipeText(recipe);
  return /\b(roti|chapati|phulka|fulka|flatbread|paratha|thepla|naan|kulcha|bajra|jowar|makki)\b/.test(
    text,
  );
}

function isRiceLikeGrain(recipe: RecipeWithCategory) {
  if (!isGrain(recipe)) return false;
  const text = recipeText(recipe);
  return /\b(rice|chawal|pulao|pilaf|khichdi|biryani)\b/.test(text);
}

function isNonRiceGrain(recipe: RecipeWithCategory) {
  return isGrain(recipe) && !isRiceLikeGrain(recipe);
}

function matchingSeasonLabel(date: Date) {
  const month = date.getMonth() + 1;

  if (monthIsInRange(month, { startMonth: 3, endMonth: 6 })) return "Summer";
  if (monthIsInRange(month, { startMonth: 7, endMonth: 10 })) return "Monsoon";
  return "Winter";
}

function recipeSeasonMatchesDate(recipe: RecipeWithCategory, date: Date) {
  if (recipe.seasonality === RecipeSeasonality.ALL_YEAR) {
    return { eligible: true, score: 8 };
  }

  if (recipe.seasonality === RecipeSeasonality.UNREVIEWED) {
    return { eligible: true, score: -14, unreviewed: true };
  }

  const month = date.getMonth() + 1;
  const taggedSeasons = [
    ...(recipe.recipeSeasonTags?.map((tag) => tag.season).filter(Boolean) ?? []),
    recipe.recipeSeasons,
  ].filter(Boolean);
  const matches = taggedSeasons.some((season) =>
    monthIsInRange(month, seasonMonthRange(season?.title ?? "")),
  );

  return { eligible: matches, score: matches ? 22 : -100 };
}

function recipeMatchesMealTime(recipe: RecipeWithCategory, mealTimeId: string) {
  return recipe.recipeMealTime?.some((mealTime) => mealTime.mealTimeId === mealTimeId);
}

function recipeMatchesAnyMealTime(recipe: RecipeWithCategory, mealTimeIds: string[]) {
  return recipe.recipeMealTime?.some((mealTime) =>
    mealTimeIds.includes(mealTime.mealTimeId),
  );
}

function recipeMatchesCuisine(recipe: RecipeWithCategory, cuisineIds: string[]) {
  if (cuisineIds.length === 0) return true;
  return recipe.recipeCuisine?.some((cuisine) => cuisineIds.includes(cuisine.cuisineId)) ?? false;
}

function recipeDifficultyAllowed(
  recipe: RecipeWithCategory,
  userSkillPosition: number | null,
) {
  const recipePosition = recipe.recipeDifficulty?.position ?? null;
  if (!recipePosition || !userSkillPosition) return true;
  return recipePosition <= userSkillPosition;
}

function cookingTimeScore(recipe: RecipeWithCategory, mealKey: string) {
  const totalTime = recipe.recipeCookingTime?.totalTime ?? null;
  if (!totalTime) return 0;

  if (["breakfast", "early-morning", "mid-morning", "evening"].includes(mealKey)) {
    if (totalTime <= 15) return 10;
    if (totalTime <= 30) return 5;
    return -4;
  }

  if (mealKey === "dinner") {
    if (totalTime <= 35) return 8;
    if (totalTime <= 50) return 3;
    return -5;
  }

  return totalTime <= 50 ? 4 : 0;
}

async function loadUserPlanningContext(userId: string): Promise<UserPlanningContext> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      foodPreference: true,
      cookingSkill: true,
      userCuisines: {
        include: { cuisine: true },
      },
      UserAllrgies: {
        include: { allergy: true },
      },
    },
  });

  if (!user) {
    throw new Error(`User with ID ${userId} not found.`);
  }

  return {
    userId,
    foodPreferenceId: user.foodPreferenceId,
    foodPreferenceName: user.foodPreference?.name,
    foodPreferenceSlug: user.foodPreference?.slug,
    cookingSkillPosition: user.cookingSkill?.position ?? null,
    cookingSkillTitle: user.cookingSkill?.title,
    cuisineIds: user.userCuisines.map(({ cuisineId }) => cuisineId),
    cuisineNames: user.userCuisines
      .sort(
        (first, second) =>
          (first.cuisine.position ?? Number.MAX_SAFE_INTEGER) -
          (second.cuisine.position ?? Number.MAX_SAFE_INTEGER),
      )
      .map(({ cuisine }) => cuisine.title),
    allergyIds: user.UserAllrgies.map(({ allergyId }) => allergyId),
    allergyNames: user.UserAllrgies
      .sort(
        (first, second) =>
          (first.allergy.position ?? Number.MAX_SAFE_INTEGER) -
          (second.allergy.position ?? Number.MAX_SAFE_INTEGER),
      )
      .map(({ allergy }) => allergy.title),
  };
}

async function loadRecipeMaps(): Promise<RecipeMaps> {
  const recipeAllergies = await db.recipeAllergies.findMany({
    select: { recipeId: true, allergyId: true },
  });

  return {
    recipeAllergyIds: recipeAllergies.reduce((map, allergy) => {
      if (!map.has(allergy.recipeId)) map.set(allergy.recipeId, new Set());
      map.get(allergy.recipeId)?.add(allergy.allergyId);
      return map;
    }, new Map<string, Set<string>>()),
  };
}

async function loadPreferenceFilteredRecipes(
  user: UserPlanningContext,
): Promise<RecipeWithCategory[]> {
  const [allRecipes, recipeCategories, recipeMaps] = await Promise.all([
    GetRecipes({}),
    db.recipeCategories.findMany({ where: { isPublished: true } }),
    loadRecipeMaps(),
  ]);
  const categoryIdsBySlug = recipeCategories.reduce(
    (map, category) => {
      map[category.slug] = category.id;
      if (category.slug === "egg") map.eggetarian = category.id;
      if (category.slug === "non-veg") map["non veg"] = category.id;
      return map;
    },
    {} as Record<string, string>,
  );
  const allowedCategoryIds = user.foodPreferenceSlug
    ? getFoodPreferenceCategoryIds(user.foodPreferenceSlug, categoryIdsBySlug)
    : [];
  const userAllergyIds = new Set(user.allergyIds);

  const preferenceFilteredRecipes = allRecipes.filter((recipe) => {
    const recipeCategoryId = recipe.recipeCategoriesId;
    const matchesCategoryPreference =
      typeof recipeCategoryId === "string" && allowedCategoryIds.includes(recipeCategoryId);
    const matchesStandaloneHydration = isMorningHydrationRecipe(recipe);
    if (!matchesCategoryPreference && !matchesStandaloneHydration) return false;

    const recipeAllergyIds = recipeMaps.recipeAllergyIds.get(recipe.id) ?? new Set();
    for (const allergyId of recipeAllergyIds) {
      if (userAllergyIds.has(allergyId)) return false;
    }

    return !recipe.recipeRecipeType?.some(
      ({ recipeType }) => recipeType.slug === "desserts",
    );
  });

  const reviewedDifficultyRecipes = preferenceFilteredRecipes.filter((recipe) => {
    if (!recipe.recipeDifficulty?.position) return false;
    return recipeDifficultyAllowed(recipe, user.cookingSkillPosition);
  });
  const difficultyFallbackRecipes = preferenceFilteredRecipes.filter(
    (recipe) => !recipe.recipeDifficulty?.position,
  );

  return reviewedDifficultyRecipes.length >= MIN_REVIEWED_RECIPE_POOL
    ? reviewedDifficultyRecipes
    : [...reviewedDifficultyRecipes, ...difficultyFallbackRecipes];
}

function shouldAttemptSlot(
  requirement: SlotRequirement,
  dateIndex: number,
  roleCounts: Map<RoleKey, number>,
) {
  if (!requirement.maxPerWeek) return true;
  const usedCount = roleCounts.get(requirement.role) ?? 0;
  if (usedCount >= requirement.maxPerWeek) return false;

  if (requirement.role === "rice") {
    return dateIndex % 2 === 0 || usedCount < 3;
  }

  return true;
}

function roleMatches(
  recipe: RecipeWithCategory,
  requirement: SlotRequirement,
  allowRoleFallback: boolean,
) {
  if (requirement.reject?.(recipe)) return false;
  if (
    requirement.excludedRecipeTypes?.some((recipeType) =>
      hasRecipeType(recipe, [recipeType]),
    )
  ) {
    return false;
  }

  const matchesType = hasRecipeType(recipe, requirement.recipeTypes);
  if (!matchesType) {
    return Boolean(allowRoleFallback && requirement.fallbackMatch?.(recipe));
  }

  if (requirement.match?.(recipe)) return true;
  if (!requirement.match) return true;

  return Boolean(allowRoleFallback && requirement.fallbackMatch?.(recipe));
}

function scoreRecipe(params: {
  recipe: RecipeWithCategory;
  requirement: SlotRequirement;
  user: UserPlanningContext;
  date: Date;
  mealKey: string;
  weeklyUsage: Map<string, number>;
  seed: string;
  layer: CandidateLayer;
}) {
  const {
    recipe,
    requirement,
    user,
    date,
    mealKey,
    weeklyUsage,
    seed,
    layer,
  } = params;
  const season = recipeSeasonMatchesDate(recipe, date);
  const matchesCuisine = recipeMatchesCuisine(recipe, user.cuisineIds);
  const usageCount = weeklyUsage.get(recipe.id) ?? 0;
  const difficultyAllowed = recipeDifficultyAllowed(recipe, user.cookingSkillPosition);
  const noise = hashNumber(`${seed}:${requirement.role}:${recipe.id}`) * 8;

  let score = 40 + noise + season.score + cookingTimeScore(recipe, mealKey);

  if (matchesCuisine) score += requirement.preferCuisine === false ? 4 : 18;
  if (!matchesCuisine && layer.allowCuisineFallback) score -= 12;

  if (difficultyAllowed) score += 8;
  if (!difficultyAllowed && layer.allowDifficultyFallback) score -= 18;

  if (requirement.match?.(recipe)) score += 25;
  if (requirement.fallbackMatch?.(recipe) && !requirement.match?.(recipe)) {
    score -= 14;
  }

  score -= usageCount * 35;

  return score;
}

function findBestRecipe(params: {
  recipes: RecipeWithCategory[];
  requirement: SlotRequirement;
  mealTime: MealTimes;
  mealKey: string;
  user: UserPlanningContext;
  date: Date;
  dateIndex: number;
  usedToday: Set<string>;
  blockedForMeal: Set<string>;
  weeklyUsage: Map<string, number>;
  permittedMealTimeIds: string[];
}) {
  const {
    recipes,
    requirement,
    mealTime,
    mealKey,
    user,
    date,
    dateIndex,
    usedToday,
    blockedForMeal,
    weeklyUsage,
    permittedMealTimeIds,
  } = params;

  for (const layer of FALLBACK_LAYERS) {
    const candidates = recipes.filter((recipe) => {
      if (usedToday.has(recipe.id) || blockedForMeal.has(recipe.id)) return false;
      if (!layer.allowWeeklyRepeat && weeklyUsage.has(recipe.id)) return false;
      if (
        !recipeMatchesMealTime(recipe, mealTime.id) &&
        !recipeMatchesAnyMealTime(recipe, permittedMealTimeIds)
      ) {
        return false;
      }
      if (!roleMatches(recipe, requirement, layer.allowRoleFallback)) return false;

      const season = recipeSeasonMatchesDate(recipe, date);
      if (!season.eligible) return false;
      if (season.unreviewed && !layer.allowUnreviewedSeason) return false;

      if (
        requirement.preferCuisine !== false &&
        !layer.allowCuisineFallback &&
        !recipeMatchesCuisine(recipe, user.cuisineIds)
      ) {
        return false;
      }

      if (
        !layer.allowDifficultyFallback &&
        !recipeDifficultyAllowed(recipe, user.cookingSkillPosition)
      ) {
        return false;
      }

      return true;
    });

    if (candidates.length > 0) {
      const seed = `${user.userId}:${dateSeed(date)}:${dateIndex}:${mealKey}`;
      const [selected] = candidates
        .map((recipe) => ({
          recipe,
          score: scoreRecipe({
            recipe,
            requirement,
            user,
            date,
            mealKey,
            weeklyUsage,
            seed,
            layer,
          }),
        }))
        .sort((first, second) => second.score - first.score);

      return {
        recipe: selected.recipe,
        score: Math.round(selected.score * 100) / 100,
        fallbackLevel: layer.key,
      };
    }
  }

  return null;
}

function selectionFromRecipe(
  recipe: RecipeWithCategory,
  requirement: SlotRequirement,
  score: number,
  fallbackLevel: string,
): MealPlanSelection {
  return {
    recipeId: recipe.id,
    role: requirement.role,
    label: requirement.label,
    recipeTypes:
      recipe.recipeRecipeType?.map(({ recipeType }) => recipeType.title) ?? [],
    score,
    fallbackLevel,
  };
}

export async function generateWeeklyMealPlan(
  userId: string,
  dates: Date[],
): Promise<WeeklyMealPlan> {
  const [user, mealTimes] = await Promise.all([
    loadUserPlanningContext(userId),
    db.mealTimes.findMany({
      where: { isPublished: true },
      orderBy: [{ position: "asc" }, { title: "asc" }],
    }),
  ]);
  const recipes = await loadPreferenceFilteredRecipes(user);
  const generationId = randomUUID();
  const weeklyUsage = new Map<string, number>();
  let roleCounts = new Map<RoleKey, number>();
  const mealTimeIdsByKey = mealTimes.reduce((map, mealTime) => {
    const key = mealRoutineKeyFromMealTime(mealTime);
    map.set(key, [...(map.get(key) ?? []), mealTime.id]);
    return map;
  }, new Map<string, string[]>());

  const days: PlannedMealDay[] = [];

  for (const [dateIndex, date] of dates.entries()) {
    if (dateIndex % 7 === 0) {
      roleCounts = new Map<RoleKey, number>();
    }

    const mealsByTime: Record<string, RecipeWithCategory[]> = {};
    const selectionsByTime: Record<string, MealPlanSelection[]> = {};
    const routineSlots: MealPlanRoutineSlot[] = [];
    const usedToday = new Set<string>();
    const fallbacksUsed = new Set<string>();
    const emptySlots: string[] = [];
    const season = matchingSeasonLabel(date);

    for (const mealTime of mealTimes) {
      const key = mealRoutineKeyFromMealTime(mealTime);
      const requirements = MEAL_SLOT_RULES[key] ?? [];
      const mealRecipes: RecipeWithCategory[] = [];
      const mealSelections: MealPlanSelection[] = [];
      const blockedForMeal = new Set<string>();
      const selectedRoles = new Set<RoleKey>();

      if (key === "dinner") {
        for (const recipe of mealsByTime.lunch ?? []) {
          blockedForMeal.add(recipe.id);
        }
      }

      for (const requirement of requirements) {
        if (requirement.onlyIfMealEmpty && mealRecipes.length > 0) continue;
        if (
          requirement.skipIfRoleSelected?.some((role) => selectedRoles.has(role))
        ) {
          continue;
        }
        if (!shouldAttemptSlot(requirement, dateIndex, roleCounts)) continue;
        const permittedMealTimeIds = (
          requirement.allowedMealKeys ?? [key]
        ).flatMap((mealKey) => mealTimeIdsByKey.get(mealKey) ?? []);

        const result = findBestRecipe({
          recipes,
          requirement,
          mealTime,
          mealKey: key,
          user,
          date,
          dateIndex,
          usedToday,
          blockedForMeal,
          weeklyUsage,
          permittedMealTimeIds,
        });

        if (!result) {
          if (!requirement.optional) {
            emptySlots.push(`${mealTime.title}: ${requirement.label}`);
          }
          continue;
        }

        mealRecipes.push(result.recipe);
        mealSelections.push(
          selectionFromRecipe(
            result.recipe,
            requirement,
            result.score,
            result.fallbackLevel,
          ),
        );
        usedToday.add(result.recipe.id);
        weeklyUsage.set(result.recipe.id, (weeklyUsage.get(result.recipe.id) ?? 0) + 1);
        roleCounts.set(requirement.role, (roleCounts.get(requirement.role) ?? 0) + 1);
        selectedRoles.add(requirement.role);

        if (result.fallbackLevel !== "ideal") {
          fallbacksUsed.add(`${mealTime.title}: ${requirement.label} used ${result.fallbackLevel}`);
        }
      }

      mealsByTime[mealTime.slug] = mealRecipes;
      selectionsByTime[mealTime.slug] = mealSelections;
      routineSlots.push(
        buildMealRoutineSlot({
          mealKey: key,
          slug: mealTime.slug,
          title: mealTime.title,
          recipes: mealRecipes,
          selections: mealSelections,
          context: {
            foodPreferenceName: user.foodPreferenceName,
            foodPreferenceSlug: user.foodPreferenceSlug,
            allergyNames: user.allergyNames,
            season,
          },
        }),
      );
    }

    if (!routineSlots.some((slot) => slot.key === "bedtime")) {
      routineSlots.push(
        buildOptionalBedtimeSlot({
          foodPreferenceName: user.foodPreferenceName,
          foodPreferenceSlug: user.foodPreferenceSlug,
          allergyNames: user.allergyNames,
          season,
        }),
      );
    }

    days.push({
      date,
      dateKey: dateKey(date),
      season,
      mealsByTime,
      selectionsByTime,
      routineSlots: sortRoutineSlots(routineSlots),
      diagnostics: {
        season,
        fallbacksUsed: [...fallbacksUsed],
        emptySlots,
      },
    });
  }

  return {
    version: MEAL_PLAN_SCHEMA_VERSION,
    generationId,
    timezone: PLAN_TIMEZONE,
    planStartDate: dateKey(dates[0]),
    planEndDate: dateKey(dates[dates.length - 1]),
    generatedAt: new Date().toISOString(),
    preferencesSnapshot: {
      foodStyle: user.foodPreferenceName,
      cookingComfort: user.cookingSkillTitle,
      cuisines: user.cuisineNames,
      exclusions: user.allergyNames,
    },
    days,
  };
}

export function toStoredMealPlanDay(
  userId: string,
  weeklyPlan: WeeklyMealPlan,
  day: PlannedMealDay,
): StoredMealPlanDay {
  return {
    version: weeklyPlan.version,
    userId,
    generationId: weeklyPlan.generationId,
    timezone: weeklyPlan.timezone,
    date: day.dateKey,
    planStartDate: weeklyPlan.planStartDate,
    planEndDate: weeklyPlan.planEndDate,
    season: day.season,
    preferencesSnapshot: weeklyPlan.preferencesSnapshot,
    mealsByTime: Object.fromEntries(
      Object.entries(day.selectionsByTime).map(([mealTime, selections]) => [
        mealTime,
        selections.map((selection) => ({
          recipeId: selection.recipeId,
          role: selection.role,
          label: selection.label,
          recipeTypes: selection.recipeTypes,
          score: selection.score,
          fallbackLevel: selection.fallbackLevel,
        })),
      ]),
    ),
    routineSlots: day.routineSlots,
    diagnostics: day.diagnostics,
    generatedAt: weeklyPlan.generatedAt,
  };
}

export function toStoredWeeklyManifest(
  userId: string,
  weeklyPlan: WeeklyMealPlan,
) {
  return {
    version: weeklyPlan.version,
    userId,
    generationId: weeklyPlan.generationId,
    timezone: weeklyPlan.timezone,
    planStartDate: weeklyPlan.planStartDate,
    planEndDate: weeklyPlan.planEndDate,
    generatedAt: weeklyPlan.generatedAt,
    preferencesSnapshot: weeklyPlan.preferencesSnapshot,
    days: weeklyPlan.days.map((day) => ({
      date: day.dateKey,
      season: day.season,
      routineSlots: day.routineSlots,
      s3Key: `usersMealPlans/${userId}/${day.dateKey}/diet.json`,
      diagnostics: day.diagnostics,
    })),
  };
}
