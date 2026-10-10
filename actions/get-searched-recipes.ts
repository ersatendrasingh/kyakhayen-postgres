"use server";

import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { publishedRecipeWhere } from "@/lib/recipe-publication";
import type { RecipeCardRecipe } from "@/components/recipes/recipe-card";
import { articleHref, recipeHref } from "@/lib/seo";
import {
  isFastingFriendlyRecipe,
  isFastingIngredientName,
  isFastingSearchQuery,
} from "@/lib/fasting-recipe";

type SearchInput = {
  k?: string;
};

type SearchPageInput = SearchInput & {
  cursor?: string | null;
  limit?: number;
};

export type SearchedRecipePage = {
  recipes: RecipeCardRecipe[];
  nextCursor: string | null;
};

export type ExactRecipeSearchMatch = {
  title: string;
  href: string;
};

export type RecipeSearchSuggestion = {
  label: string;
  query: string;
  href?: string;
  imageUrl?: string | null;
  meta?: string;
  score?: number;
  isExact?: boolean;
  kind:
    | "Dish"
    | "Ingredient"
    | "Cuisine"
    | "Mealtime"
    | "Preference"
    | "Collection"
    | "Story";
};

export type SearchedArticle = {
  id: string;
  title: string;
  metaDescription: string | null;
  content?: string | null;
  imageUrl: string | null;
  slug: string;
  metaSlug: string | null;
  updatedAt: Date;
  PostCategory: Array<{ category: { title: string; slug: string } }>;
  PostTag: Array<{ tag: { title: string; slug: string } }>;
};

const stopWords = new Set([
  "recipe",
  "recipes",
  "dish",
  "dishes",
  "food",
  "ki",
  "ka",
  "ke",
  "ko",
  "me",
  "mein",
  "par",
  "se",
  "to",
  "kya",
  "aaj",
  "kal",
  "abhi",
  "mujhe",
  "mere",
  "meri",
  "mera",
  "ham",
  "hum",
  "apne",
  "ghar",
  "liye",
  "liya",
  "kuch",
  "do",
  "de",
  "dena",
  "suggest",
  "suggestion",
  "please",
  "plz",
  "khana",
  "khane",
  "khau",
  "khaye",
  "khayen",
  "chahiye",
  "chahie",
  "batao",
  "dikhao",
  "show",
  "find",
  "search",
  "wali",
  "wala",
  "wale",
  "banaye",
  "banayen",
  "banao",
  "bana",
  "banana",
  "banani",
  "banane",
  "banau",
  "banaun",
  "banaoon",
  "banega",
  "banegi",
  "recpe",
  "recpes",
  "receipe",
  "receipes",
  "ideas",
  "idea",
  "and",
  "or",
  "with",
  "without",
  "for",
  "from",
  "the",
  "a",
  "an",
  "easy",
  "quick",
  "healthy",
  "homemade",
]);

const tokenAliases: Record<string, string[]> = {
  amaranth: ["rajgira"],
  rajgira: ["amaranth"],
  atta: ["flour"],
  flour: ["atta"],
  kuttu: ["buckwheat"],
  buckwheat: ["kuttu"],
  singhara: ["water chestnut"],
  sabudana: ["sago"],
  sago: ["sabudana"],
  makhana: ["foxnut"],
  foxnut: ["makhana"],
  sendha: ["rock salt"],
  samak: ["barnyard"],
  samvat: ["barnyard"],
  chapathi: ["chapati", "roti"],
  chappati: ["chapati", "roti"],
  chapati: ["roti"],
  roti: ["chapati"],
  cutlets: ["cutlet"],
  cutlet: ["cutlets"],
  paner: ["paneer"],
  panner: ["paneer"],
  razma: ["rajma"],
  rajama: ["rajma"],
  chhole: ["chole"],
  fast: ["vrat", "upvas", "fasting", "farali"],
  brrekfast: ["breakfast"],
  mornig: ["morning", "breakfast"],
  morng: ["morning", "breakfast"],
  mrng: ["morning", "breakfast"],
  mrning: ["morning", "breakfast"],
  nashta: ["breakfast"],
  subah: ["breakfast"],
  sham: ["shaam", "evening"],
  anda: ["egg", "eggetarian"],
  chicken: ["non veg", "chicken"],
  garmi: ["summer"],
  juice: ["beverage", "smoothie"],
  juices: ["beverage", "smoothie"],
};

