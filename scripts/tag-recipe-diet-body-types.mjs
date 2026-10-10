import fs from "node:fs/promises";
import path from "node:path";

import nextEnv from "@next/env";
import { PrismaClient } from "@prisma/client";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const db = new PrismaClient();

const APPLY = process.argv.includes("--apply");
const ONLY_MISSING = !process.argv.includes("--include-tagged");
const PUBLISHED_ONLY = process.argv.includes("--published-only");
const OUT_DIR = "docs/recipe-tagging-reports";

const SUPPORTING = /\b(water|salt|rock salt|black salt|oil|ghee|butter|pepper|chilli|chili|turmeric|cumin|coriander|ginger|garlic|asafoetida|hing)\b/i;
const ANIMAL_MEAT = /\b(chicken|mutton|lamb|beef|pork|fish|prawn|shrimp|tuna|salmon|meat|keema)\b/i;
const EGG = /\begg\b/i;
const DAIRY = /\b(milk|curd|yogurt|yoghurt|paneer|cheese|cream|butter|ghee|whey|buttermilk|lassi)\b/i;
const GLUTEN = /\b(wheat|atta|maida|semolina|sooji|suji|rava|bread|pasta|noodle|barley|rye|seitan|wrap|bun|pav|toast)\b/i;
const SWEET = /\b(sugar|jaggery|honey|syrup|chocolate|sweet|halwa|kheer|ladoo|laddu|dessert|shrikhand|katli|balushahi|muffin|cake|jalebi|barfi|burfi|peda)\b/i;
const FRIED = /\b(deep fry|deep-fry|fried|frying|pakoda|samosa|vada pav|vada|puri|poori|bhatura)\b/i;
const PROTEIN = /\b(dal|lentil|bean|chana|chickpea|rajma|soy|soya|tofu|paneer|egg|chicken|fish|sprout|peanut)\b/i;
const WHOLE_FOOD = /\b(vegetable|fruit|salad|soup|dal|lentil|millet|bajra|jowar|ragi|oats|brown rice|quinoa|sprout|beans|greens|spinach|methi|lauki|bottle gourd|carrot|cucumber|beetroot)\b/i;
const HONEY = /\bhoney\b/i;
const HIGH_CARB = /\b(rice|wheat|atta|maida|bread|pasta|noodle|semolina|sooji|suji|rava|barley|oats|poha|sabudana|potato|sweet potato|banana|mango|corn|sugar|jaggery|honey|ladoo|laddu|halwa|kheer|muffin|cake|kulcha|paratha|roti|puri|poori|samosa|kachori)\b/i;
const KETO_FRIENDLY = /\b(paneer|tofu|egg|chicken|fish|mutton|prawn|shrimp|cheese|cream|butter|ghee|coconut|avocado|cauliflower|cabbage|spinach|mushroom|baingan|brinjal|cucumber|zucchini)\b/i;
const MEDITERRANEAN = /\b(olive|basil|parsley|oregano|hummus|feta|parmesan|mediterranean)\b/i;

