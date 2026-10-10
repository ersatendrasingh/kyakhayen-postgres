type FastingRecipeInput = {
  title?: string | null;
  RecipeCategories?: { name?: string | null } | null;
  recipeIngredients?: Array<{
    ingredient?: { name?: string | null } | null;
  }> | null;
};

const fastingIntentTerms = [
  "vrat",
  "upvas",
  "fasting",
  "farali",
  "phalahari",
  "navratri",
  "sendha",
  "kuttu",
  "singhara",
  "sabudana",
  "samak",
  "samvat",
  "makhana",
  "rajgira",
];

const fastingIntentPatterns = [
  /\bfast\b/,
  /\bfasts\b/,
  /\bfasting\b/,
  /\bfast recipe(?:s)?\b/,
  /\bmera fast\b/,
  /\bmy fast\b/,
];

const fastingAnchorTerms = [
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
];

const fastingBlockedTerms = [
  "table salt",
  "namak",
  "onion",
  "garlic",
  "wheat",
  "gehun",
  "bread",
  "breadcrumbs",
  "pasta",
  "spaghetti",
  "noodle",
  "rice",
  "poha",
  "corn flour",
  "corn",
  "semolina",
  "sooji",
  "rava",
  "multigrain flour",
  "curry powder",
  "vinegar",
  "pickle",
  "pickles",
  "mustard",
  "cheddar",
  "parmesan",
  "mozzarella",
  "feta",
  "cheese",
  "besan",
  "chana",
  "dal",
  "lentil",
  "moong",
  "bean",
  "soy",
  "tofu",
  "egg",
  "chicken",
  "fish",
  "meat",
  "mutton",
  "beef",
  "pork",
];

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ");
}

function containsAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(normalize(term)));
}

function matchesFastingIntent(value: string) {
  return fastingIntentPatterns.some((pattern) => pattern.test(value));
}

function ingredientText(recipe: FastingRecipeInput) {
  return (recipe.recipeIngredients || [])
    .map((item) => item.ingredient?.name || "")
    .join(" ");
}

function isBlockedIngredient(name: string) {
  const normalizedName = normalize(name);

  if (
    normalizedName.includes("sendha namak") ||
    normalizedName.includes("rock salt") ||
    normalizedName.includes("himalayan pink salt") ||
    normalizedName.includes("buckwheat") ||
    normalizedName.includes("paneer")
  ) {
    return false;
  }

  return containsAny(normalizedName, fastingBlockedTerms);
}

export function isFastingSearchQuery(query: string) {
  const normalizedQuery = normalize(query);
  return containsAny(normalizedQuery, fastingIntentTerms) || matchesFastingIntent(normalizedQuery);
}

export function isFastingIngredientName(name: string) {
  const normalizedName = normalize(name);
  const saltAnchor =
    normalizedName.includes("sendha namak") ||
    normalizedName.includes("rock salt") ||
    normalizedName.includes("himalayan pink salt");

  return (saltAnchor || containsAny(normalizedName, fastingAnchorTerms)) && !isBlockedIngredient(name);
}

export function isFastingFriendlyRecipe(recipe: FastingRecipeInput) {
  const category = normalize(recipe.RecipeCategories?.name || "");
  if (["non veg", "eggetarian", "pescetarian"].includes(category)) return false;

  const ingredientNames = recipe.recipeIngredients?.map((item) => item.ingredient?.name || "") || [];
  if (ingredientNames.length === 0) return false;
  if (ingredientNames.some(isBlockedIngredient)) return false;

  const searchableText = normalize(`${recipe.title || ""} ${ingredientText(recipe)}`);
  return containsAny(searchableText, [...fastingIntentTerms, ...fastingAnchorTerms]);
}