const intentRules = [
  {
    triggers: ["shaam", "sham", "evening", "supper", "evenin"],
    terms: ["evening", "dinner", "snacks"],
  },
  {
    triggers: ["raat", "rat", "night", "raatri", "diner", "dinr"],
    terms: ["dinner", "supper"],
  },
  {
    triggers: [
      "subah",
      "savera",
      "morning",
      "mornig",
      "morng",
      "mrng",
      "mrning",
      "breakfst",
      "brkfast",
      "breakfas",
    ],
    terms: ["early morning", "breakfast", "mid morning"],
  },
  {
    triggers: [
      "nashta",
      "nasta",
      "snack",
      "snacks",
      "tiffin",
      "lunchbox",
      "lunch box",
      "school",
      "office",
    ],
    terms: ["breakfast", "snacks", "evening"],
  },
  {
    triggers: ["dopahar", "duphar", "afternoon"],
    terms: ["lunch"],
  },
  {
    triggers: [
      "garmi",
      "garami",
      "summer",
      "thanda",
      "cooling",
      "cool",
      "refreshing",
    ],
    terms: ["summer", "beverage", "smoothie", "juice", "curd", "raita"],
  },
  {
    triggers: ["sardi", "thand", "winter", "warm", "garam"],
    terms: ["winter", "soup", "dinner"],
  },
  {
    triggers: ["barsaat", "barish", "rain", "rainy", "monsoon"],
    terms: ["rainy", "snacks", "soup"],
  },
  {
    triggers: [
      "drink",
      "drinks",
      "peene",
      "peena",
      "juice",
      "juce",
      "smoothie",
      "smoothii",
      "smothie",
      "smootie",
      "sharbat",
      "cooler",
    ],
    terms: ["beverage", "smoothie", "juice"],
  },
  {
    triggers: ["salad", "salads"],
    terms: ["vegetable salad", "fruit salad", "salad"],
  },
  {
    triggers: ["sweet", "sweets", "meetha", "mithai", "dessert", "desserts"],
    terms: ["dessert", "sweet"],
  },
  {
    triggers: ["bachcha", "bachche", "kids", "children", "child"],
    terms: ["breakfast", "snacks", "lunch"],
  },
  {
    triggers: ["protein", "protean", "protien"],
    terms: ["protein", "high protein"],
  },
  {
    triggers: ["fiber", "fibre"],
    terms: ["fiber rich"],
  },
  {
    triggers: ["calorie", "calories", "weightloss", "diet"],
    terms: ["low calories", "low fat", "healthy"],
  },
  {
    triggers: ["healthy", "helthy", "light", "halka", "lite"],
    terms: [
      "low calories",
      "low fat",
      "rich in vitamins and minerals",
      "vegetable salad",
      "soup",
    ],
  },
  {
    triggers: ["filling", "heavy", "bharpet", "petbhar", "meal"],
    terms: ["meal", "lunch", "dinner"],
  },
  {
    triggers: ["vrat", "fast", "fasting", "upvas", "farali"],
    terms: [
      "sendha namak",
      "rock salt",
      "kuttu",
      "buckwheat",
      "singhara",
      "water chestnut",
      "sabudana",
      "sago",
      "samak",
      "samvat",
      "barnyard",
      "makhana",
      "foxnut",
      "rajgira",
      "amaranth",
    ],
  },
] as const;

const genericFastingTokens = new Set([
  "vrat",
  "upvas",
  "fast",
  "fasting",
  "farali",
  "phalahari",
  "navratri",
]);

const protectedSearchTerms = new Set([
  "bhatura",
  "bhature",
  "chhole",
  "chole",
  "choley",
  "cholay",
  "kachori",
  "samosa",
]);

const fastingSpecificTermGroups = [
  {
    triggers: ["sendha", "rock salt"],
    terms: ["sendha", "rock salt", "himalayan pink salt"],
  },
  { triggers: ["kuttu", "buckwheat"], terms: ["kuttu", "buckwheat"] },
  {
    triggers: ["singhara", "water chestnut"],
    terms: ["singhara", "water chestnut"],
  },
  { triggers: ["sabudana", "sago"], terms: ["sabudana", "sago"] },
  {
    triggers: ["samak", "samvat", "barnyard"],
    terms: ["samak", "samvat", "barnyard"],
  },
  { triggers: ["makhana", "foxnut"], terms: ["makhana", "foxnut"] },
  { triggers: ["rajgira"], terms: ["rajgira", "amaranth"] },
] as const;

const mealIdeaQuestionWords = new Set([
  "kya",
  "what",
  "which",
  "kaunsa",
  "kaunsi",
  "kaun",
]);

const mealIdeaActionWords = new Set([
  "khana",
  "khane",
  "khau",
  "khaye",
  "khayen",
  "eat",
  "eating",
  "cook",
  "cooking",
  "banaye",
  "banayen",
  "banao",
  "bana",
  "banana",
  "banani",
  "banane",
  "banau",
  "banaun",
  "banaoon",
]);

const allDayMealIdeaTerms = ["breakfast", "lunch", "dinner", "snacks", "meal"];

const timeOfDayMealIdeaRules = [
  {
    triggers: ["subah", "savera", "morning", "mornig", "morng", "mrng", "mrning"],
    terms: ["early morning", "breakfast", "mid morning"],
  },
  {
    triggers: ["dopahar", "duphar", "afternoon"],
    terms: ["lunch", "meal"],
  },
  {
    triggers: ["shaam", "sham", "evening", "evenin"],
    terms: ["evening", "snacks", "dinner"],
  },
  {
    triggers: ["raat", "rat", "night", "raatri", "tonight"],
    terms: ["dinner", "supper"],
  },
] as const;

type SearchIntent = {
  tokens: string[];
  phraseQueries: string[];
  coverageGroups: string[][];
  requiredRecipeGroups: string[][];
  isFastingIntent: boolean;
};

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ");
}

