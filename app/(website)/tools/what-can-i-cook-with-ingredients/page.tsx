import type { Prisma } from "@prisma/client";
import type { Metadata } from "next";
import {
  ArrowRight,
  CookingPot,
  Search,
  Share2,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import Container from "@/components/container";
import SmartBmiCta from "@/components/sections/bmi-tool/smart-bmi-cta";
import FridgeToolExperience from "@/components/sections/situation-tools/fridge-tool-experience";
import type {
  InitialRecipePage,
  SituationRecipe,
} from "@/components/sections/situation-tools/types";
import { db } from "@/lib/db";
import {
  filterPrimaryIngredientValues,
  isExtraPrimaryIngredientValue,
  isSupportingPrimaryIngredientValue,
  matchesSelectedPrimaryIngredient,
  primaryIngredientSearchTerms,
} from "@/lib/primary-ingredients";
import { publishedRecipeAnd } from "@/lib/recipe-publication";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  buildSeoMetadata,
  itemListJsonLd,
  jsonLd,
  recipeHref,
} from "@/lib/seo";

type ToolSearchParams = Promise<{
  ingredients?: string | string[];
  ingredient?: string | string[];
  mealFocus?: string | string[];
}>;

const pagePath = "/tools/smart-recipe-finder";
const pageTitle = "Smart Recipe Finder";
const pageDescription =
  "Use Smart Recipe Finder to search what you can cook with ingredients at home. Add bottle gourd, potato, onion, rice, lentils, spinach, cauliflower, curd, or leftovers and open matching Indian recipes.";
