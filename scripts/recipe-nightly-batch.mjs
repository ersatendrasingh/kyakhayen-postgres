import fs from "node:fs/promises";
import path from "node:path";

import nextEnv from "@next/env";
import { PrismaClient } from "@prisma/client";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const db = new PrismaClient();

const DEFAULT_LIMIT = 25;
const DEFAULT_POOL = 350;
const DEFAULT_OUTPUT_DIR = "docs/recipe-nightly-batches";

const GENERIC_COPY_PATTERNS = [
  /\bcarefully chosen everyday ingredients\b/i,
  /\blisted ingredients\b/i,
  /\bremaining listed ingredients\b/i,
  /\blisted cooking method\b/i,
  /\bCook with the ingredient list\b/i,
  /\btags on Kya Khayen help\b/i,
  /\bThis recipe story is being prepared\b/i,
  /\bhome-style preparation\b/i,
  /\bstep-by-step home cooking\b/i,
];

const SUPPORTING_INGREDIENTS =
  /\b(oil|ghee|butter|salt|pepper|chilli|chili|turmeric|cumin|water|ginger|garlic)\b/i;

function argValue(name, fallback) {
  const exact = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  if (exact) return exact.slice(name.length + 3);

  const index = process.argv.indexOf(`--${name}`);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];

  return fallback;
}