function queryIncludesTrigger(
  normalizedQuery: string,
  words: string[],
  trigger: string,
) {
  const normalizedTrigger = normalize(trigger);
  const triggerWords = normalizedTrigger.split(" ").filter(Boolean);

  if (triggerWords.length <= 1) return words.includes(normalizedTrigger);

  return normalizedQuery.includes(normalizedTrigger);
}

function isMealIdeaQuery(normalizedQuery: string, words: string[]) {
  const hasQuestionWord = words.some((word) => mealIdeaQuestionWords.has(word));
  const hasActionWord = words.some((word) => mealIdeaActionWords.has(word));

  return (
    (hasQuestionWord && hasActionWord) ||
    normalizedQuery.includes("what to eat") ||
    normalizedQuery.includes("what should i eat") ||
    normalizedQuery.includes("what to cook") ||
    normalizedQuery.includes("kya khayen") ||
    normalizedQuery.includes("kya khaye") ||
    normalizedQuery.includes("kya banayen") ||
    normalizedQuery.includes("kya banaye")
  );
}

function currentIndiaMealIdeaTerms() {
  const hourText = new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    hourCycle: "h23",
    timeZone: "Asia/Kolkata",
  }).format(new Date());
  const hour = Number(hourText.match(/\d+/)?.[0] || 12);

  if (hour >= 5 && hour < 11) return ["early morning", "breakfast", "mid morning"];
  if (hour >= 11 && hour < 16) return ["lunch", "meal"];
  if (hour >= 16 && hour < 19) return ["evening", "snacks", "beverage"];

  return ["dinner", "supper", "meal"];
}

function inferredMealIdeaTerms(normalizedQuery: string) {
  const words = normalizedQuery.split(" ").filter(Boolean);
  const explicitTimeTerms = timeOfDayMealIdeaRules
    .filter((rule) =>
      rule.triggers.some((trigger) =>
        queryIncludesTrigger(normalizedQuery, words, trigger),
      ),
    )
    .flatMap((rule) => rule.terms);

  if (explicitTimeTerms.length > 0) return explicitTimeTerms;
  if (!isMealIdeaQuery(normalizedQuery, words)) return [];
  if (words.includes("kal") || words.includes("tomorrow")) return allDayMealIdeaTerms;
  if (
    words.includes("aaj") ||
    words.includes("today") ||
    words.includes("abhi") ||
    words.includes("now")
  ) {
    return currentIndiaMealIdeaTerms();
  }

  return allDayMealIdeaTerms;
}

function singularizeToken(token: string) {
  if (token.length <= 3) return token;
  if (token.endsWith("ies")) return `${token.slice(0, -3)}y`;
  if (token.endsWith("es")) return token.slice(0, -2);
  if (token.endsWith("s")) return token.slice(0, -1);

  return token;
}

function queryTokens(query: string) {
  return normalize(query)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .filter((token) => !stopWords.has(token))
    .map(singularizeToken);
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values.map((value) => (value ? normalize(value) : "")).filter(Boolean),
    ),
  );
}

function tokenList(value: string | null | undefined) {
  return normalize(value || "")
    .split(" ")
    .filter(Boolean)
    .map(singularizeToken)
    .filter((token) => token.length >= 3 && !stopWords.has(token));
}

function expandedTermsForToken(token: string) {
  const singular = singularizeToken(token);

  return [
    token,
    singular,
    ...(tokenAliases[token] || []),
    ...(tokenAliases[singular] || []),
  ];
}

function tokenChunks(tokens: string[], size: number) {
  const chunks: string[][] = [];
  for (let index = 0; index < tokens.length; index += size) {
    chunks.push(tokens.slice(index, index + size));
  }

  return chunks;
}

let searchLexiconPromise: Promise<string[]> | null = null;

async function getSearchLexicon() {
  if (!searchLexiconPromise) {
    searchLexiconPromise = (async () => {
      try {
        const [
          recipes,
          ingredients,
          cuisines,
          mealTimes,
          recipeTypes,
          categories,
          dietTypes,
          nutrients,
          seasons,
          posts,
        ] = await Promise.all([
          db.recipes.findMany({
            where: publishedRecipeWhere(),
            select: { title: true, slug: true, metaTitle: true },
            take: 2600,
          }),
          db.ingredients.findMany({
            where: { isPublished: true },
            select: { name: true, slug: true },
            take: 5000,
          }),
          db.cuisines.findMany({
            where: { isPublished: true },
            select: { title: true, slug: true },
          }),
          db.mealTimes.findMany({
            where: { isPublished: true },
            select: { title: true, slug: true },
          }),
          db.recipeTypes.findMany({
            where: { isPublished: true },
            select: { title: true, slug: true },
          }),
          db.recipeCategories.findMany({
            where: { isPublished: true },
            select: { name: true, slug: true },
          }),
          db.dietTypes.findMany({
            where: { isPublished: true },
            select: { title: true, slug: true },
          }),
          db.nutrient.findMany({
            where: { isPublished: true },
            select: { title: true, slug: true },
          }),
          db.recipeSeasons.findMany({ select: { title: true } }),
          db.post.findMany({
            where: { isPublished: true },
            select: { title: true, slug: true, metaSlug: true },
            take: 500,
          }),
        ]);
        const values = [
          ...recipes.flatMap((item) => [item.title, item.slug, item.metaTitle]),
          ...ingredients.flatMap((item) => [item.name, item.slug]),
          ...cuisines.flatMap((item) => [item.title, item.slug]),
          ...mealTimes.flatMap((item) => [item.title, item.slug]),
          ...recipeTypes.flatMap((item) => [item.title, item.slug]),
          ...categories.flatMap((item) => [item.name, item.slug]),
          ...dietTypes.flatMap((item) => [item.title, item.slug]),
          ...nutrients.flatMap((item) => [item.title, item.slug]),
          ...seasons.map((item) => item.title),
          ...posts.flatMap((item) => [item.title, item.slug, item.metaSlug]),
          ...intentRules.flatMap((rule) => [...rule.triggers, ...rule.terms]),
          ...Object.values(tokenAliases).flat(),
        ];

        return Array.from(new Set(values.flatMap(tokenList))).sort(
          (left, right) =>
            left.length - right.length || left.localeCompare(right),
        );
      } catch (error) {
        console.error("[SEARCH_LEXICON]", error);
        return Array.from(
          new Set([
            ...intentRules
              .flatMap((rule) => [...rule.triggers, ...rule.terms])
              .flatMap(tokenList),
            ...Object.values(tokenAliases).flat().flatMap(tokenList),
          ]),
        );
      }
    })();
  }

  return searchLexiconPromise;
}

