type NamedValue = {
  title: string;
  slug?: string;
};

export type StoredRecipeMethod = {
  id: string;
  title: string;
  description: string | null;
  position: number;
  isPublished: boolean;
};

export type RecipeMethodRecord = {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  category: NamedValue | null;
  cookingMethods: NamedValue[];
  recipeTypes: NamedValue[];
  ingredients: string[];
  currentMethods: StoredRecipeMethod[];
};

export type GeneratedMethod = {
  existingId: string | null;
  title: string;
  description: string;
  position: number;
  isPublished: boolean;
};

type MethodFamily =
  | "beverage"
  | "bread"
  | "curry"
  | "dip"
  | "fresh"
  | "salad"
  | "sandwich"
  | "snack"
  | "soup"
  | "sweet"
  | "vegetable"
  | "general";

const INGREDIENT_NAMES: Array<[RegExp, string]> = [
  [/^apple.*$/i, "apple"],
  [/^banana.*$/i, "banana"],
  [/^bay leaf.*$/i, "bay leaf"],
  [/^beet root.*$/i, "beetroot"],
  [/^black pepper.*$/i, "black pepper"],
  [/^bread,\s*multi-grain.*$/i, "multigrain bread"],
  [/^bread crumbs.*$/i, "breadcrumbs"],
  [/^button mushroom.*$/i, "button mushrooms"],
  [/^bottle gourd.*$/i, "bottle gourd"],
  [/^capsicum,\s*green.*$/i, "green capsicum"],
  [/^carrot,\s*orange.*$/i, "carrot"],
  [/^carrot,\s*red.*$/i, "red carrot"],
  [/^chillies?,\s*green.*$/i, "green chillies"],
  [/^coriander leaves.*$/i, "coriander leaves"],
  [/^curry leaves.*$/i, "curry leaves"],
  [/^cucumber,\s*green.*$/i, "cucumber"],
  [/^egg,.*$/i, "egg"],
  [/^garlic.*$/i, "garlic"],
  [/^ginger,\s*fresh.*$/i, "fresh ginger"],
  [/^okra,.*$/i, "okra"],
  [/^onions?,\s*raw.*$/i, "onion"],
  [/^paneer.*$/i, "paneer"],
  [/^potato,\s*brown skin.*$/i, "potato"],
  [/^cheese,\s*parmesan.*$/i, "grated parmesan"],
  [/^milk,\s*whole,\s*cow.*$/i, "milk"],
  [/^beverages?,\s*coffee,\s*instant.*$/i, "instant coffee"],
  [/^organic cane sugar.*$/i, "sugar"],
  [/^rice,\s*raw,\s*brown.*$/i, "brown rice"],
  [/^rice,\s*raw,\s*milled.*$/i, "rice"],
  [/^rock salt.*$/i, "rock salt"],
  [/^salt,\s*table.*$/i, "salt"],
  [/^spices?,\s*chili powder.*$/i, "red chilli powder"],
  [/^sunflower oil.*$/i, "sunflower oil"],
  [/^tomato,\s*ripe.*$/i, "ripe tomato"],
  [/^turmeric powder.*$/i, "turmeric powder"],
  [/^yellow\s+moong\s+dal.*$/i, "yellow moong dal"],
  [/^green\s+moong\s+dal.*$/i, "green moong dal"],
];

