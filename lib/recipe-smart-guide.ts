import { recipeHref, stripHtml } from "@/lib/seo";
import type { RecipeWithCategory } from "@/types/recipe";

type RecipeSmartGuideInput = Pick<
  RecipeWithCategory,
  | "title"
  | "description"
  | "recipeIngredients"
  | "recipeMethods"
  | "recipeCookingTime"
  | "RecipeCategories"
  | "recipeCuisine"
  | "recipeCookingMethods"
  | "recipeRecipeType"
>;

export type RecipeSmartGuideItem = {
  title: string;
  body: string;
};

export type RecipeSmartGuideFaq = {
  question: string;
  answer: string;
};

export type RecipeSmartGuide = {
  whyItWorks: RecipeSmartGuideItem[];
  chefTips: RecipeSmartGuideItem[];
  commonMistakes: RecipeSmartGuideItem[];
  servingSuggestions: RecipeSmartGuideItem[];
  storageInstructions: RecipeSmartGuideItem[];
  variations: RecipeSmartGuideItem[];
  faqs: RecipeSmartGuideFaq[];
};

function clean(value?: string | null) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function lower(value?: string | null) {
  return clean(value).toLowerCase();
}

function sentence(value: string) {
  const text = clean(value);
  if (!text) return "";
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function displayIngredient(value: string) {
  return clean(value)
    .replace(/,\s*raw(?:,.*)?$/i, "")
    .replace(/,\s*(?:big|ripe|fresh)(?:,.*)?$/i, "")
    .replace(/\s*-\s*all varieties$/i, "")
    .replace(/\bchillies\b/gi, "chillies")
    .toLowerCase();
}

function listText(values: string[], fallback: string) {
  const unique = [...new Set(values.map(clean).filter(Boolean))];
  if (unique.length === 0) return fallback;
  if (unique.length === 1) return unique[0];
  if (unique.length === 2) return `${unique[0]} and ${unique[1]}`;
  return `${unique.slice(0, -1).join(", ")}, and ${unique[unique.length - 1]}`;
}

function recipeFamily(recipe: RecipeSmartGuideInput) {
  const signal = lower(
    [
      recipe.title,
      recipe.RecipeCategories?.name,
      ...(recipe.recipeRecipeType ?? []).map((item) => item.recipeType.title),
      ...(recipe.recipeCookingMethods ?? []).map((item) => item.cookingMethod.title),
    ].join(" "),
  );

  if (/\b(juice|smoothie|shake|drink|beverage|tea|coffee|chai)\b/.test(signal)) return "drink";
  if (/\b(salad|chaat)\b/.test(signal)) return "fresh";
  if (/\b(soup|broth|shorba)\b/.test(signal)) return "soup";
  if (/\b(chutney|dip|raita)\b/.test(signal)) return "dip";
  if (/\b(roti|chapati|paratha|dosa|cheela|chilla|pancake|bread)\b/.test(signal)) return "bread";
  if (/\b(curry|sabzi|shaak|dal|khichdi|stew|gravy)\b/.test(signal)) return "main";
  if (/\b(kabab|kebab|cutlet|tikki|pakoda|snack|dhokla|idli)\b/.test(signal)) return "snack";
  if (/\b(halwa|kheer|ladoo|laddu|dessert|sweet)\b/.test(signal)) return "sweet";
  return "general";
}

function cookingVerb(recipe: RecipeSmartGuideInput, family: string) {
  const method = recipe.recipeCookingMethods?.[0]?.cookingMethod.title;
  if (method) return method.toLowerCase();

  switch (family) {
    case "drink":
      return "blending or brewing";
    case "fresh":
      return "fresh assembly";
    case "bread":
      return "mixing and pan cooking";
    case "soup":
      return "simmering";
    case "dip":
      return "blending and seasoning";
    default:
      return "step-by-step cooking";
  }
}

function mainIngredients(recipe: RecipeSmartGuideInput) {
  return recipe.recipeIngredients
    .map((item) => displayIngredient(item.ingredient.name))
    .filter(Boolean)
    .slice(0, 5);
}

function timeText(recipe: RecipeSmartGuideInput) {
  const time = recipe.recipeCookingTime;
  const total = (time?.prepTime || 0) + (time?.cookTime || 0) + (time?.restTime || 0);
  return total > 0 ? `${total} minutes` : "the time shown in the method";
}

function firstMethodCue(recipe: RecipeSmartGuideInput) {
  const method = recipe.recipeMethods.find((item) => clean(stripHtml(item.description || item.title)));
  const text = clean(stripHtml(method?.description || method?.title || ""));
  return text ? sentence(text.length > 150 ? `${text.slice(0, 147).trim()}...` : text) : "";
}

function storageForFamily(title: string, family: string): RecipeSmartGuideItem[] {
  if (family === "drink" || family === "fresh") {
    return [
      {
        title: "Best served fresh",
        body: `${title} is most useful when prepared close to serving time, because freshness, colour and texture can fade after resting.`,
      },
      {
        title: "Short chilling",
        body: "If needed, keep it covered in the refrigerator for a short period and stir or toss once before serving.",
      },
      {
        title: "Avoid long room-temperature storage",
        body: "Do not leave prepared portions uncovered at room temperature; fresh ingredients lose quality quickly.",
      },
    ];
  }

  return [
    {
      title: "Cool before covering",
      body: `Let leftover ${title} cool down before transferring it to a clean, covered container.`,
    },
    {
      title: "Refrigerate promptly",
      body: "Keep leftovers refrigerated and use them within 1 to 2 days for the best home-cooked quality.",
    },
    {
      title: "Reheat gently",
      body: "Reheat on low to medium heat, adding a splash of water only if the texture has tightened after chilling.",
    },
  ];
}

export function buildRecipeSmartGuide(recipe: RecipeSmartGuideInput): RecipeSmartGuide {
  const title = recipe.title;
  const family = recipeFamily(recipe);
  const ingredients = mainIngredients(recipe);
  const ingredientText = listText(ingredients.slice(0, 3), "the listed ingredients");
  const category = recipe.RecipeCategories?.name || "home cooking";
  const cuisine = recipe.recipeCuisine?.[0]?.cuisine.title || "everyday";
  const technique = cookingVerb(recipe, family);
  const cue = firstMethodCue(recipe);
  const duration = timeText(recipe);

  return {
    whyItWorks: [
      {
        title: "Balanced base",
        body: `${title} works because ${ingredientText} give the recipe its main flavour, texture and body instead of relying only on seasoning.`,
      },
      {
        title: "Clear cooking flow",
        body: `The method follows ${technique}, so the ingredients have a defined path from preparation to serving.`,
      },
      {
        title: "Practical timing",
        body: `With a total flow of about ${duration}, this recipe can fit into a ${category.toLowerCase()} meal without turning into a long kitchen project.`,
      },
      ...(cue
        ? [{
            title: "Method cue",
            body: cue,
          }]
        : []),
    ],
    chefTips: [
      {
        title: "Read the full method first",
        body: `Before starting ${title}, read the steps once and keep the measured ingredients nearby.`,
      },
      {
        title: "Keep cuts even",
        body: "Cut or portion the main ingredients evenly so they cook or combine at the same pace.",
      },
      {
        title: "Adjust at the finish",
        body: "Taste near the end before changing salt, spice, sweetness or sourness; small final adjustments are easier to control.",
      },
      {
        title: "Serve at the right moment",
        body: family === "drink" || family === "fresh"
          ? "Serve soon after preparation so the fresh notes stay bright."
          : "Serve while the texture is still fresh and the aroma is at its best.",
      },
    ],
    commonMistakes: [
      {
        title: "Skipping preparation",
        body: "Starting before ingredients are ready can lead to overcooking one part while another part is still being chopped or measured.",
      },
      {
        title: "Using high heat throughout",
        body: "Strong heat can make spices harsh, dry out the surface, or cook the outside before the centre is ready.",
      },
      {
        title: "Adding too much liquid early",
        body: "Add water, milk, stock or curd gradually when the method allows it, because texture is easier to loosen than to fix later.",
      },
      {
        title: "Serving without tasting",
        body: `Always taste ${title} once near the finish so the final seasoning feels balanced.`,
      },
    ],
    servingSuggestions: [
      {
        title: "Everyday plate",
        body: `Serve ${title} as part of a simple ${cuisine.toLowerCase()} meal with one fresh side for contrast.`,
      },
      {
        title: "Texture contrast",
        body: family === "soup" || family === "dip"
          ? "Pair with toast, roti, khakhra, crackers or a crisp salad for contrast."
          : "Add curd, chutney, salad or a light drink if the plate needs freshness.",
      },
      {
        title: "Meal planning",
        body: "If serving with other dishes, keep the accompaniments simpler so this recipe remains easy to enjoy.",
      },
    ],
    storageInstructions: storageForFamily(title, family),
    variations: [
      {
        title: "Milder version",
        body: "Reduce chilli, pepper or strong spices and let the main ingredients stay more prominent.",
      },
      {
        title: "Brighter finish",
        body: "Add a small squeeze of lemon, fresh herbs or a light garnish at the end when it suits the ingredient list.",
      },
      {
        title: "Richer texture",
        body: "For a fuller mouthfeel, finish with a small amount of ghee, butter, curd, cream or nut paste only if it matches the recipe style.",
      },
      {
        title: "Lighter serving",
        body: "Use less oil or sweetener where possible and increase fresh sides instead of making the main dish watery or bland.",
      },
    ],
    faqs: [
      {
        question: `Can I make ${title} ahead of time?`,
        answer: family === "drink" || family === "fresh"
          ? `${title} is best prepared close to serving time. If you need to plan ahead, keep the ingredients ready separately and assemble shortly before eating.`
          : `Yes, you can prepare ${title} ahead for a short period. Cool it properly, keep it covered in the refrigerator, and reheat gently before serving.`,
      },
      {
        question: `How do I avoid making ${title} too dry or too watery?`,
        answer: "Control the liquid gradually and follow the cooking cues in the method. If the dish looks dry, add a small splash of liquid; if it looks watery, cook uncovered briefly.",
      },
      {
        question: `What can I serve with ${title}?`,
        answer: `Serve it with simple sides such as roti, rice, salad, curd, chutney, toast or a light drink depending on the meal and the recipe style.`,
      },
      {
        question: `Can I change the spice level in ${title}?`,
        answer: "Yes. Start with less chilli, pepper or strong spice, then adjust near the finish after tasting.",
      },
      {
        question: `Which ingredients matter most in ${title}?`,
        answer: `The most important ingredients are ${ingredientText}. They shape the flavour and texture, so use fresh, good-quality portions where possible.`,
      },
      {
        question: `Is ${title} suitable for beginners?`,
        answer: `Yes, beginners can make it by reading the method first, preparing ingredients before heating the pan, and cooking with controlled heat.`,
      },
    ],
  };
}

export function faqJsonLdFromRecipeGuide(recipe: RecipeSmartGuideInput) {
  const guide = buildRecipeSmartGuide(recipe);

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function relatedRecipeLinks<T extends { title: string; slug: string; metaSlug?: string | null }>(
  recipes: T[],
) {
  return recipes.slice(0, 6).map((recipe) => ({
    title: recipe.title,
    href: recipeHref(recipe),
  }));
}