function editDistanceWithin(
  source: string,
  target: string,
  maxDistance: number,
) {
  if (Math.abs(source.length - target.length) > maxDistance)
    return maxDistance + 1;
  if (source === target) return 0;

  let previous = Array.from({ length: target.length + 1 }, (_, index) => index);

  for (let sourceIndex = 1; sourceIndex <= source.length; sourceIndex += 1) {
    const current = [sourceIndex];
    let bestInRow = current[0];

    for (let targetIndex = 1; targetIndex <= target.length; targetIndex += 1) {
      const substitutionCost =
        source[sourceIndex - 1] === target[targetIndex - 1] ? 0 : 1;
      const value = Math.min(
        previous[targetIndex] + 1,
        current[targetIndex - 1] + 1,
        previous[targetIndex - 1] + substitutionCost,
      );

      current[targetIndex] = value;
      bestInRow = Math.min(bestInRow, value);
    }

    if (bestInRow > maxDistance) return maxDistance + 1;
    previous = current;
  }

  return previous[target.length];
}

function fuzzyMatchesForToken(token: string, lexicon: string[]) {
  if (protectedSearchTerms.has(token)) return [];
  if (token.length < 4 || stopWords.has(token)) return [];
  const normalizedToken = singularizeToken(token);
  const maxDistance = normalizedToken.length <= 5 ? 1 : 2;

  return lexicon
    .map((candidate) => {
      if (candidate === normalizedToken) return { candidate, distance: 0 };
      if (candidate.length < 3) return null;
      if (candidate[0] !== normalizedToken[0]) return null;

      const distance = editDistanceWithin(
        normalizedToken,
        candidate,
        maxDistance,
      );
      if (distance > maxDistance) return null;

      return { candidate, distance };
    })
    .filter(Boolean)
    .sort((left, right) => {
      if (!left || !right) return 0;
      return (
        left.distance - right.distance ||
        left.candidate.length - right.candidate.length
      );
    })
    .slice(0, 5)
    .map((match) => match?.candidate)
    .filter(Boolean) as string[];
}

function textMatchesSearchIntent(value: string, tokens: string[]) {
  const normalizedValue = normalize(value);
  const valueTokens = normalizedValue.split(" ").filter(Boolean);

  return tokens.some((token) => {
    const normalizedToken = normalize(token);
    if (!normalizedToken || normalizedToken.length < 3) return false;
    const tokenWords = normalizedToken.split(" ").filter(Boolean);

    if (tokenWords.length > 1) return normalizedValue.includes(normalizedToken);

    return valueTokens.includes(normalizedToken);
  });
}

