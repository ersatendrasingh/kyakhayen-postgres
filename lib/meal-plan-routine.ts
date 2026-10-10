import type { RecipeWithCategory } from "@/types/recipe";

export type MealRoutineKey =
  | "early-morning"
  | "breakfast"
  | "mid-morning"
  | "lunch"
  | "evening"
  | "dinner"
  | "bedtime";

export type MealPlanRoutineSlot = {
  key: MealRoutineKey | string;
  slug: string;
  title: string;
  timeRange: string;
  guidance: string;
  optional?: boolean;
};

type RoutineContext = {
  foodPreferenceName?: string | null;
  foodPreferenceSlug?: string | null;
  allergyNames?: string[];
  season?: string;
};

type RoutineSelection = {
  role?: string;
};

const MEAL_ROUTINE_TEMPLATES: Record<MealRoutineKey, {
  title: string;
  timeRange: string;
  optional?: boolean;
}> = {
  "early-morning": {
    title: "Early Morning",
    timeRange: "6:00-6:30 AM",
  },
  breakfast: {
    title: "Breakfast",
    timeRange: "8:00-8:30 AM",
  },
  "mid-morning": {
    title: "Mid Morning",
    timeRange: "11:00 AM",
  },
  lunch: {
    title: "Lunch",
    timeRange: "1:30 PM",
  },
  evening: {
    title: "Evening Snack",
    timeRange: "5:00 PM",
  },
  dinner: {
    title: "Dinner",
    timeRange: "8:00 PM",
  },
  bedtime: {
    title: "Bedtime",
    timeRange: "10:00 PM",
    optional: true,
  },
};

export const MEAL_ROUTINE_ORDER: MealRoutineKey[] = [
  "early-morning",
  "breakfast",
  "mid-morning",
  "lunch",
  "evening",
  "dinner",
  "bedtime",
];

const orderIndex = (key: string) => {
  const index = MEAL_ROUTINE_ORDER.indexOf(key as MealRoutineKey);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};

const normalize = (value: string | null | undefined) =>
  (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");

const cleanParts = (parts: Array<string | null | undefined>) =>
  parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));