const VATA_POSITIVE = /\b(rice|wheat|atta|oats|khichdi|dal|lentil|milk|curd|yogurt|paneer|ghee|butter|sweet potato|potato|carrot|beetroot|banana|mango|date|almond|cashew|soup|stew|porridge|warm|cooked)\b/i;
const PITTA_POSITIVE = /\b(cucumber|coconut|mint|coriander|fennel|milk|curd|yogurt|paneer|rice|sweet fruit|melon|watermelon|pear|apple|salad|raita|coconut water|bottle gourd|lauki)\b/i;
const PITTA_NEGATIVE = /\b(chilli|chili|garlic|ginger|mustard oil|pickle|vinegar|deep fry|fried|tomato)\b/i;
const KAPHA_POSITIVE = /\b(millet|bajra|jowar|ragi|barley|sprout|bean|lentil|dal|chana|methi|spinach|greens|ginger|black pepper|chilli|turmeric|cabbage|cauliflower|soup|roast|grill|steam|boil)\b/i;
const KAPHA_NEGATIVE = /\b(sugar|jaggery|honey|cream|cheese|butter|ghee|deep fry|fried|banana|mango|potato|rice|sweet)\b/i;

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function words(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function has(text, pattern) {
  return pattern.test(text);
}

function addIfAvailable(assignments, taxonomyBySlug, aliases, reason) {
  for (const alias of aliases) {
    const tag = taxonomyBySlug.get(alias);
    if (tag) {
      assignments.set(tag.id, { id: tag.id, title: tag.title, slug: tag.slug, reason });
      return true;
    }
  }
  return false;
}

function taxonomyMap(items) {
  const map = new Map();
  for (const item of items) {
    map.set(normalize(item.slug), item);
    map.set(normalize(item.title), item);
  }
  return map;
}

function recipeText(recipe) {
  const ingredients = recipe.recipeIngredients
    .map((item) => item.ingredient.name)
    .join(" ");
  const methods = recipe.recipeCookingMethods
    .map((item) => item.cookingMethod.title)
    .join(" ");
  const types = recipe.recipeRecipeType
    .map((item) => item.recipeType.title)
    .join(" ");
  const cuisines = recipe.recipeCuisine
    .map((item) => item.cuisine.title)
    .join(" ");

  return words([
    recipe.title,
    recipe.slug,
    recipe.RecipeCategories?.name,
    ingredients,
    methods,
    types,
    cuisines,
  ].join(" "));
}

function meaningfulIngredients(recipe) {
  return recipe.recipeIngredients
    .map((item) => words(item.ingredient.name))
    .filter((name) => name && !SUPPORTING.test(name));
}

function classifyDiet(recipe, dietBySlug) {
  const assignments = new Map();
  const text = recipeText(recipe);
  const ingredients = meaningfulIngredients(recipe).join(" ");
  const category = normalize(recipe.RecipeCategories?.slug || recipe.RecipeCategories?.name || "");
  const hasMeat = has(text, ANIMAL_MEAT);
  const hasEgg = has(text, EGG);
  const hasDairy = has(text, DAIRY);
  const hasHoney = has(text, HONEY);
  const hasGluten = has(text, GLUTEN);
  const isFried = has(text, FRIED);
  const isSweet = has(text, SWEET);

  if (!hasMeat && !hasEgg) {
    addIfAvailable(assignments, dietBySlug, ["vegetarian", "veg"], "No meat or egg signal detected.");
  }

  if (!hasMeat && !hasEgg && !hasDairy && !hasHoney) {
    addIfAvailable(assignments, dietBySlug, ["vegan"], "No meat, egg or dairy signal detected.");
  }

  if (!hasDairy) {
    addIfAvailable(assignments, dietBySlug, ["lactose-free", "dairy-free"], "No milk, curd, paneer, cheese, cream, butter or ghee signal detected.");
  }

  if (hasEgg && !hasMeat) {
    addIfAvailable(assignments, dietBySlug, ["eggetarian", "egg"], "Egg is present without meat/fish signals.");
  }

  if (hasMeat) {
    addIfAvailable(assignments, dietBySlug, ["non-veg", "non-vegetarian", "non-vegitarian"], "Meat or fish signal detected.");
  }

  if (!hasGluten) {
    addIfAvailable(assignments, dietBySlug, ["gluten-free", "gluten free"], "No wheat/maida/bread/pasta gluten signal detected.");
  }

  if (has(ingredients, PROTEIN) && !isSweet) {
    addIfAvailable(assignments, dietBySlug, ["high-protein", "protein-rich", "protein rich", "gym"], "Protein ingredient signal detected.");
  }

  if (has(text, WHOLE_FOOD) && !isFried && !isSweet) {
    addIfAvailable(assignments, dietBySlug, ["healthy", "balanced"], "Whole-food signal without fried or dessert signal.");
  }

  if (has(text, MEDITERRANEAN) || category === "mediterranean") {
    addIfAvailable(assignments, dietBySlug, ["mediterranean"], "Mediterranean ingredient/cuisine signal detected.");
  }

  if ((has(text, /\b(keto|low carb|low-carb)\b/i) || has(ingredients, KETO_FRIENDLY)) && !has(text, HIGH_CARB) && !isSweet) {
    addIfAvailable(assignments, dietBySlug, ["low-carb", "low carb", "keto"], "Low-carb compatible ingredient signals detected.");
  }

  return [...assignments.values()];
}

function scoreBody(recipe) {
  const text = recipeText(recipe);
  const ingredients = meaningfulIngredients(recipe).join(" ");
  const combined = `${text} ${ingredients}`;
  const scores = {
    vata: 0,
    pitta: 0,
    kapha: 0,
  };
  const reasons = {
    vata: [],
    pitta: [],
    kapha: [],
  };

  if (has(combined, VATA_POSITIVE)) {
    scores.vata += 3;
    reasons.vata.push("warm/grounding cooked ingredients");
  }
  if (has(combined, PITTA_POSITIVE)) {
    scores.pitta += 3;
    reasons.pitta.push("cooling/mild ingredients");
  }
  if (has(combined, KAPHA_POSITIVE)) {
    scores.kapha += 3;
    reasons.kapha.push("light/spiced/legume or millet signals");
  }
  if (has(combined, PITTA_NEGATIVE)) {
    scores.pitta -= 2;
    reasons.pitta.push("reduced because heating/spicy signal is present");
  }
  if (has(combined, KAPHA_NEGATIVE)) {
    scores.kapha -= 2;
    reasons.kapha.push("reduced because heavy/sweet/fried signal is present");
  }
  if (has(combined, FRIED)) {
    scores.vata -= 1;
    scores.pitta -= 2;
    scores.kapha -= 2;
  }
  if (has(combined, SWEET)) {
    scores.vata += 1;
    scores.pitta += 1;
    scores.kapha -= 2;
  }

  return { scores, reasons };
}

function classifyBody(recipe, bodyBySlug) {
  const assignments = new Map();
  const { scores, reasons } = scoreBody(recipe);
  const sorted = Object.entries(scores).sort((left, right) => right[1] - left[1]);
  const bestScore = sorted[0]?.[1] ?? 0;

  for (const [slug, score] of sorted) {
    if (score < 2) continue;
    if (bestScore - score > 2) continue;
    addIfAvailable(
      assignments,
      bodyBySlug,
      [slug],
      `${score} point match: ${reasons[slug].join("; ") || "ingredient and method signals"}.`,
    );
  }

  return [...assignments.values()];
}

function shouldProcess(recipe) {
  if (!ONLY_MISSING) return true;
  return recipe.recipeDietType.length === 0 || recipe.recipeBodyTypes.length === 0;
}

async function main() {
  const [dietTypes, bodyTypes, recipes] = await Promise.all([
    db.dietTypes.findMany({ where: { isPublished: true }, orderBy: [{ position: "asc" }, { title: "asc" }] }),
    db.bodyTypes.findMany({ where: { isPublished: true }, orderBy: [{ position: "asc" }, { title: "asc" }] }),
    db.recipes.findMany({
      where: PUBLISHED_ONLY ? { isPublished: true } : {},
      include: {
        RecipeCategories: true,
        recipeIngredients: { include: { ingredient: true }, orderBy: { position: "asc" } },
        recipeCookingMethods: { include: { cookingMethod: true } },
        recipeCuisine: { include: { cuisine: true } },
        recipeRecipeType: { include: { recipeType: true } },
        recipeDietType: { include: { dietType: true } },
        recipeBodyTypes: { include: { bodyType: true } },
      },
      orderBy: [{ title: "asc" }],
    }),
  ]);

  const dietBySlug = taxonomyMap(dietTypes);
  const bodyBySlug = taxonomyMap(bodyTypes);
  const report = [];
  let updated = 0;
  let dietAssignments = 0;
  let bodyAssignments = 0;

  for (const recipe of recipes.filter(shouldProcess)) {
    const diet = classifyDiet(recipe, dietBySlug);
    const body = classifyBody(recipe, bodyBySlug);
    const existingDietIds = new Set(recipe.recipeDietType.map((item) => item.dietTypeId));
    const existingBodyIds = new Set(recipe.recipeBodyTypes.map((item) => item.bodyTypeId));
    const newDiet = diet.filter((item) => !existingDietIds.has(item.id));
    const newBody = body.filter((item) => !existingBodyIds.has(item.id));

    report.push({
      id: recipe.id,
      title: recipe.title,
      slug: recipe.slug,
      existingDiet: recipe.recipeDietType.map((item) => item.dietType.title),
      existingBody: recipe.recipeBodyTypes.map((item) => item.bodyType.title),
      addDiet: newDiet.map((item) => ({ title: item.title, reason: item.reason })),
      addBody: newBody.map((item) => ({ title: item.title, reason: item.reason })),
      needsReview: newDiet.length === 0 || newBody.length === 0,
    });

    if (APPLY && (newDiet.length || newBody.length)) {
      await db.$transaction([
        ...newDiet.map((item) =>
          db.recipeDietType.create({
            data: { recipeId: recipe.id, dietTypeId: item.id },
          }),
        ),
        ...newBody.map((item) =>
          db.recipeBodyType.create({
            data: { recipeId: recipe.id, bodyTypeId: item.id },
          }),
        ),
      ]);
      updated += 1;
      dietAssignments += newDiet.length;
      bodyAssignments += newBody.length;
    }
  }

  await fs.mkdir(path.join(process.cwd(), OUT_DIR), { recursive: true });
  const date = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(process.cwd(), OUT_DIR, `diet-body-tagging-${date}.json`);
  await fs.writeFile(
    file,
    JSON.stringify({
      mode: APPLY ? "apply" : "dry-run",
      onlyMissing: ONLY_MISSING,
      publishedOnly: PUBLISHED_ONLY,
      recipesChecked: report.length,
      recipesWithSuggestedDiet: report.filter((item) => item.addDiet.length > 0).length,
      recipesWithSuggestedBody: report.filter((item) => item.addBody.length > 0).length,
      needsReview: report.filter((item) => item.needsReview).length,
      updated,
      dietAssignments,
      bodyAssignments,
      availableDietTypes: dietTypes.map((item) => ({ title: item.title, slug: item.slug })),
      availableBodyTypes: bodyTypes.map((item) => ({ title: item.title, slug: item.slug })),
      report,
    }, null, 2),
    "utf8",
  );

  console.log(`${APPLY ? "Applied" : "Prepared dry-run"} diet/body tagging.`);
  console.log(`Recipes checked: ${report.length}`);
  console.log(`Scope: ${PUBLISHED_ONLY ? "published recipes only" : "all recipes"}`);
  console.log(`Suggested diet tags: ${report.filter((item) => item.addDiet.length > 0).length}`);
  console.log(`Suggested body tags: ${report.filter((item) => item.addBody.length > 0).length}`);
  console.log(`Needs review: ${report.filter((item) => item.needsReview).length}`);
  console.log(`Updated recipes: ${updated}`);
  console.log(`Report: ${file}`);

  if (!APPLY) {
    console.log("No database changes were made. Re-run with --apply after reviewing the report.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