async function buildSearchIntent(query: string): Promise<SearchIntent> {
  const normalizedQuery = normalize(query);
  const baseTokens = queryTokens(query);
  const normalizedQueryWords = normalizedQuery.split(" ").filter(Boolean);
  const lexicon = await getSearchLexicon();
  const ruleTerms = intentRules
    .filter((rule) =>
      rule.triggers.some((trigger) => {
        return queryIncludesTrigger(normalizedQuery, normalizedQueryWords, trigger);
      }),
    )
    .flatMap((rule) => rule.terms);
  const mealIdeaTerms = inferredMealIdeaTerms(normalizedQuery);
  const ruleTermsByToken = new Map<string, string[]>();
  baseTokens.forEach((token) => {
    intentRules.forEach((rule) => {
      if (rule.triggers.some((trigger) => normalize(trigger) === token)) {
        ruleTermsByToken.set(token, [
          ...(ruleTermsByToken.get(token) || []),
          ...rule.terms,
        ]);
      }
    });
  });
  const fuzzyTokenGroups = baseTokens.map((token) =>
    fuzzyMatchesForToken(token, lexicon),
  );
  const fuzzyTerms = fuzzyTokenGroups.flat();
  const expanded = [
    ...baseTokens.flatMap(expandedTermsForToken),
    ...ruleTerms,
    ...mealIdeaTerms,
    ...fuzzyTerms,
    ...fuzzyTerms.flatMap(expandedTermsForToken),
  ];
  const tokens = Array.from(
    new Set(
      expanded
        .flatMap((term) => [term, ...tokenList(term)])
        .map((term) => normalize(term))
        .filter(Boolean)
        .filter((term) => !stopWords.has(term)),
    ),
  );
  const correctedTokens = baseTokens.map(
    (token, index) => fuzzyTokenGroups[index]?.[0] || token,
  );
  const correctedQuery = correctedTokens.join(" ");
  const phraseQueries = uniqueStrings([
    query,
    correctedQuery,
    ...ruleTerms,
    ...mealIdeaTerms,
  ]);
  const coverageGroups = baseTokens.map((token, index) => {
    const alternatives = [
      token,
      singularizeToken(token),
      ...(tokenAliases[token] || []),
      ...(tokenAliases[singularizeToken(token)] || []),
      ...(ruleTermsByToken.get(token) || []),
      ...(fuzzyTokenGroups[index] || []),
    ];

    return Array.from(
      new Set(
        alternatives
          .flatMap((term) => [normalize(term), ...tokenList(term)])
          .filter(Boolean)
          .filter((term) => !stopWords.has(term)),
      ),
    );
  });
  const isFastingIntent = isFastingSearchQuery(query);
  const semanticRequiredGroups = isFastingIntent
    ? coverageGroups.filter((group, index) => {
        const token = baseTokens[index];
        return token && !genericFastingTokens.has(token) && group.length > 0;
      })
    : [];
  const directFastingRequiredGroups = isFastingIntent
    ? fastingSpecificTermGroups
        .filter((group) =>
          group.triggers.some((trigger) => {
            const normalizedTrigger = normalize(trigger);
            return (
              normalizedQueryWords.includes(normalizedTrigger) ||
              normalizedQuery.includes(normalizedTrigger)
            );
          }),
        )
        .map((group) =>
          group.terms.flatMap((term) => [normalize(term), ...tokenList(term)]),
        )
    : [];
  const requiredRecipeGroups =
    directFastingRequiredGroups.length > 0
      ? directFastingRequiredGroups
      : semanticRequiredGroups;

  return {
    tokens: tokens.length > 0 ? tokens : [normalizedQuery].filter(Boolean),
    phraseQueries,
    coverageGroups: coverageGroups.filter((group) => group.length > 0),
    requiredRecipeGroups,
    isFastingIntent,
  };
}

const searchRecipeSelect = {
  id: true,
  title: true,
  slug: true,
  metaSlug: true,
  description: true,
  imageUrl: true,
  views: true,
  RecipeCategories: {
    select: { id: true, name: true },
  },
  recipeIngredients: {
    select: { ingredient: { select: { name: true } } },
    orderBy: { position: "asc" },
    take: 32,
  },
  recipeCuisine: {
    select: { cuisine: { select: { title: true } } },
    take: 3,
  },
  recipeDietType: {
    where: { dietType: { isPublished: true } },
    select: { dietType: { select: { title: true } } },
    take: 3,
  },
  recipeRecipeType: {
    where: { recipeType: { isPublished: true } },
    select: { recipeType: { select: { title: true } } },
    take: 3,
  },
  recipeNutrient: {
    where: { nutrient: { isPublished: true } },
    select: { nutrient: { select: { title: true } } },
    take: 2,
  },
  recipeSeasons: {
    select: { title: true },
  },
  recipeSeasonTags: {
    select: { season: { select: { title: true } } },
    take: 3,
  },
  recipeDifficulty: {
    select: { title: true },
  },
  recipeDifficulties: {
    select: { difficulty: { select: { title: true } } },
    take: 2,
  },
  recipeMealTime: {
    select: { mealTime: { select: { title: true } } },
    take: 3,
  },
  Review: { select: { rating: true } },
  recipeCookingTime: {
    select: {
      prepTime: true,
      cookTime: true,
      restTime: true,
    },
  },
} satisfies Prisma.RecipesSelect;

type SearchRecipeCandidate = Prisma.RecipesGetPayload<{
  select: typeof searchRecipeSelect;
}>;

function fieldMatches(tokens: string[]): Prisma.RecipesWhereInput[] {
  return tokens.flatMap((term) => [
    { title: { contains: term } },
    { slug: { contains: term } },
    { metaTitle: { contains: term } },
    { metaDescription: { contains: term } },
    { description: { contains: term } },
    { RecipeCategories: { name: { contains: term } } },
    {
      recipeIngredients: { some: { ingredient: { name: { contains: term } } } },
    },
    { recipeMealTime: { some: { mealTime: { title: { contains: term } } } } },
    { recipeCuisine: { some: { cuisine: { title: { contains: term } } } } },
    {
      recipeDietType: {
        some: { dietType: { isPublished: true, title: { contains: term } } },
      },
    },
    {
      recipeRecipeType: {
        some: { recipeType: { isPublished: true, title: { contains: term } } },
      },
    },
    {
      recipeNutrient: {
        some: { nutrient: { isPublished: true, title: { contains: term } } },
      },
    },
    { recipeSeasons: { title: { contains: term } } },
    { recipeSeasonTags: { some: { season: { title: { contains: term } } } } },
    { recipeDifficulty: { title: { contains: term } } },
    {
      recipeDifficulties: {
        some: { difficulty: { title: { contains: term } } },
      },
    },
  ]);
}