const contextText = (context: RoutineContext) =>
  [
    context.foodPreferenceName,
    context.foodPreferenceSlug,
    ...(context.allergyNames ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const hasNutRestriction = (context: RoutineContext) =>
  /\b(nut|nuts|almond|badam|walnut|akhrot|peanut|groundnut)\b/.test(
    contextText(context),
  );

const hasDairyRestriction = (context: RoutineContext) =>
  /\b(vegan|dairy|milk|lactose|paneer|curd|yogurt|yoghurt)\b/.test(
    contextText(context),
  );

const hasNonVegPreference = (context: RoutineContext) =>
  /\b(non\s*veg|non-veg|chicken|fish|egg|eggetarian|pescetarian)\b/.test(
    contextText(context),
  );

function recipeByRole(
  recipes: RecipeWithCategory[],
  selections: RoutineSelection[],
  role: string,
) {
  const index = selections.findIndex((selection) => selection.role === role);
  return index === -1 ? null : recipes[index]?.title ?? null;
}

function seasonalHydration(context: RoutineContext) {
  if (context.season === "Summer") {
    return hasDairyRestriction(context)
      ? "a cooling unsweetened drink occasionally"
      : "buttermilk or coconut water occasionally";
  }

  if (context.season === "Monsoon") {
    return "a warm tulsi or ginger-style drink when needed";
  }

  return "a warm light drink when needed";
}

function proteinFallback(context: RoutineContext) {
  if (hasNonVegPreference(context)) return "egg, chicken or another protein";
  if (hasDairyRestriction(context)) return "tofu, sprouts or dal";
  return "dal, paneer or another protein";
}

function breakfastProteinFallback(context: RoutineContext) {
  if (hasNonVegPreference(context)) return "eggs or another protein";
  if (hasDairyRestriction(context)) return "tofu or sprouts";
  return "paneer or another protein";
}

function earlyMorningGuidance(
  recipes: RecipeWithCategory[],
  selections: RoutineSelection[],
  context: RoutineContext,
) {
  const hydration =
    recipeByRole(recipes, selections, "morningHydration") ||
    recipes[0]?.title ||
    "plain or warm water";

  return hasNutRestriction(context)
    ? `Start light with ${hydration}. Keep this slot hydration-first and skip nuts as per your preference.`
    : `Start light with ${hydration}. Keep it unsweetened; a small portion of soaked nuts can be taken separately if it suits you.`;
}

function breakfastGuidance(
  recipes: RecipeWithCategory[],
  selections: RoutineSelection[],
  context: RoutineContext,
) {
  const main = recipeByRole(recipes, selections, "breakfastMain");
  const protein =
    recipeByRole(recipes, selections, "protein") ||
    breakfastProteinFallback(context);
  const fruit = recipeByRole(recipes, selections, "fruit") || "1 seasonal fruit";
  const base = main || "a roti, oats, poha or similar breakfast base";

  return `Make breakfast filling: pair ${base} with ${protein}, then keep ${fruit} as a light add-on.`;
}

function midMorningGuidance(
  recipes: RecipeWithCategory[],
  selections: RoutineSelection[],
  context: RoutineContext,
) {
  const fruit = recipeByRole(recipes, selections, "fruit") || "1 seasonal fruit";
  const drink =
    recipeByRole(recipes, selections, "seasonalDrink") ||
    seasonalHydration(context);

  return `Keep this slot light with ${fruit}. Add ${drink} only when it fits the season and appetite.`;
}

function lunchGuidance(
  recipes: RecipeWithCategory[],
  selections: RoutineSelection[],
  context: RoutineContext,
) {
  const roti = recipeByRole(recipes, selections, "roti") || "2-3 roti";
  const rice = recipeByRole(recipes, selections, "rice");
  const protein =
    recipeByRole(recipes, selections, "protein") || proteinFallback(context);
  const vegetable =
    recipeByRole(recipes, selections, "cookedVegetable") || "sabzi";
  const salad = recipeByRole(recipes, selections, "vegetableSalad") || "salad";
  const curd = hasDairyRestriction(context) ? "" : " and curd";
  const riceText = rice ? `; keep ${rice} as an add-on if you want rice` : "";

  return `Make lunch the fuller plate: ${roti}, ${protein}, ${vegetable}, ${salad}${curd}${riceText}.`;
}

function eveningGuidance(
  recipes: RecipeWithCategory[],
  selections: RoutineSelection[],
  context: RoutineContext,
) {
  const snack =
    recipeByRole(recipes, selections, "snack") ||
    (hasNutRestriction(context)
      ? "roasted chana or sprouts chaat"
      : "roasted chana, sprouts or peanuts");
  const drink =
    recipeByRole(recipes, selections, "seasonalDrink") ||
    "tea/coffee without excess sugar";

  return `Keep the evening portion snack-sized with ${snack}. Pair with ${drink} without making it heavy.`;
}

function dinnerGuidance(
  recipes: RecipeWithCategory[],
  selections: RoutineSelection[],
  context: RoutineContext,
) {
  const roti = recipeByRole(recipes, selections, "roti") || "2 roti";
  const protein =
    recipeByRole(recipes, selections, "protein") || proteinFallback(context);
  const vegetable =
    recipeByRole(recipes, selections, "cookedVegetable") || "light sabzi";
  const salad = recipeByRole(recipes, selections, "vegetableSalad") || "salad";

  return `Keep dinner lighter than lunch: ${roti}, ${vegetable}, ${protein}, and ${salad}.`;
}

function bedtimeGuidance(context: RoutineContext) {
  if (hasDairyRestriction(context)) {
    return "Optional only when needed: choose warm water or a light caffeine-free drink.";
  }

  return "Optional only when it suits digestion: keep it simple with warm milk or skip this slot.";
}

function genericGuidance(
  recipes: RecipeWithCategory[],
  fallback: string,
) {
  const names = cleanParts(recipes.map((recipe) => recipe.title)).slice(0, 3);
  return names.length ? `Use this slot for ${names.join(", ")}.` : fallback;
}

export function mealRoutineKeyFromMealTime(mealTime: {
  slug: string;
  title: string;
}) {
  const slug = mealTime.slug.toLowerCase();
  const title = mealTime.title.toLowerCase().replace(/\s+/g, "-");

  if (slug.includes("early") || title.includes("early")) return "early-morning";
  if (slug.includes("breakfast") || title.includes("breakfast")) return "breakfast";
  if (slug.includes("mid") || title.includes("mid")) return "mid-morning";
  if (slug.includes("lunch") || title.includes("lunch")) return "lunch";
  if (slug.includes("evening") || title.includes("evening")) return "evening";
  if (slug.includes("dinner") || title.includes("dinner")) return "dinner";
  if (slug.includes("bed") || title.includes("bed")) return "bedtime";

  return slug;
}

export function sortByMealRoutine<T extends { slug: string; title: string }>(
  mealTimes: T[],
) {
  return [...mealTimes].sort((first, second) => {
    const firstKey = mealRoutineKeyFromMealTime(first);
    const secondKey = mealRoutineKeyFromMealTime(second);
    const routineDifference = orderIndex(firstKey) - orderIndex(secondKey);
    if (routineDifference !== 0) return routineDifference;
    return first.title.localeCompare(second.title);
  });
}

export function sortRoutineSlots<T extends MealPlanRoutineSlot>(slots: T[]) {
  return [...slots].sort((first, second) => {
    const routineDifference = orderIndex(first.key) - orderIndex(second.key);
    if (routineDifference !== 0) return routineDifference;
    return first.title.localeCompare(second.title);
  });
}

export function buildMealRoutineSlot(params: {
  mealKey: string;
  slug: string;
  title?: string;
  recipes: RecipeWithCategory[];
  selections: RoutineSelection[];
  context: RoutineContext;
}): MealPlanRoutineSlot {
  const template =
    MEAL_ROUTINE_TEMPLATES[params.mealKey as MealRoutineKey] ?? null;
  const title = template?.title || params.title || params.slug;
  const timeRange = template?.timeRange || "";
  const context = params.context;
  let guidance: string;

  switch (params.mealKey) {
    case "early-morning":
      guidance = earlyMorningGuidance(params.recipes, params.selections, context);
      break;
    case "breakfast":
      guidance = breakfastGuidance(params.recipes, params.selections, context);
      break;
    case "mid-morning":
      guidance = midMorningGuidance(params.recipes, params.selections, context);
      break;
    case "lunch":
      guidance = lunchGuidance(params.recipes, params.selections, context);
      break;
    case "evening":
      guidance = eveningGuidance(params.recipes, params.selections, context);
      break;
    case "dinner":
      guidance = dinnerGuidance(params.recipes, params.selections, context);
      break;
    case "bedtime":
      guidance = bedtimeGuidance(context);
      break;
    default:
      guidance = genericGuidance(params.recipes, "Balanced meal");
      break;
  }

  return {
    key: params.mealKey,
    slug: params.slug,
    title,
    timeRange,
    guidance,
    optional: template?.optional,
  };
}

export function buildOptionalBedtimeSlot(
  context: RoutineContext,
): MealPlanRoutineSlot {
  return buildMealRoutineSlot({
    mealKey: "bedtime",
    slug: "bedtime",
    recipes: [],
    selections: [],
    context,
  });
}

export function buildFallbackRoutineSlots(params: {
  mealTimes: Array<{ slug: string; title: string }>;
  mealsByTime: Record<string, RecipeWithCategory[]>;
  context?: RoutineContext;
}) {
  const context = params.context ?? {};
  const slots = sortByMealRoutine(params.mealTimes).map((mealTime) => {
    const mealKey = mealRoutineKeyFromMealTime(mealTime);
    return buildMealRoutineSlot({
      mealKey,
      slug: mealTime.slug,
      title: mealTime.title,
      recipes: params.mealsByTime[mealTime.slug] ?? [],
      selections: [],
      context,
    });
  });

  if (!slots.some((slot) => normalize(slot.key) === "bedtime")) {
    slots.push(buildOptionalBedtimeSlot(context));
  }

  return sortRoutineSlots(slots);
}