function numericArg(name, fallback) {
  const parsed = Number(argValue(name, fallback));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function cleanText(value) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function wordCount(value) {
  return cleanText(value).split(/\s+/).filter(Boolean).length;
}

function displayIngredient(value) {
  return cleanText(value)
    .replace(/,\s*raw(?:,.*)?$/i, "")
    .replace(/,\s*(?:big|ripe|fresh)(?:,.*)?$/i, "")
    .replace(/\s*-\s*all varieties$/i, "")
    .toLowerCase();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function listText(values, fallback) {
  const items = unique(values.map(cleanText));
  if (items.length === 0) return fallback;
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function siteUrl() {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://www.kyakhayen.com";
  try {
    const parsed = new URL(configured);
    if (["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(parsed.hostname)) {
      return "https://www.kyakhayen.com";
    }
    return parsed.origin.replace(/\/+$/, "");
  } catch {
    return "https://www.kyakhayen.com";
  }
}

function recipePath(recipe) {
  const slug = recipe.slug;
  const metaSlug = recipe.metaSlug;
  if (!metaSlug || metaSlug === slug) return `/${slug}`;
  return metaSlug.startsWith(`${slug}-`)
    ? `/${metaSlug}`
    : `/${slug}-${metaSlug}`;
}

function familyOf(recipe) {
  const signal = [
    recipe.title,
    recipe.RecipeCategories?.name,
    ...recipe.recipeRecipeType.map((item) => item.recipeType.title),
    ...recipe.recipeCookingMethods.map((item) => item.cookingMethod.title),
  ]
    .join(" ")
    .toLowerCase();

  if (/\b(juice|smoothie|shake|drink|beverage|tea|coffee|chai)\b/.test(signal)) return "drink";
  if (/\b(salad|chaat|fruit|curd|yogurt)\b/.test(signal)) return "fresh";
  if (/\b(soup|broth|shorba)\b/.test(signal)) return "soup";
  if (/\b(chutney|dip|raita)\b/.test(signal)) return "dip";
  if (/\b(roti|chapati|paratha|dosa|cheela|chilla|pancake|bread)\b/.test(signal)) return "bread";
  if (/\b(curry|sabzi|shaak|dal|khichdi|stew|gravy)\b/.test(signal)) return "main";
  if (/\b(kabab|kebab|cutlet|tikki|pakoda|snack|dhokla|idli)\b/.test(signal)) return "snack";
  if (/\b(halwa|kheer|ladoo|laddu|dessert|sweet)\b/.test(signal)) return "sweet";
  return "general";
}

function primaryIngredients(recipe) {
  const ingredients = recipe.recipeIngredients
    .map((item) => displayIngredient(item.ingredient.name))
    .filter((name) => name && !SUPPORTING_INGREDIENTS.test(name));

  return unique(ingredients).slice(0, 5);
}

function qualitySignals(recipe) {
  const description = cleanText(recipe.description);
  const methodText = recipe.recipeMethods
    .map((method) => cleanText(method.description || method.title))
    .join(" ");
  const descriptionWords = wordCount(recipe.description);
  const methodWords = wordCount(methodText);
  const genericDescription = GENERIC_COPY_PATTERNS.some((pattern) =>
    pattern.test(description),
  );
  const genericMethods = GENERIC_COPY_PATTERNS.some((pattern) =>
    pattern.test(methodText),
  );
  const weakMethods =
    recipe.recipeMethods.length === 0 ||
    methodWords < Math.max(80, recipe.recipeMethods.length * 22);

  return {
    descriptionWords,
    methodWords,
    genericDescription,
    genericMethods,
    weakMethods,
    missingImage: !recipe.imageUrl,
    missingMeta: !recipe.metaDescription || wordCount(recipe.metaDescription) < 12,
    noEngagement: recipe.Review.length === 0 && recipe.recipeComments.length === 0,
    ingredientCount: recipe.recipeIngredients.length,
    methodCount: recipe.recipeMethods.length,
  };
}

function priorityScore(recipe, signals) {
  let score = 0;

  if (!recipe.contentUpdatedAt) score += 60;
  if (signals.descriptionWords < 120) score += 40;
  else if (signals.descriptionWords < 220) score += 25;
  if (signals.genericDescription) score += 35;
  if (signals.genericMethods) score += 30;
  if (signals.weakMethods) score += 25;
  if (signals.missingImage) score += 12;
  if (signals.missingMeta) score += 12;
  if (signals.noEngagement) score += 8;
  if (signals.ingredientCount > 0) score += 8;
  score += Math.min(35, Math.log10(Math.max(recipe.views, 0) + 10) * 10);

  return Math.round(score);
}

function uniqueAngle(recipe, family, ingredients) {
  const cuisine = recipe.recipeCuisine[0]?.cuisine.title;
  const category = recipe.RecipeCategories?.name;
  const time = recipe.recipeCookingTime;
  const totalTime = (time?.prepTime || 0) + (time?.cookTime || 0) + (time?.restTime || 0);
  const ingredientText = listText(ingredients.slice(0, 3), "the main ingredients");
  const context = [cuisine, category].filter(Boolean).join(" ");

  if (family === "drink") {
    return `Focus on freshness, balance and when to serve ${recipe.title}; explain how ${ingredientText} affect body, aroma and sweetness.`;
  }
  if (family === "bread") {
    return `Focus on dough or batter feel, pan heat and softness; explain how ${ingredientText} change texture.`;
  }
  if (family === "main") {
    return `Focus on masala timing, tenderness and serving plate fit; connect ${ingredientText} with the ${context || "home meal"} context.`;
  }
  if (family === "fresh") {
    return `Focus on clean preparation, freshness and texture; make this useful beyond a simple ingredient list.`;
  }
  if (family === "snack") {
    return `Focus on shape, crispness or softness, and how to avoid greasy or dry results.`;
  }
  if (family === "sweet") {
    return `Focus on sweetness control, texture cues and portioning; explain how to avoid over-thick or overly sweet results.`;
  }
  if (totalTime > 0 && totalTime <= 20) {
    return `Position this as a quick practical recipe, but add real cooking cues so it does not read like thin content.`;
  }
  return `Build a specific cooking story around ${ingredientText}, timing, texture and serving context.`;
}

function sectionBriefs(recipe, family, ingredients) {
  const title = recipe.title;
  const ingredientText = listText(ingredients.slice(0, 4), "the actual listed ingredients");
  const technique =
    recipe.recipeCookingMethods[0]?.cookingMethod.title?.toLowerCase() ||
    (family === "drink"
      ? "blending or brewing"
      : family === "fresh"
        ? "fresh assembly"
        : "controlled cooking");

  return [
    `Why this recipe works: write 2 short paragraphs explaining the role of ${ingredientText}, the cooking technique (${technique}), and the expected final texture.`,
    `Chef Tips: write 4 tips that mention exact cues for ${title}, such as heat level, consistency, timing, aroma, colour or resting.`,
    `Common Mistakes: write 4 mistakes specific to this recipe. Avoid generic lines like "do not overcook" unless you explain what overcooking looks like here.`,
    `Serving Suggestions: write 3 practical pairings based on meal type, cuisine, texture contrast and portion size.`,
    `Storage Instructions: write realistic storage guidance. If it is fresh or drink-like, prefer same-day serving. If cooked, include cooling and reheating notes.`,
    `Variations: write 3-4 variations using believable swaps, spice changes, texture changes or lighter/richer versions.`,
    `FAQs: write 6 questions. Include make-ahead, texture fix, substitution, spice control, serving, and beginner difficulty. Answers must mention ${title} naturally.`,
  ];
}

function markdownRecipe(entry, index) {
  const { recipe, family, ingredients, signals, score, angle } = entry;
  const flags = [
    signals.genericDescription && "generic description",
    signals.genericMethods && "generic methods",
    signals.weakMethods && "weak methods",
    signals.descriptionWords < 220 && `short overview (${signals.descriptionWords} words)`,
    signals.missingImage && "missing image",
    signals.missingMeta && "weak meta description",
  ].filter(Boolean);

  return [
    `## ${index + 1}. ${recipe.title}`,
    "",
    `- URL: ${siteUrl()}${recipePath(recipe)}`,
    `- Recipe ID: ${recipe.id}`,
    `- Priority score: ${score}`,
    `- Family: ${family}`,
    `- Views: ${recipe.views}`,
    `- Last content update: ${recipe.contentUpdatedAt ? recipe.contentUpdatedAt.toISOString() : "never"}`,
    `- Main ingredients: ${listText(ingredients, "not enough clear ingredient signals")}`,
    `- Quality flags: ${flags.length ? flags.join(", ") : "none"}`,
    "",
    `Unique angle: ${angle}`,
    "",
    "Human edit brief:",
    ...sectionBriefs(recipe, family, ingredients).map((item) => `- ${item}`),
    "",
    "Do not do:",
    "- Do not paste the same paragraph pattern used on other recipes.",
    "- Do not write SEO/process talk like ranking, keywords, database entry or search terms.",
    "- Do not add health claims unless the ingredient data and editorial review support it.",
    "- Do not invent cooking steps that conflict with the ingredient list or method.",
    "",
  ].join("\n");
}

function jsonEntry(entry) {
  const { recipe, family, ingredients, signals, score, angle } = entry;
  return {
    id: recipe.id,
    title: recipe.title,
    url: `${siteUrl()}${recipePath(recipe)}`,
    slug: recipe.slug,
    priorityScore: score,
    family,
    views: recipe.views,
    contentUpdatedAt: recipe.contentUpdatedAt,
    ingredients,
    qualitySignals: signals,
    uniqueAngle: angle,
    sectionBriefs: sectionBriefs(recipe, family, ingredients),
  };
}

function selectBatch(candidates, limit) {
  const selected = [];
  const categoryCounts = new Map();
  const familyCounts = new Map();

  for (const entry of candidates) {
    const category = entry.recipe.RecipeCategories?.slug || "uncategorized";
    const categoryCount = categoryCounts.get(category) || 0;
    const familyCount = familyCounts.get(entry.family) || 0;

    if (categoryCount >= 4 || familyCount >= 7) continue;

    selected.push(entry);
    categoryCounts.set(category, categoryCount + 1);
    familyCounts.set(entry.family, familyCount + 1);

    if (selected.length >= limit) break;
  }

  return selected;
}

async function main() {
  const limit = numericArg("limit", DEFAULT_LIMIT);
  const pool = numericArg("pool", DEFAULT_POOL);
  const outputDir = argValue("out", DEFAULT_OUTPUT_DIR);
  const today = new Date().toISOString().slice(0, 10);

  const recipes = await db.recipes.findMany({
    where: { isPublished: true },
    include: {
      RecipeCategories: true,
      recipeCookingTime: true,
      recipeIngredients: {
        include: {
          ingredient: true,
          unit: true,
          ingredientForm: true,
        },
        orderBy: { position: "asc" },
      },
      recipeMethods: {
        where: { isPublished: true },
        orderBy: { position: "asc" },
      },
      recipeCookingMethods: {
        include: { cookingMethod: true },
      },
      recipeCuisine: {
        include: { cuisine: true },
      },
      recipeRecipeType: {
        include: { recipeType: true },
      },
      Review: {
        where: { isPublished: true },
        select: { id: true, rating: true, comment: true },
        take: 5,
      },
      recipeComments: {
        where: { isPublished: true },
        select: { id: true },
        take: 5,
      },
    },
    orderBy: [
      { contentUpdatedAt: "asc" },
      { views: "desc" },
      { updatedAt: "asc" },
    ],
    take: pool,
  });

  const ranked = recipes
    .map((recipe) => {
      const family = familyOf(recipe);
      const ingredients = primaryIngredients(recipe);
      const signals = qualitySignals(recipe);
      const score = priorityScore(recipe, signals);
      return {
        recipe,
        family,
        ingredients,
        signals,
        score,
        angle: uniqueAngle(recipe, family, ingredients),
      };
    })
    .sort((left, right) => right.score - left.score || right.recipe.views - left.recipe.views);

  const selected = selectBatch(ranked, limit);
  const outputPath = path.join(process.cwd(), outputDir);
  await fs.mkdir(outputPath, { recursive: true });

  const markdown = [
    `# Recipe Nightly Content Batch - ${today}`,
    "",
    `Batch size: ${selected.length}`,
    `Candidate pool: ${recipes.length}`,
    "",
    "Goal: update these recipes with specific, human-edited content. Use the brief as direction, not as final copy.",
    "",
    ...selected.map(markdownRecipe),
  ].join("\n");
  const json = JSON.stringify(selected.map(jsonEntry), null, 2);

  const markdownFile = path.join(outputPath, `${today}.md`);
  const jsonFile = path.join(outputPath, `${today}.json`);

  await fs.writeFile(markdownFile, markdown, "utf8");
  await fs.writeFile(jsonFile, json, "utf8");

  console.log(`Created nightly recipe batch with ${selected.length} recipes.`);
  console.log(`Markdown: ${markdownFile}`);
  console.log(`JSON: ${jsonFile}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