const SUPPORTING_INGREDIENTS =
  /\b(oil|ghee|salt|pepper|chilli|chili|turmeric|cumin|coriander|ginger|garlic|bay leaf|water)\b/i;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function cleanText(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/[’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function sentenceCase(value: string) {
  const clean = value.trim();
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : clean;
}

function displayIngredient(value: string) {
  const clean = cleanText(value);
  const mapped = INGREDIENT_NAMES.find(([pattern]) => pattern.test(clean));
  if (mapped) return mapped[1];
  const display = clean
    .replace(/,\s*raw(?:,.*)?$/i, "")
    .replace(/,\s*(?:big|ripe)(?:,.*)?$/i, "")
    .replace(/\s*-\s*all varieties$/i, "")
    .toLowerCase();
  return display;
}

function listText(values: string[], fallback: string) {
  const unique = [...new Set(values.filter(Boolean))];
  if (unique.length === 0) return fallback;
  if (unique.length === 1) return unique[0];
  if (unique.length === 2) return `${unique[0]} and ${unique[1]}`;
  return `${unique.slice(0, -1).join(", ")}, and ${unique[unique.length - 1]}`;
}

function featuredIngredients(recipe: RecipeMethodRecord) {
  const ingredients = recipe.ingredients.map(displayIngredient).filter(Boolean);
  const featured = ingredients.filter((ingredient) => !SUPPORTING_INGREDIENTS.test(ingredient));
  return featured.length > 0 ? featured.slice(0, 3) : ingredients.slice(0, 3);
}

function familyOf(recipe: RecipeMethodRecord): MethodFamily {
  const signals = [
    recipe.title,
    recipe.category?.title ?? "",
    ...recipe.recipeTypes.map((type) => type.title),
    ...recipe.cookingMethods.map((method) => method.title),
  ]
    .join(" ")
    .toLowerCase();

  const noCookServing =
    recipe.currentMethods.length === 0 &&
    recipe.cookingMethods.length === 0 &&
    /\b(apple|apricot|babugosha|banana|berries|black currants|blackberries|blueberries|cashew|cherries|coconut water|cranberries|fruit|goosberry|grapefruit|grapes|jamun|kiwi|mulberries|nuts|papaya|parsley|passion fruit|peach|pear|pineapple|plums|pomegranate|prunes|raspberries|soaked|soya milk|strawberr|sweet lime|toned milk|watermelon|yogurt|curd)\b/.test(
      signals,
    );

  if (noCookServing) return "fresh";
  if (/(juice|smoothie|shake|tea|drink|beverage|infusion)/.test(signals)) return "beverage";
  if (/(roti|chapati|paratha|thepla|cheela|chilla|dosa|pancake|bread)/.test(signals)) {
    return "bread";
  }
  if (/(sandwich|toast)/.test(signals)) return "sandwich";
  if (/(soup|broth|shorba)/.test(signals)) return "soup";
  if (/(salad|chaat)/.test(signals)) return "salad";
  if (/(chutney|dip|raita)/.test(signals)) return "dip";
  if (/(kabab|kebab|cutlet|tikki|pakoda|snack|dhokla|idli)/.test(signals)) return "snack";
  if (/(halwa|kheer|ladoo|laddu|sweet|dessert)/.test(signals)) return "sweet";
  if (/(curry|dal|lentil|khichdi|stew|gravy)/.test(signals)) return "curry";
  if (/(saute|stir|vegetable|sabzi|shaak|bhaji|okra|aloo|gobhi|cauliflower|potato)/.test(signals)) {
    return "vegetable";
  }
  return "general";
}

function polishSourceInstruction(value: string, recipeTitle: string, isLast: boolean) {
  let text = cleanText(value);
  text = text
    .replace(/\s+([,.])/g, "$1")
    .replace(/\bmins?\b/gi, "minutes")
    .replace(/\bflame\b/gi, "heat")
    .replace(/\btill\b/gi, "until")
    .replace(/\bStir it well\b/gi, "Stir well")
    .replace(/\bMix it well\b/gi, "Mix well")
    .replace(/\bBoil egg\b/gi, "Boil the egg")
    .replace(/\bin the another pan\b/gi, "in another pan")
    .replace(/\bRemove its outer shell\b/gi, "Peel it")
    .replace(/\bcardomon\b/gi, "cardamom")
    .replace(/\bchilli flake\b/gi, "chilli flakes")
    .replace(/\bparsley dried\b/gi, "dried parsley")
    .replace(/\bchopped beet greens leaves\b/gi, "chopped beet greens")
    .replace(/\bremove it from the heat\b/gi, "take the pan off the heat")
    .replace(/\bremove it from the flame\b/gi, "take the pan off the heat")
    .replace(/\bTake oil in a wok\b/gi, "Heat oil in a wok")
    .replace(/\bcook in a slow heat\b/gi, "cook over low heat")
    .replace(/\bcook on a low heat\b/gi, "cook over low heat")
    .replace(/\bcook in a medium heat\b/gi, "cook over medium heat")
    .replace(/\bcook on a medium heat\b/gi, "cook over medium heat")
    .replace(/\bHeat a pan with\b/gi, "Heat")
    .replace(/\bon a (low|medium|high) heat\b/gi, "over $1 heat")
    .replace(/^In a ([^,]+) heat ([^,]+) over medium heat,/i, "Heat $2 in a $1 over medium heat,")
    .replace(/\bthick Then,\s*/g, "thick. Then ")
    .replace(/\bCook them until it is done\b/gi, "Cook until the tomatoes soften")
    .replace(
      /\bcook over low heat for ([^.]+?) or until the time the tadka gets mixed into the dal thoroughly\b/gi,
      "cook over low heat for $1, until the tempering is evenly mixed through the dal",
    )
    .replace(/\bAdd water in the pulp\b/gi, "Add water to the pulp")
    .replace(/\bcook it in pressure cooker\b/gi, "cook it in a pressure cooker")
    .replace(/\bAdd cardamom powder, black salt\b/gi, "Add cardamom powder and black salt")
    .replace(/\bCover the wok with lid\b/gi, "Cover the wok with a lid")
    .replace(/\bTransfer the cooked ([^.]+) in a serving bowl\b/gi, "Transfer the cooked $1 to a serving bowl")
    .replace(/\bTransfer the sauteed vegetable in a platter\b/gi, "Transfer the sauteed vegetables to a serving plate")
    .replace(/\s+/g, " ")
    .trim();

  const destination = /\b(heat|pan|wok|tawa)\b/i.test(text) ? "to the pan" : "to the mixture";
  text = text
    .replace(/\bin it\b/gi, destination)
    .replace(/,\s*Stir\b/g, ", stir");

  if (isLast) {
    if (/^serve it\.?$/i.test(text)) {
      text = `Serve ${recipeTitle} fresh for the best flavour and texture.`;
    } else if (!text.toLowerCase().includes(recipeTitle.toLowerCase())) {
      text = text.replace(
        /\bserve it (hot|warm|fresh|chilled|immediately)\b/i,
        (_match, style: string) =>
          `serve ${recipeTitle} ${
            style.toLowerCase() === "fresh" && /\b(chicken|kabab|kebab|cutlet|tikki)\b/i.test(recipeTitle)
              ? "hot"
              : style.toLowerCase()
          }`,
      );
      text = text.replace(
        /\bserve (hot|warm|chilled|immediately)\b/i,
        (_match, style: string) => `serve ${recipeTitle} ${style.toLowerCase()}`,
      );
    }
  }

  if (text.length < 28) {
    text = isLast
      ? `${text.replace(/\.$/, "")}. Serve ${recipeTitle} fresh for the best flavour and texture.`
      : `${text.replace(/\.$/, "")}. Continue until everything is evenly prepared for ${recipeTitle}.`;
  }

  if (!/[.!?]$/.test(text)) text = `${text}.`;
  text = text.replace(/([.!?]\s+)([a-z])/g, (_match, ending: string, letter: string) => {
    return `${ending}${letter.toUpperCase()}`;
  });

  return sentenceCase(text);
}

function titleForInstruction(description: string, currentTitle: string, index: number, total: number) {
  if (currentTitle && !/^step\s+\d+$/i.test(currentTitle.trim())) {
    return sentenceCase(cleanText(currentTitle));
  }

  const text = description.toLowerCase();
  if (index === total - 1 && /\b(serve|garnish|transfer|plate|pour into serving)\b/.test(text)) {
    return "Finish and serve";
  }
  if (/\b(soak|wash|rinse|drain|clean|peel|chop|slice|cut|separate|measure)\b/.test(text)) {
    return "Prepare the ingredients";
  }
  if (/\b(knead|dough|roll the dough|dough balls?)\b/.test(text)) {
    return /\b(roll|fill|stuff|place.*(?:pan|tawa))\b/.test(text)
      ? "Shape and cook"
      : "Make and rest the dough";
  }
  if (/\b(grind|blend|puree|whisk|scramble|batter|beat the egg)\b/.test(text)) {
    return "Make the base mixture";
  }
  if (/\b(preheat|coat|dredge|air fryer|steamer|oven)\b/.test(text)) {
    return "Prepare for cooking";
  }
  if (/\b(dal|lentil)\b.*\b(tadka|temper)|\b(tadka|temper)\b.*\b(dal|lentil)\b/.test(text)) {
    return "Simmer and combine";
  }
  if (/\b(heat|temper|saute|fry|roast|add cumin|add mustard|tadka)\b/.test(text)) {
    return "Build the flavour base";
  }
  if (/\b(cover|lid|leave for|set|solidified|boil|pressure cook|simmer|steam|bake|cook)\b/.test(text)) {
    return "Cook until ready";
  }
  if (/\b(add|combine|mix|toss|fold|stir|take a mixing bowl)\b/.test(text)) {
    return "Combine and season";
  }
  return index === total - 1 ? "Finish the recipe" : "Continue the preparation";
}

function wrapInstruction(value: string) {
  return `<p>${escapeHtml(value)}</p>`;
}

function fallbackMethods(recipe: RecipeMethodRecord): GeneratedMethod[] {
  const family = familyOf(recipe);
  const featured = listText(featuredIngredients(recipe), "the listed ingredients");
  const title = recipe.title;
  const step = (stepTitle: string, description: string, position: number): GeneratedMethod => ({
    existingId: null,
    title: stepTitle,
    description: wrapInstruction(description),
    position,
    isPublished: recipe.isPublished,
  });

  switch (family) {
    case "fresh": {
      const isSoaked = /\bsoaked\b/i.test(title);
      return isSoaked
        ? [
            step("Measure the portion", `Measure ${featured} for one serving of ${title}, checking that the ingredients are clean and fresh.`, 1),
            step("Soak safely", `Rinse the ingredients, place them in clean drinking water, and soak until softened as intended for this serving.`, 2),
            step("Drain before serving", `Drain the soaking water and check the texture. Remove any skins only when preferred or suitable for the ingredient.`, 3),
            step("Serve fresh", `Serve ${title} fresh as a ready-to-eat portion.`, 4),
          ]
        : [
            step("Select the portion", `Choose a fresh portion of ${featured} for ${title} and discard any damaged or unsuitable pieces.`, 1),
            step("Clean before serving", `Rinse thoroughly in clean water and pat dry or drain well before serving.`, 2),
            step("Prepare to eat", `Peel, slice, deseed, or portion the ingredient only as needed for easy serving.`, 3),
            step("Serve fresh", `Serve ${title} fresh at once for the best natural flavour and texture.`, 4),
          ];
    }
    case "beverage":
      if (/\b(coffee|tea|chai)\b/i.test(title)) {
        return [
          step("Measure the ingredients", `Measure ${featured}, along with the water or milk specified for ${title}.`, 1),
          step("Brew gently", `Heat the water or milk as required, add the flavouring ingredients, and simmer gently until the drink is aromatic.`, 2),
          step("Finish the drink", `Add any sweetener or final ingredient listed in the recipe. Stir well and strain if needed for a smooth cup.`, 3),
          step("Serve hot", `Pour ${title} into cups and serve hot while freshly prepared.`, 4),
        ];
      }
      return [
        step("Prepare the ingredients", `Wash and prepare ${featured}. Measure the remaining ingredients before you begin so the ${title} tastes balanced.`, 1),
        step("Blend or combine", `Add the prepared ingredients to a blender or jug with the liquid listed in the recipe. Blend or stir until the mixture is smooth and evenly combined.`, 2),
        step("Adjust the texture", `Check the consistency and flavour. Add a small amount of water only if needed, then blend again briefly for an even finish.`, 3),
        step("Serve fresh", `Pour the ${title} into serving glasses and serve fresh for the best flavour and colour.`, 4),
      ];
    case "bread": {
      const isBatter = /(cheela|chilla|dosa|pancake|pudla)/i.test(title);
      return isBatter
        ? [
            step("Prepare the batter", `Prepare ${featured} as listed, then combine them into a smooth, pourable batter for the ${title}. Rest briefly if needed for an even texture.`, 1),
            step("Heat the pan", `Warm a flat pan over medium heat and lightly grease it. Pour a portion of batter and spread it gently into an even round.`, 2),
            step("Cook both sides", `Cook until the underside is set and lightly golden. Turn carefully, add a little oil if required, and cook the second side until done.`, 3),
            step("Serve warm", `Transfer the ${title} to a plate and serve warm with a suitable chutney, curd, or accompaniment.`, 4),
          ]
        : [
            step("Make the dough", `Combine ${featured} with the remaining listed ingredients. Add water gradually and knead into a soft, manageable dough.`, 1),
            step("Rest and portion", `Cover the dough and let it rest briefly. Divide it into equal portions and roll each one evenly.`, 2),
            step("Cook on the pan", `Cook each portion on a hot flat pan over medium heat, turning as needed until both sides are cooked with light golden spots.`, 3),
            step("Serve warm", `Keep the ${title} covered until serving, then enjoy it warm with a curry, dal, curd, or chutney.`, 4),
          ];
    }
    case "soup":
      return [
        step("Prepare the ingredients", `Wash and cut ${featured} into even pieces so they cook at the same pace in the ${title}.`, 1),
        step("Build the base", `Heat the listed oil or fat in a deep pan. Add the aromatic ingredients and cook gently until fragrant.`, 2),
        step("Simmer the soup", `Add the main ingredients with the required liquid. Simmer until tender, then blend or leave textured according to the style of the dish.`, 3),
        step("Season and serve", `Adjust seasoning at the finish and serve the ${title} warm in bowls.`, 4),
      ];
    case "salad":
      return [
        step("Prepare fresh ingredients", `Wash, dry, and cut ${featured} into neat bite-sized pieces for the ${title}.`, 1),
        step("Prepare the seasoning", `Combine the listed seasoning or dressing ingredients in a small bowl until evenly mixed.`, 2),
        step("Toss gently", `Place the prepared ingredients in a bowl and toss gently with the seasoning so every bite is lightly coated.`, 3),
        step("Serve immediately", `Serve the ${title} immediately while the ingredients are fresh and crisp.`, 4),
      ];
    case "dip":
      return [
        step("Prepare the ingredients", `Clean and prepare ${featured} as listed before making the ${title}.`, 1),
        step("Blend the mixture", `Combine the main ingredients with the seasonings and blend or whisk until smooth and spoonable.`, 2),
        step("Check the flavour", `Taste and adjust the seasoning carefully. Add only a small amount of liquid if the texture needs loosening.`, 3),
        step("Serve as an accompaniment", `Transfer the ${title} to a clean bowl and serve fresh or chilled with your meal.`, 4),
      ];
    case "sandwich":
      return [
        step("Prepare the filling", `Prepare ${featured} as listed, keeping the slices even so the ${title} is easy to assemble and eat.`, 1),
        step("Assemble the sandwich", `Place the filling between the bread slices and season lightly with the listed salt, pepper, chutney, or spread. Press gently so the layers hold together.`, 2),
        step("Toast if needed", `Toast on a warm pan or sandwich press until the bread is lightly crisp and the filling is warmed through, or serve fresh if the recipe is meant to stay untoasted.`, 3),
        step("Serve neatly", `Cut the ${title} into portions and serve warm or fresh with chutney, salad, or another simple side.`, 4),
      ];
    case "snack":
      return [
        step("Prepare the mixture", `Combine ${featured} with the remaining listed seasonings until the mixture for ${title} holds together evenly.`, 1),
        step("Shape the portions", `Divide the mixture into even portions and shape them neatly so they cook consistently.`, 2),
        step("Cook until golden", `Heat the pan, steamer, or cooking surface indicated by the recipe and cook the portions until set and golden or tender as required.`, 3),
        step("Serve hot", `Serve the ${title} hot with a suitable chutney or dip.`, 4),
      ];
    case "sweet":
      return [
        step("Prepare the ingredients", `Measure ${featured} and keep all ingredients ready before starting the ${title}.`, 1),
        step("Cook gently", `Combine the main ingredients in a pan and cook over low to medium heat, stirring as required so the mixture develops evenly.`, 2),
        step("Finish the texture", `Continue cooking until the desired consistency is reached, then add any finishing ingredients listed in the recipe.`, 3),
        step("Serve or set", `Transfer the ${title} to serving bowls or a tray and serve warm or allow it to set, according to the dish.`, 4),
      ];
    case "curry":
      return [
        step("Prepare the ingredients", `Wash and prepare ${featured}. Keep the spices and aromatics ready for making ${title}.`, 1),
        step("Make the flavour base", `Heat the listed oil or ghee in a pan. Cook the whole spices and aromatics until fragrant, then add the ground spices carefully.`, 2),
        step("Cook the main ingredients", `Add the main ingredients and mix them through the masala. Add water if required and simmer until tender and well combined.`, 3),
        step("Finish and serve", `Taste, adjust seasoning, and finish with any listed garnish. Serve the ${title} warm.`, 4),
      ];
    case "vegetable":
      return [
        step("Prepare the vegetables", `Wash, dry, and cut ${featured} evenly so the ${title} cooks with a consistent texture.`, 1),
        step("Temper the pan", `Heat the listed oil in a pan over medium heat. Add spices and aromatics, stirring until fragrant.`, 2),
        step("Cook until tender", `Add the prepared vegetables and seasonings. Cook, stirring occasionally, until tender while retaining a pleasant texture.`, 3),
        step("Serve hot", `Transfer the ${title} to a serving dish and serve hot with the rest of your meal.`, 4),
      ];
    default:
      return [
        step("Prepare the ingredients", `Measure and prepare ${featured} before beginning the ${title}.`, 1),
        step("Combine the flavours", `Follow the listed cooking method to combine the main ingredients with the seasonings in an even mixture.`, 2),
        step("Cook until ready", `Cook over controlled heat until the main ingredients are tender or fully set, adjusting the texture only if needed.`, 3),
        step("Finish and serve", `Taste once at the end, add any listed garnish, and serve the ${title} fresh.`, 4),
      ];
  }
}

export function generateRecipeMethods(recipe: RecipeMethodRecord): GeneratedMethod[] {
  const shouldRegenerateFallback =
    recipe.currentMethods.length === 0 ||
    recipe.currentMethods.some((method) =>
      /\b(listed ingredients|remaining listed ingredients|listed cooking method)\b/i.test(
        method.description ?? "",
      ),
    );

  if (shouldRegenerateFallback) {
    return fallbackMethods(recipe).map((method, index) => ({
      ...method,
      existingId: recipe.currentMethods[index]?.id ?? null,
    }));
  }

  return recipe.currentMethods.map((method, index) => {
    const sourceInstruction =
      method.description?.trim() ||
      `Complete this stage of ${recipe.title} using the prepared ingredients until ready.`;
    const instruction = polishSourceInstruction(
      sourceInstruction,
      recipe.title,
      index === recipe.currentMethods.length - 1,
    );

    return {
      existingId: method.id,
      title: titleForInstruction(instruction, method.title, index, recipe.currentMethods.length),
      description: wrapInstruction(instruction),
      position: index + 1,
      isPublished: recipe.isPublished,
    };
  });
}