function articleFieldMatches(tokens: string[]): Prisma.PostWhereInput[] {
  return tokens.flatMap((term) => [
    { title: { contains: term } },
    { metaDescription: { contains: term } },
    { content: { contains: term } },
    {
      PostCategory: {
        some: { category: { isPublished: true, title: { contains: term } } },
      },
    },
    {
      PostTag: {
        some: { tag: { isPublished: true, title: { contains: term } } },
      },
    },
  ]);
}

function scoreRecipe(
  recipe: SearchRecipeCandidate,
  query: string,
  tokens: string[],
  coverageGroups: string[][],
) {
  const title = normalize(recipe.title);
  const category = normalize(recipe.RecipeCategories?.name || "");
  const ingredients = normalize(
    recipe.recipeIngredients.map((item) => item.ingredient.name).join(" "),
  );
  const cuisines = normalize(
    recipe.recipeCuisine.map((item) => item.cuisine.title).join(" "),
  );
  const mealtimes = normalize(
    recipe.recipeMealTime.map((item) => item.mealTime.title).join(" "),
  );
  const types = normalize(
    recipe.recipeRecipeType.map((item) => item.recipeType.title).join(" "),
  );
  const diets = normalize(
    recipe.recipeDietType.map((item) => item.dietType.title).join(" "),
  );
  const nutrients = normalize(
    recipe.recipeNutrient.map((item) => item.nutrient.title).join(" "),
  );
  const seasons = normalize(
    [
      recipe.recipeSeasons?.title,
      ...recipe.recipeSeasonTags.map((item) => item.season.title),
    ].join(" "),
  );
  const difficulties = normalize(
    [
      recipe.recipeDifficulty?.title,
      ...recipe.recipeDifficulties.map((item) => item.difficulty.title),
    ].join(" "),
  );
  const description = normalize(recipe.description || "");
  const searchableText = [
    title,
    category,
    ingredients,
    cuisines,
    mealtimes,
    types,
    diets,
    nutrients,
    seasons,
    difficulties,
    description,
  ].join(" ");
  const normalizedQuery = normalize(query);
  let score = Math.min(recipe.views || 0, 120) / 24;

  if (title === normalizedQuery) score += 260;
  if (title.startsWith(normalizedQuery)) score += 150;
  if (title.includes(normalizedQuery)) score += 115;
  if (ingredients.includes(normalizedQuery)) score += 86;

  tokens.forEach((token) => {
    if (title.split(" ").includes(token)) score += 42;
    else if (title.includes(token)) score += 30;
    if (ingredients.includes(token)) score += 24;
    if (cuisines.includes(token)) score += 20;
    if (mealtimes.includes(token)) score += 19;
    if (category.includes(token)) score += 18;
    if (types.includes(token)) score += 14;
    if (diets.includes(token)) score += 12;
    if (nutrients.includes(token)) score += 11;
    if (seasons.includes(token)) score += 16;
    if (difficulties.includes(token)) score += 15;
  });

  const matchedCoverageGroups = coverageGroups.filter((group) =>
    group.some((token) => searchableText.includes(token)),
  );
  if (coverageGroups.length > 0) {
    const coverage = matchedCoverageGroups.length / coverageGroups.length;
    score += coverage * 90;
    if (coverage === 1) score += coverageGroups.length * 22;
    if (matchedCoverageGroups.length === 0) score -= 120;
  }

  return score;
}

function matchesRequiredRecipeGroups(
  recipe: SearchRecipeCandidate,
  requiredGroups: string[][],
) {
  if (requiredGroups.length === 0) return true;

  const searchableText = normalize(
    [
      recipe.title,
      recipe.RecipeCategories?.name,
      ...recipe.recipeIngredients.map((item) => item.ingredient.name),
      ...recipe.recipeCuisine.map((item) => item.cuisine.title),
      ...recipe.recipeMealTime.map((item) => item.mealTime.title),
      ...recipe.recipeRecipeType.map((item) => item.recipeType.title),
      ...recipe.recipeDietType.map((item) => item.dietType.title),
      ...recipe.recipeNutrient.map((item) => item.nutrient.title),
      recipe.recipeSeasons?.title,
      ...recipe.recipeSeasonTags.map((item) => item.season.title),
      recipe.recipeDifficulty?.title,
      ...recipe.recipeDifficulties.map((item) => item.difficulty.title),
    ]
      .filter(Boolean)
      .join(" "),
  );

  return requiredGroups.every((group) =>
    group.some((token) => searchableText.includes(token)),
  );
}