const pageSize = 7;
const BREAKFAST_RECIPE_TYPE_SLUGS = new Set(["meal", "grains", "protein", "snacks"]);
const LUNCH_DINNER_RECIPE_TYPE_SLUGS = new Set([
  "meal",
  "protein",
  "cooked-vegetable",
]);
const BREAKFAST_BLOCKED_TYPE_SLUGS = new Set([
  "cooked-vegetable",
  "vegetable-salad",
  "soup",
  "chutneydips",
  "curdraita",
  "desserts",
]);
const LIGHT_RECIPE_TYPE_SLUGS = new Set([
  "snacks",
  "soup",
  "vegetable-salad",
  "chutneydips",
  "curdraita",
  "desserts",
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
const BREAKFAST_TITLE_PATTERN =
  /\b(breakfast|cheela|chila|oats|poha|upma|idli|dosa|uttapam|sandwich|toast|pancake)\b/;
const MAIN_MEAL_TITLE_PATTERN =
  /\b(sabzi|sabji|curry|dal|chana|channa|gravy|stuffed|bharwa|kofta|bharta|kadhi|masala)\b/;
const LIGHT_MEAL_TITLE_PATTERN =
  /\b(cheela|chila|oats|salad|kheer|dessert|smoothie|juice|shake|raita|chutney)\b/;

const popularIngredientLinks = [
  {
    label: "Bottle gourd for dinner",
    eyebrow: "Use it first",
    ingredients: ["bottle gourd"],
    body: "Turn a quiet fridge vegetable into dinner ideas. Add lentils, tomato, onion, or curd inside the finder.",
  },
  {
    label: "Potato + onion ideas",
    eyebrow: "Everyday veg",
    ingredients: ["potato", "onion"],
    body: "A practical search when the kitchen has only the basics and dinner still needs a plan.",
  },
  {
    label: "Onion + tomato base",
    eyebrow: "Gravy starter",
    ingredients: ["onion", "tomato"],
    body: "A practical starting point for quick Indian gravies and vegetable dishes.",
  },
  {
    label: "Leftover rice ideas",
    eyebrow: "Leftover rescue",
    ingredients: ["rice"],
    body: "Use cooked rice for fast lunch, dinner, and one-pot recipe ideas.",
  },
  {
    label: "Lentils need a plan",
    eyebrow: "Simple meal",
    ingredients: ["dal"],
    body: "Find lentil-based ideas that can become lunch, dinner, or a simple family meal.",
  },
  {
    label: "Cauliflower dinner",
    eyebrow: "Seasonal veg",
    ingredients: ["cauliflower"],
    body: "Open cauliflower ideas and add potato, peas, onion, or tomato inside the tool.",
  },
  {
    label: "Spinach in the fridge",
    eyebrow: "Greens",
    ingredients: ["spinach"],
    body: "Find spinach ideas and combine with corn, dal, potato, onion, or tomato.",
  },
  {
    label: "Curd needs finishing",
    eyebrow: "Use it today",
    ingredients: ["curd"],
    body: "Useful when curd is open and you want lunch, dinner, side dish, or rice ideas.",
  },
];

const faqs = [
  {
    question: "How does the fridge recipe finder work?",
    answer:
      "Search the ingredient you already have, such as bottle gourd, potato, onion, tomato, rice, lentils, spinach, cauliflower, or curd. The tool opens matching Indian recipe cards with images, cooking time, cuisine, and the useful detail shown on each card.",
  },
  {
    question: "Can I search with more than one ingredient?",
    answer:
      "Yes. Start with one main ingredient like bottle gourd, potato, rice, lentils, or cauliflower, then add supporting ingredients like onion, tomato, capsicum, curd, peas, or spinach. More relevant ingredients make the recipe matches tighter.",
  },
  {
    question: "What should I search when I do not know what to cook?",
    answer:
      "Use the ingredient sitting in your kitchen first. For example, search bottle gourd if it needs to be used, potato onion if only basics are available, onion tomato if you want a curry base, or rice if you have leftover rice.",
  },
  {
    question: "Are the results vegetarian by default?",
    answer:
      "Yes. The tool starts with vegetarian recipe ideas by default. You can switch food type inside the tool if you want non veg or broader recipe ideas.",
  },
  {
    question: "Can I use this for leftover ingredients?",
    answer:
      "Yes. Add leftover rice, cooked lentils, curd, vegetables, or any item that needs to be used first. The matching cards help you choose what can be cooked today.",
  },
];

const howToSteps = [
  {
    icon: Search,
    title: "Search what is actually in your kitchen",
    body: "Type a real ingredient instead of a recipe name. Search bottle gourd, cauliflower, leftover rice, curd, lentils, onion, tomato, capsicum, potato, or spinach.",
  },
  {
    icon: Sparkles,
    title: "Add one supporting item for better matches",
    body: "If bottle gourd is available, add lentils or tomato. If rice is left, add curd or vegetables. The tool becomes more useful when it knows the base and the support.",
  },
  {
    icon: CookingPot,
    title: "Open a recipe that can be cooked today",
    body: "Recipe cards show image, time, cuisine, and useful food detail so you can quickly decide whether it works for lunch, dinner, snacks, or family cooking.",
  },
  {
    icon: Share2,
    title: "Share the same kitchen search",
    body: "Send the result page to someone at home when the question is still the same: what is available, and what can we cook today?",
  },
];

const searchExamples = [
  "what to cook with bottle gourd",
  "potato onion tomato dinner",
  "leftover rice lunch ideas",
  "spinach recipes for dinner",
  "cauliflower curry ideas",
  "curd and rice recipes",
];

const fridgeRecipeSelect = {
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
      ingredient: {
        select: {
          name: true,
          slug: true,
          IngredientCategories: { select: { slug: true } },
        },
      },
    },
    take: 32,
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

type FridgeRecipeRecord = Prisma.RecipesGetPayload<{
  select: typeof fridgeRecipeSelect;
}>;
type FridgeRecipeIngredientRecord = FridgeRecipeRecord["recipeIngredients"][number];

export const revalidate = 900;

export const metadata: Metadata = buildSeoMetadata({
  title: `${pageTitle}: Find Recipes by Ingredients | Kya Khayen`,
  description: pageDescription,
  path: pagePath,
  image: "/meta-images/home-og-2026.png",
  imageAlt: "Smart Recipe Finder by ingredients",
  keywords: [
    "smart recipe finder",
    "smart ingredient recipe finder",
    "what can I cook with ingredients",
    "what can I cook with ingredients I have",
    "what can I make with ingredients I have",
    "recipe finder by ingredients",
    "recipes by ingredients",
    "find recipes by ingredients",
    "cook with what you have",
    "what is in my fridge recipe finder",
    "recipes with ingredients at home",
    "what to cook with ingredients at home",
    "Indian recipe finder by ingredients",
    "what to cook with bottle gourd",
    "leftover rice recipe ideas",
    "vegetarian recipes by ingredients",
  ],
});

function normalizeToolValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugValue(value: string) {
  return normalizeToolValue(value).replace(/\s+/g, "-");
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

function singleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function parseIngredients(params: Awaited<ToolSearchParams>) {
  const rawValues = [
    singleParam(params.ingredients),
    ...(Array.isArray(params.ingredient)
      ? params.ingredient
      : params.ingredient
        ? [params.ingredient]
        : []),
  ];
  const values = rawValues
    .flatMap((value) => value.split(","))
    .map(normalizeToolValue)
    .filter(Boolean);
  const uniqueValues = filterPrimaryIngredientValues(values, 8);

  if (uniqueValues.length > 0) return uniqueValues;

  return values.length > 0 ? [] : ["bottle gourd"];
}

function defaultMealFocus() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 16) return "lunch";
  if (hour >= 16 && hour < 23) return "dinner";

  return "dinner";
}

function parseMealFocus(params: Awaited<ToolSearchParams>) {
  const focus = normalizeToolValue(singleParam(params.mealFocus)).replace(
    /\s+/g,
    "-",
  );

  if (focus === "breakfast" || focus === "lunch" || focus === "dinner") {
    return focus;
  }

  if (focus === "full-day") return "full-day";

  return defaultMealFocus();
}

function ingredientWhere(value: string): Prisma.RecipesWhereInput {
  const slug = slugValue(value);

  return {
    recipeIngredients: {
      some: {
        ingredient: {
          OR: [
            { name: { contains: value } },
            { slug: { contains: slug } },
          ],
        },
      },
    },
  };
}

function ingredientSearchWhere(value: string) {
  return selectedSearchTerms(value).map((term) => ingredientWhere(term));
}

function recipeText(recipe: FridgeRecipeRecord) {
  return normalizeToolValue(
    [
      recipe.title,
      recipe.slug,
      recipe.RecipeCategories?.name,
      ...recipe.recipeMealTime.map((item) => item.mealTime.title),
      ...recipe.recipeMealTime.map((item) => item.mealTime.slug),
      ...recipe.recipeRecipeType.map((item) => item.recipeType.title),
      ...recipe.recipeRecipeType.map((item) => item.recipeType.slug),
      ...recipe.recipeIngredients.map((item) => item.ingredient.name),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function selectedSearchTerms(value: string) {
  return primaryIngredientSearchTerms(value).map(normalizeToolValue).filter(Boolean);
}

function recipeIngredientIdentity(recipeIngredient: FridgeRecipeIngredientRecord) {
  return `${recipeIngredient.ingredient.name} ${
    recipeIngredient.ingredient.slug ?? ""
  }`;
}

function hasSelectedIngredientMatch(recipe: FridgeRecipeRecord, ingredients: string[]) {
  return recipe.recipeIngredients.some((recipeIngredient) =>
    matchesSelectedPrimaryIngredient(recipeIngredientIdentity(recipeIngredient), ingredients),
  );
}

function hasNoExtraPrimaryIngredientMatch(
  recipe: FridgeRecipeRecord,
  ingredients: string[],
) {
  return recipe.recipeIngredients.every((recipeIngredient) => {
    const categorySlug = recipeIngredient.ingredient.IngredientCategories?.slug;

    return !isExtraPrimaryIngredientValue(
      recipeIngredientIdentity(recipeIngredient),
      ingredients,
      categorySlug,
    );
  });
}

function hasOnlySupportingSelection(ingredients: string[]) {
  return (
    ingredients.length > 0 &&
    ingredients.every((ingredient) => isSupportingPrimaryIngredientValue(ingredient))
  );
}

function isAllowedForSelectedIngredientStrength(
  recipe: FridgeRecipeRecord,
  ingredients: string[],
) {
  if (!hasOnlySupportingSelection(ingredients)) return true;

  return !hasAnyRecipeType(recipe, SUPPORT_ONLY_BLOCKED_TYPE_SLUGS);
}

function hasMealFocus(recipe: FridgeRecipeRecord, focus: string) {
  return recipe.recipeMealTime.some(
    (item) => normalizedSlug(item.mealTime.slug) === normalizedSlug(focus),
  );
}

function hasRecipeType(recipe: FridgeRecipeRecord, slug: string) {
  return recipe.recipeRecipeType.some(
    (item) => normalizedSlug(item.recipeType.slug) === normalizedSlug(slug),
  );
}

function hasAnyRecipeType(recipe: FridgeRecipeRecord, slugs: Set<string>) {
  return recipe.recipeRecipeType.some((item) =>
    slugs.has(normalizedSlug(item.recipeType.slug)),
  );
}

function isLightRecipe(recipe: FridgeRecipeRecord) {
  return hasAnyRecipeType(recipe, LIGHT_RECIPE_TYPE_SLUGS);
}

function isSnackRecipe(recipe: FridgeRecipeRecord) {
  return hasRecipeType(recipe, "snacks");
}

function hasLunchOrDinnerFocus(recipe: FridgeRecipeRecord) {
  return hasMealFocus(recipe, "lunch") || hasMealFocus(recipe, "dinner");
}

function isLunchDinnerMainMeal(recipe: FridgeRecipeRecord, text: string) {
  return (
    hasLunchOrDinnerFocus(recipe) &&
    hasAnyRecipeType(recipe, LUNCH_DINNER_RECIPE_TYPE_SLUGS) &&
    !isSnackRecipe(recipe) &&
    !isLightRecipe(recipe) &&
    !BREAKFAST_TITLE_PATTERN.test(text) &&
    !(LIGHT_MEAL_TITLE_PATTERN.test(text) && !MAIN_MEAL_TITLE_PATTERN.test(text))
  );
}

function mealFocusScore(recipe: FridgeRecipeRecord, mealFocus: string) {
  const text = recipeText(recipe);

  if (mealFocus === "full-day") return 0;

  if (mealFocus === "breakfast") {
    return (
      (hasMealFocus(recipe, "breakfast") ? 420 : 0) +
      (BREAKFAST_TITLE_PATTERN.test(text) ? 260 : 0) +
      (hasRecipeType(recipe, "meal") || hasRecipeType(recipe, "grains") ? 140 : 0) -
      (MAIN_MEAL_TITLE_PATTERN.test(text) && !hasMealFocus(recipe, "breakfast")
        ? 260
        : 0)
    );
  }

  return (
    (hasMealFocus(recipe, mealFocus) ? 420 : 0) +
    (MAIN_MEAL_TITLE_PATTERN.test(text) ? 360 : 0) +
    (hasRecipeType(recipe, "meal") ||
    hasRecipeType(recipe, "protein") ||
    hasRecipeType(recipe, "cooked-vegetable")
      ? 220
      : 0) -
    (BREAKFAST_TITLE_PATTERN.test(text) ? 360 : 0) -
    (LIGHT_MEAL_TITLE_PATTERN.test(text) ? 320 : 0)
  );
}

function isAllowedForMealFocus(recipe: FridgeRecipeRecord, mealFocus: string) {
  const text = recipeText(recipe);

  if (mealFocus === "breakfast") {
    return (
      hasMealFocus(recipe, "breakfast") &&
      hasAnyRecipeType(recipe, BREAKFAST_RECIPE_TYPE_SLUGS) &&
      !hasAnyRecipeType(recipe, BREAKFAST_BLOCKED_TYPE_SLUGS) &&
      !LIGHT_MEAL_TITLE_PATTERN.test(text) &&
      (!MAIN_MEAL_TITLE_PATTERN.test(text) || BREAKFAST_TITLE_PATTERN.test(text))
    );
  }

  if (mealFocus === "lunch" || mealFocus === "dinner") {
    return isLunchDinnerMainMeal(recipe, text);
  }

  return true;
}

function scoreRecipe(
  recipe: FridgeRecipeRecord,
  ingredients: string[],
  mealFocus: string,
) {
  const text = recipeText(recipe);
  const title = normalizeToolValue(recipe.title);
  let score =
    Math.log10(Math.max(recipe.views, 0) + 10) * 80 +
    mealFocusScore(recipe, mealFocus);

  ingredients.forEach((ingredient, index) => {
    const weight = index === 0 ? 280 : 130;
    if (title.includes(ingredient)) score += weight;
    if (text.includes(ingredient)) score += Math.round(weight * 0.66);
  });

  if (/\b(lunch|dinner|meal|sabzi|curry|dal|gravy|masala|bhurji)\b/.test(text)) {
    score += 220;
  }
  if (/\b(snack|momo|momos|drink|water|juice|smoothie|dessert|salad|soup)\b/.test(text)) {
    score -= 180;
  }

  return score;
}

function publicRecipe(recipe: FridgeRecipeRecord, ingredients: string[]): SituationRecipe {
  const matched = ingredients
    .filter((ingredient) => recipeText(recipe).includes(ingredient))
    .slice(0, 2)
    .map(titleCase);

  return {
    id: recipe.id,
    title: recipe.title,
    slug: recipe.slug,
    metaSlug: recipe.metaSlug,
    imageUrl: recipe.imageUrl,
    RecipeCategories: recipe.RecipeCategories,
    recipeCookingTime: recipe.recipeCookingTime,
    recipeNutrient: recipe.recipeNutrient,
    recipeIngredients: recipe.recipeIngredients,
    recipeMealTime: recipe.recipeMealTime,
    recipeCuisine: recipe.recipeCuisine,
    recipeRecipeType: recipe.recipeRecipeType,
    ingredientCount: recipe._count.recipeIngredients,
    matchLabel:
      matched.length > 0 ? `Matches ${matched.join(", ")}` : "Recipe idea",
  };
}

async function getInitialRecipePage(
  ingredients: string[],
  mealFocus: string,
): Promise<InitialRecipePage> {
  if (ingredients.length === 0) {
    return {
      recipes: [],
      total: 0,
      page: 0,
      pageSize,
      hasPrevious: false,
      hasNext: false,
    };
  }

  const recipes = await db.recipes.findMany({
    where: publishedRecipeAnd([
      { imageUrl: { not: null } },
      {
        RecipeCategories: {
          OR: [{ slug: { in: ["veg", "vegan"] } }, { name: { in: ["Veg", "Vegan"] } }],
        },
      },
      { OR: ingredients.flatMap(ingredientSearchWhere) },
      ...(hasOnlySupportingSelection(ingredients)
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
    ]),
    select: fridgeRecipeSelect,
    orderBy: [
      { views: "desc" },
      { contentUpdatedAt: "desc" },
      { updatedAt: "desc" },
    ],
  });
  const ranked = recipes
    .filter((recipe) => hasSelectedIngredientMatch(recipe, ingredients))
    .filter((recipe) => hasNoExtraPrimaryIngredientMatch(recipe, ingredients))
    .filter((recipe) => isAllowedForSelectedIngredientStrength(recipe, ingredients))
    .filter((recipe) => isAllowedForMealFocus(recipe, mealFocus))
    .sort(
      (left, right) =>
        scoreRecipe(right, ingredients, mealFocus) -
        scoreRecipe(left, ingredients, mealFocus),
    );

  return {
    recipes: ranked.slice(0, pageSize).map((recipe) => publicRecipe(recipe, ingredients)),
    total: ranked.length,
    page: 0,
    pageSize,
    hasPrevious: false,
    hasNext: ranked.length > pageSize,
  };
}

function toolUrl(ingredients: string[], scrollToTool = true) {
  const params = new URLSearchParams({ ingredients: ingredients.join(",") });
  return `${pagePath}?${params}${scrollToTool ? "#fridge-tool" : ""}`;
}

function webApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: pageTitle,
    url: absoluteUrl(pagePath),
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    description: pageDescription,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
  };
}

function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export default async function FridgeToolPage({
  searchParams,
}: {
  searchParams: ToolSearchParams;
}) {
  const params = await searchParams;
  const ingredients = parseIngredients(params);
  const mealFocus = parseMealFocus(params);
  const ingredientLabels = Object.fromEntries(
    ingredients.map((ingredient) => [ingredient, titleCase(ingredient)]),
  );
  const initialRecipePage = await getInitialRecipePage(ingredients, mealFocus);
  const schema = [
    webApplicationJsonLd(),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: pageTitle, path: pagePath },
    ]),
    itemListJsonLd(
      "Recipes you can cook with ingredients at home",
      initialRecipePage.recipes.map((recipe) => ({
        name: recipe.title,
        path: recipeHref(recipe),
        image: recipe.imageUrl,
      })),
    ),
    faqJsonLd(),
  ];

  return (
    <main className="home-surface min-h-screen pb-16 pt-8 sm:pt-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(schema) }}
      />
      <Container>
        <nav className="mb-5 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#8b735f] dark:text-white/60">
          <Link href="/" className="hover:text-primary">
            Home
          </Link>
          <span>/</span>
          <Link href="/tools" className="hover:text-primary">
            Tools
          </Link>
          <span>/</span>
          <span className="text-primary">{pageTitle}</span>
        </nav>

        <section className="mb-7 overflow-hidden rounded-[1.6rem] bg-[#201713] text-white shadow-[0_30px_90px_-50px_rgba(32,23,19,0.9)]">
          <div className="grid gap-0 lg:grid-cols-[0.96fr_1.04fr]">
            <div className="p-6 sm:p-8 lg:p-10">
              <p className="mb-4 inline-flex items-center rounded-full border border-white/14 bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#f2cf8b]">
                Smart Recipe Finder
              </p>
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-6xl">
                What&apos;s in your fridge?
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
                Add what is actually available at home and open matching Indian
                recipes. Start with bottle gourd, potato, onion, tomato, rice,
                lentils, spinach, cauliflower, curd, or leftover rice.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href={toolUrl(["bottle gourd"])}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#f2cf8b] px-5 py-3 text-sm font-semibold text-[#201713] transition hover:bg-[#ffe2a2]"
                >
                  Start with bottle gourd
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href={toolUrl(["onion", "tomato"])}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/16 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:border-[#f2cf8b] hover:bg-white/12"
                >
                  Try onion tomato
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-2">
                {searchExamples.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/12 bg-white/7 px-3 py-2 text-xs font-semibold text-white/76"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative min-h-[22rem] overflow-hidden bg-[#201713] sm:min-h-[30rem] lg:min-h-full">
              <Image
                src="/assets/images/tools/ingredient-finder-hero.png"
                alt="Kitchen fridge with ingredients for Smart Recipe Finder"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
                priority
              />
              <span className="absolute inset-0 bg-gradient-to-t from-[#201713]/44 via-[#201713]/10 to-transparent" />
            </div>
          </div>
        </section>

        <div id="fridge-tool" className="scroll-mt-28">
          <FridgeToolExperience
            key={ingredients.join("|")}
            initialIngredients={ingredients}
            initialIngredientLabels={ingredientLabels}
            initialRecipePage={initialRecipePage}
            initialMealFocus={mealFocus}
          />
        </div>

        <SmartBmiCta className="mt-12" />

        <section className="mt-14 overflow-hidden rounded-[1.4rem] border border-[#ead9c3] bg-[#fffaf1] dark:border-white/10 dark:bg-white/[0.04]">
          <div className="grid lg:grid-cols-[0.94fr_1.06fr]">
              <Link
                href={toolUrl(popularIngredientLinks[0].ingredients)}
                className="group relative flex min-h-[440px] overflow-hidden bg-[radial-gradient(circle_at_82%_18%,rgba(241,204,139,0.28),transparent_30%),linear-gradient(145deg,#4d3421,#201713)] p-6 text-white transition sm:p-8"
            >
              <span className="absolute -right-16 -top-14 h-52 w-52 rounded-full border border-white/12" />
              <span className="absolute -bottom-20 right-16 h-64 w-64 rounded-full bg-white/7 blur-2xl" />
              <span className="relative z-10 flex min-h-full flex-col justify-between">
                <span>
                  <span className="inline-flex rounded-full border border-white/18 bg-white/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 backdrop-blur">
                    Featured search
                  </span>
                  <span className="mt-8 block max-w-md text-4xl font-semibold leading-tight sm:text-5xl">
                    Bottle gourd is still in the fridge.
                  </span>
                  <span className="mt-5 block max-w-md text-base leading-8 text-white/78">
                    The useful test is the everyday vegetable people ignore
                    until it has to be cooked. Open bottle gourd ideas, then add
                    lentils, tomato, onion, or curd.
                  </span>
                  <span className="mt-6 flex flex-wrap gap-2">
                    {["Opens finder", "Shows matching cards", "Add support items"].map(
                      (item) => (
                        <span
                          key={item}
                          className="rounded-full border border-white/14 bg-white/12 px-3 py-2 text-xs font-semibold text-white/82 backdrop-blur"
                        >
                          {item}
                        </span>
                      ),
                    )}
                  </span>
                </span>
                <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold">
                  Open bottle gourd ideas
                  <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                </span>
              </span>
            </Link>
            <div className="p-4 sm:p-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                    Ready searches
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold leading-tight text-[#2e241c] dark:text-white">
                    Open the situation closest to your kitchen.
                  </h2>
                </div>
                <p className="max-w-sm text-sm leading-6 text-[#756354] dark:text-white/64">
                  These links are real starting points. Open one, then add more
                  ingredients inside the finder.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {popularIngredientLinks.slice(1).map((item, index) => (
                  <Link
                    key={item.label}
                    href={toolUrl(item.ingredients)}
                    className={[
                      "group flex min-h-[116px] flex-col justify-between rounded-xl border p-4 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#5c3219]/10",
                      index === 2
                        ? "border-[#201713] bg-[#201713] text-white sm:col-span-2"
                        : "border-[#ead9c3] bg-white text-[#45372e] dark:border-white/10 dark:bg-white/[0.05] dark:text-white",
                    ].join(" ")}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span
                        className={[
                          "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                          index === 2
                            ? "bg-white/12 text-[#f2cf8b]"
                            : "bg-[#f1e4cf] text-primary",
                        ].join(" ")}
                      >
                        {item.eyebrow}
                      </span>
                      <ArrowRight className="size-4 shrink-0 transition group-hover:translate-x-1" />
                    </span>
                    <span>
                      <span className="mt-4 block text-base font-semibold">
                        {item.label}
                      </span>
                      <span
                        className={[
                          "mt-2 block text-sm leading-6",
                          index === 2 ? "text-white/68" : "text-[#756354] dark:text-white/64",
                        ].join(" ")}
                      >
                        {item.body}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-8 lg:grid-cols-[0.66fr_1.34fr] lg:items-start">
          <div className="rounded-[1.3rem] bg-[#201713] p-6 text-white sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f2cf8b]">
              How to use it
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight">
              Search ingredients first, recipes second.
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/68">
              This tool is useful when you are not sure what to make. Instead of
              guessing a recipe name, add the items available at home and let the
              recipe cards narrow the options.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["One ingredient", "Better combo", "Open recipe"].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/12 bg-white/8 px-3 py-2 text-xs font-semibold text-white/72"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute bottom-4 left-5 top-4 hidden w-px bg-[#ead9c3] sm:block" />
            {howToSteps.map((item, index) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="relative mb-4 grid gap-3 rounded-xl border border-[#ead9c3] bg-white p-4 dark:border-white/10 dark:bg-white/[0.04] sm:ml-10 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-start"
                >
                  <span className="absolute -left-[3.25rem] top-4 hidden size-10 items-center justify-center rounded-full border border-[#ead9c3] bg-[#fffaf1] text-primary sm:flex">
                    {index + 1}
                  </span>
                  <div className="flex items-center gap-3 sm:block">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-[#f2e4cf] text-primary">
                      <Icon className="size-4" />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a17135]">
                      Step {index + 1}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-base font-semibold leading-6 text-[#2e241c] dark:text-white">
                      {item.title}
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-[#756354] dark:text-white/64">
                      {item.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-16 overflow-hidden rounded-[1.4rem] border border-[#ead9c3] bg-white dark:border-white/10 dark:bg-white/[0.04]">
          <div className="grid lg:grid-cols-[0.82fr_1.18fr]">
            <div className="bg-[#fffaf1] p-5 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                Ask it naturally
              </p>
              <h2 className="mt-2 text-3xl font-semibold leading-tight text-[#2e241c] dark:text-white">
                Real kitchen questions this page should answer.
              </h2>
              <div className="mt-6 space-y-2">
                {searchExamples.slice(0, 4).map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-xl border border-[#ead9c3] bg-white px-3 py-3 text-sm font-semibold text-[#45372e]"
                  >
                    <Search className="size-4 shrink-0 text-primary" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-0 divide-y divide-[#ead9c3] dark:divide-white/10">
            {faqs.map((item) => (
              <article
                key={item.question}
                className="p-4 dark:bg-transparent sm:p-5"
              >
                <h2 className="text-base font-semibold leading-6 text-[#2e241c] dark:text-white">
                  {item.question}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#756354] dark:text-white/64">
                  {item.answer}
                </p>
              </article>
            ))}
            </div>
          </div>
        </section>
      </Container>
    </main>
  );
}