async function searchCandidates(tokens: string[], take = 260) {
  if (tokens.length === 0) return [];

  const chunks = tokenChunks(tokens.slice(0, 24), 3);
  const rows = await Promise.all(
    chunks.map((chunk) =>
      db.recipes.findMany({
        where: {
          ...publishedRecipeWhere(),
          imageUrl: { not: null },
          OR: fieldMatches(chunk),
        },
        select: searchRecipeSelect,
        orderBy: { views: "desc" },
        take: Math.max(40, Math.ceil(take / chunks.length) + 12),
      }),
    ),
  );

  return Array.from(
    new Map(rows.flat().map((recipe) => [recipe.id, recipe])).values(),
  ).slice(0, take);
}

async function exactPhraseCandidates(query: string) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [];
  const slugQuery = normalizedQuery.replace(/\s+/g, "-");

  return db.recipes.findMany({
    where: {
      ...publishedRecipeWhere(),
      imageUrl: { not: null },
      OR: [
        { title: { contains: normalizedQuery } },
        { slug: { contains: slugQuery } },
        { metaTitle: { contains: normalizedQuery } },
        {
          recipeIngredients: {
            some: { ingredient: { name: { contains: normalizedQuery } } },
          },
        },
      ],
    },
    select: searchRecipeSelect,
    orderBy: { views: "desc" },
    take: 40,
  });
}

async function rankedRecipeCandidates(query: string, take = 260) {
  const intent = await buildSearchIntent(query);
  const [phraseRecipeGroups, broadRecipes] = await Promise.all([
    Promise.all(
      intent.phraseQueries.map((phrase) => exactPhraseCandidates(phrase)),
    ),
    searchCandidates(intent.tokens, take),
  ]);
  const phraseRecipes = phraseRecipeGroups.flat();
  const recipes = Array.from(
    new Map(
      [...phraseRecipes, ...broadRecipes].map((recipe) => [recipe.id, recipe]),
    ).values(),
  );
  const filteredRecipes = intent.isFastingIntent
    ? recipes
        .filter(isFastingFriendlyRecipe)
        .filter((recipe) =>
          matchesRequiredRecipeGroups(recipe, intent.requiredRecipeGroups),
        )
    : recipes;

  return filteredRecipes
    .map((recipe) => ({
      recipe: {
        ...recipe,
        fastingFriendly: intent.isFastingIntent && isFastingFriendlyRecipe(recipe),
      },
      score: scoreRecipe(recipe, query, intent.tokens, intent.coverageGroups),
    }))
    .filter((item) => item.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.recipe.views - left.recipe.views ||
        left.recipe.title.localeCompare(right.recipe.title),
    );
}

export const GetSearchedRecipes = async ({
  k,
}: SearchInput): Promise<RecipeCardRecipe[]> => {
  const query = k?.trim();
  if (!query) return [];

  try {
    const recipes = await rankedRecipeCandidates(query);

    return recipes.map(({ recipe }) => recipe);
  } catch (error) {
    console.error("[SEARCH_RECIPES]", error);
    return [];
  }
};

export const GetSearchedRecipePage = async ({
  k,
  cursor,
  limit = 12,
}: SearchPageInput): Promise<SearchedRecipePage> => {
  const query = k?.trim();
  if (!query) return { recipes: [], nextCursor: null };

  try {
    const ranked = await rankedRecipeCandidates(query, 340);
    const startIndex = cursor
      ? Math.max(ranked.findIndex((item) => item.recipe.id === cursor) + 1, 0)
      : 0;
    const visibleRecipes = ranked
      .slice(startIndex, startIndex + limit)
      .map(({ recipe }) => recipe);
    const hasMore = startIndex + limit < ranked.length;

    return {
      recipes: visibleRecipes,
      nextCursor: hasMore ? visibleRecipes.at(-1)?.id || null : null,
    };
  } catch (error) {
    console.error("[SEARCH_RECIPE_PAGE]", error);
    return { recipes: [], nextCursor: null };
  }
};

export const GetExactRecipeSearchMatch = async ({
  k,
}: SearchInput): Promise<ExactRecipeSearchMatch | null> => {
  const query = k?.trim();
  if (!query) return null;

  try {
    const normalizedQuery = normalize(query);
    const matches = await exactPhraseCandidates(query);
    const exactMatch = matches.find(
      (recipe) => normalize(recipe.title) === normalizedQuery,
    );

    if (!exactMatch) return null;

    return {
      title: exactMatch.title,
      href: recipeHref(exactMatch),
    };
  } catch (error) {
    console.error("[EXACT_RECIPE_SEARCH_MATCH]", error);
    return null;
  }
};

export const GetSearchedArticles = async ({
  k,
  limit = 4,
}: SearchInput & { limit?: number }): Promise<SearchedArticle[]> => {
  const query = k?.trim();
  if (!query) return [];

  try {
    const intent = await buildSearchIntent(query);
    if (intent.isFastingIntent) return [];

    return await db.post.findMany({
      where: {
        isPublished: true,
        imageUrl: { not: null },
        OR: articleFieldMatches(intent.tokens),
      },
      select: {
        id: true,
        title: true,
        metaDescription: true,
        imageUrl: true,
        slug: true,
        metaSlug: true,
        updatedAt: true,
        PostCategory: {
          select: { category: { select: { title: true, slug: true } } },
        },
        PostTag: { select: { tag: { select: { title: true, slug: true } } } },
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
  } catch (error) {
    console.error("[SEARCH_ARTICLES]", error);
    return [];
  }
};

export const GetRecipeSearchSuggestions = async ({
  k,
}: SearchInput): Promise<RecipeSearchSuggestion[]> => {
  const query = k?.trim();
  if (!query || query.length < 2) return [];

  try {
    const intent = await buildSearchIntent(query);
    const containsAny = intent.tokens.map((token) => ({ contains: token }));
    const [
      rankedRecipes,
      ingredients,
      cuisines,
      mealTimes,
      categories,
      recipeTypes,
      articles,
    ] = await Promise.all([
      rankedRecipeCandidates(query, 120),
      db.ingredients.findMany({
        where: { OR: containsAny.map((name) => ({ name })) },
        select: { name: true },
        take: 3,
      }),
      db.cuisines.findMany({
        where: {
          isPublished: true,
          OR: containsAny.map((title) => ({ title })),
        },
        select: { title: true },
        take: 2,
      }),
      db.mealTimes.findMany({
        where: {
          isPublished: true,
          OR: containsAny.map((title) => ({ title })),
        },
        select: { title: true },
        take: 2,
      }),
      db.recipeCategories.findMany({
        where: { isPublished: true, OR: containsAny.map((name) => ({ name })) },
        select: { name: true },
        take: 2,
      }),
      db.recipeTypes.findMany({
        where: {
          isPublished: true,
          OR: containsAny.map((title) => ({ title })),
        },
        select: { title: true },
        take: 2,
      }),
      db.post.findMany({
        where: {
          isPublished: true,
          OR: articleFieldMatches(intent.tokens),
        },
        select: { title: true, slug: true, metaSlug: true, imageUrl: true },
        orderBy: { updatedAt: "desc" },
        take: 2,
      }),
    ]);
    const normalizedQuery = normalize(query);
    const visibleArticles = intent.isFastingIntent ? [] : articles;
    const visibleIngredients = intent.isFastingIntent
      ? ingredients.filter((item) => isFastingIngredientName(item.name))
      : ingredients.filter((item) => textMatchesSearchIntent(item.name, intent.tokens));
    const visibleMealTimes = intent.isFastingIntent
      ? []
      : mealTimes.filter((item) => textMatchesSearchIntent(item.title, intent.tokens));
    const visibleCuisines = intent.isFastingIntent
      ? []
      : cuisines.filter((item) => textMatchesSearchIntent(item.title, intent.tokens));
    const visibleCategories = intent.isFastingIntent
      ? []
      : categories.filter((item) => textMatchesSearchIntent(item.name, intent.tokens));
    const visibleRecipeTypes = intent.isFastingIntent
      ? []
      : recipeTypes.filter((item) => textMatchesSearchIntent(item.title, intent.tokens));
    const visibleStories = visibleArticles.filter((item) =>
      textMatchesSearchIntent(item.title, intent.tokens),
    );

    const suggestions: RecipeSearchSuggestion[] = [
      ...rankedRecipes.slice(0, 6).map(({ recipe, score }) => ({
        label: recipe.title,
        query: recipe.title,
        href: recipeHref(recipe),
        imageUrl: recipe.imageUrl,
        meta: [
          recipe.fastingFriendly ? "Vrat friendly" : null,
          recipe.RecipeCategories?.name,
          recipe.recipeCuisine[0]?.cuisine.title,
          recipe.recipeCookingTime
            ? `${recipe.recipeCookingTime.prepTime + recipe.recipeCookingTime.cookTime + recipe.recipeCookingTime.restTime} min`
            : null,
        ]
          .filter(Boolean)
          .join(" · "),
        score,
        isExact: normalize(recipe.title) === normalizedQuery,
        kind: "Dish" as const,
      })),
      ...visibleStories.map((item) => ({
        label: item.title,
        query: item.title,
        href: articleHref(item),
        imageUrl: item.imageUrl,
        meta: "Food story",
        kind: "Story" as const,
      })),
      ...visibleIngredients.map((item) => ({
        label: `${item.name} recipes`,
        query: item.name,
        kind: "Ingredient" as const,
      })),
      ...visibleMealTimes.map((item) => ({
        label: `${item.title} recipes`,
        query: item.title,
        kind: "Mealtime" as const,
      })),
      ...visibleCuisines.map((item) => ({
        label: `${item.title} recipes`,
        query: item.title,
        kind: "Cuisine" as const,
      })),
      ...visibleCategories.map((item) => ({
        label: `${item.name} recipes`,
        query: item.name,
        kind: "Preference" as const,
      })),
      ...visibleRecipeTypes.map((item) => ({
        label: `${item.title} recipes`,
        query: item.title,
        kind: "Collection" as const,
      })),
    ];
    const unique = new Map<string, RecipeSearchSuggestion>();

    suggestions.forEach((suggestion) => {
      const key = suggestion.label.toLowerCase();
      if (!unique.has(key)) unique.set(key, suggestion);
    });

    return Array.from(unique.values()).slice(0, 8);
  } catch (error) {
    console.error("[SEARCH_SUGGESTIONS]", error);
    return [];
  }
};
