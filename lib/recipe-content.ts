type NamedValue = {
  title: string;
  slug?: string;
};

export type RecipeContentRecord = {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  category: NamedValue | null;
  cuisines: NamedValue[];
  mealTimes: NamedValue[];
  dietTypes: NamedValue[];
  recipeTypes: NamedValue[];
  cookingMethods: NamedValue[];
  ingredients: string[];
  steps: string[];
  prepTime: number;
  cookTime: number;
  restTime: number;
};

export type RelatedContentLink = {
  title: string;
  slug: string;
};

export type GeneratedRecipeContent = {
  description: string;
  metaTitle: string;
  metaDescription: string;
  wordCount: number;
};

type RecipeFamily =
  | "beverage"
  | "bread"
  | "breakfast"
  | "curry"
  | "dip"
  | "fresh"
  | "hotDrink"
  | "pantry"
  | "protein"
  | "salad"
  | "soaked"
  | "snack"
  | "soup"
  | "sweet"
  | "vegetable"
  | "general";

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
    .replace(/\s+/g, " ")
    .trim();
}

function lower(value: string) {
  return value.toLowerCase();
}

const INGREDIENT_NAMES: Array<[RegExp, string]> = [
  [/^apple.*$/i, "apple"],
  [/^banana.*$/i, "banana"],
  [/^basil leaves.*$/i, "basil leaves"],
  [/^bengal gram,\s*dal$/i, "chana dal"],
  [/^bay leaf.*$/i, "bay leaf"],
  [/^beverages?,\s*almond milk.*$/i, "unsweetened almond milk"],
  [/^beverages?,\s*coffee,\s*instant.*$/i, "instant coffee"],
  [/^black pepper.*$/i, "black pepper"],
  [/^cheese,\s*cheddar.*$/i, "cheddar cheese"],
  [/^cheese,\s*parmesan.*$/i, "grated parmesan"],
  [/^chillies?,\s*green.*$/i, "green chillies"],
  [/^onions?,\s*raw.*$/i, "onion"],
  [/^milk,\s*whole,\s*cow.*$/i, "milk"],
  [/^organic cane sugar.*$/i, "sugar"],
  [/^water,\s*tap,\s*drinking.*$/i, "water"],
  [/^seeds,\s*flaxseed.*$/i, "flaxseeds"],
  [/^seeds,\s*pumpkin and squash seed kernels.*$/i, "pumpkin seeds"],
  [/^salt,\s*table.*$/i, "salt"],
  [/^soup,\s*vegetable broth.*$/i, "vegetable broth"],
  [/^strawberry.*$/i, "strawberries"],
  [/^sweetener,\s*herbal extract powder from stevia leaf.*$/i, "stevia"],
  [/^tomato,\s*ripe.*$/i, "ripe tomato"],
  [/^buckwheat flour,\s*whole-groat.*$/i, "buckwheat flour"],
  [/^rock salt.*$/i, "rock salt"],
  [/^mustard oil.*$/i, "mustard oil"],
  [/^sunflower oil.*$/i, "sunflower oil"],
  [/^rice,\s*raw,\s*brown.*$/i, "brown rice"],
  [/^rice,\s*raw,\s*milled.*$/i, "rice"],
  [/^yellow\s+moong\s+dal.*$/i, "yellow moong dal"],
  [/^green\s+moong\s+dal.*$/i, "green moong dal"],
  [/^carrot,\s*red.*$/i, "red carrot"],
  [/^french beans.*$/i, "green beans"],
  [/^bread crumbs.*$/i, "breadcrumbs"],
  [/^ginger,\s*fresh.*$/i, "fresh ginger"],
  [/^garlic.*$/i, "garlic"],
  [/^paneer.*$/i, "paneer"],
  [/^goo?sberry.*$/i, "amla"],
  [/^bottle gourd.*$/i, "bottle gourd"],
  [/^amaranth flour.*$/i, "amaranth flour"],
  [/^capsicum,\s*green.*$/i, "green capsicum"],
  [/^carrot,\s*orange.*$/i, "carrot"],
  [/^button mushroom.*$/i, "button mushrooms"],
  [/^curry leaves.*$/i, "curry leaves"],
];

function displayIngredient(value: string) {
  const clean = cleanText(value);
  const mapped = INGREDIENT_NAMES.find(([pattern]) => pattern.test(clean));
  if (mapped) return mapped[1];
  const display = clean
    .replace(/,\s*raw(?:,.*)?$/i, "")
    .replace(/,\s*(?:big|ripe)(?:,.*)?$/i, "")
    .replace(/\s*-\s*all varieties$/i, "");
  return display.charAt(0).toLowerCase() + display.slice(1);
}

function listText(values: string[], fallback: string) {
  const unique = [...new Set(values.filter(Boolean))];
  if (unique.length === 0) return fallback;
  if (unique.length === 1) return unique[0];
  if (unique.length === 2) return `${unique[0]} and ${unique[1]}`;
  return `${unique.slice(0, -1).join(", ")}, and ${unique[unique.length - 1]}`;
}

function familyOf(recipe: RecipeContentRecord): RecipeFamily {
  const title = lower(recipe.title);
  const types = lower(recipe.recipeTypes.map((type) => type.title).join(" "));

  if (/\b(coffee|tea|chai)\b/.test(title)) {
    return "hotDrink";
  }
  if (/(drink|juice|smoothie|shake|infusion|sip|beverage)/.test(`${title} ${types}`)) {
    return "beverage";
  }
  if (/\bsoaked\b/.test(title)) {
    return "soaked";
  }
  if (/(seeds?|nuts?|almonds?|peanuts?|cashew)/.test(title)) {
    return "pantry";
  }
  if (
    /\b(apple|apricot|babugosha|banana|berries|black currants|blackberries|blueberries|cherries|coconut water|cranberries|fruit|goosberry|grapefruit|grapes|jamun|kiwi|mulberries|papaya|parsley|passion fruit|peach|pear|pineapple|plums|pomegranate|prunes|raspberries|soya milk|strawberr|sweet lime|toned milk|watermelon|yogurt|curd)\b/.test(
      title,
    )
  ) {
    return "fresh";
  }
  if (/(chapati|roti|paratha|thepla|dosa|cheela|chilla|pancake|pudla|puttu)/.test(title)) {
    return "bread";
  }
  if (/(soup|broth|shorba)/.test(`${title} ${types}`)) return "soup";
  if (/(salad|chaat)/.test(`${title} ${types}`)) return "salad";
  if (/(chutney|dip|raita)/.test(`${title} ${types}`)) return "dip";
  if (/(kabab|kebab|cutlet|tikki|snack|pakoda|dhokla|idli)/.test(`${title} ${types}`)) {
    return "snack";
  }
  if (/(halwa|kheer|ladoo|laddu|chikki|dessert|sweet)/.test(title)) return "sweet";
  if (/(curry|sabzi|shaak|saag|stew|dal|khichdi)/.test(title)) return "curry";
  if (/(egg|chicken|fish|paneer|tofu|dal|lentil|chana|bean)/.test(title)) return "protein";
  if (/(breakfast|upma|poha|porridge|oats)/.test(`${title} ${types}`)) return "breakfast";
  if (/vegetable/.test(types)) return "vegetable";
  return "general";
}

function familyCopy(family: RecipeFamily) {
  switch (family) {
    case "beverage":
      return {
        hook: "a fresh, flavour-led homemade drink",
        texture: "a balanced sip with clean aroma and a freshly prepared finish",
        cooking: "Prepare the flavouring ingredients carefully, then blend, steep or strain as the recipe method indicates. Taste before serving so the freshness of the ingredients is not lost behind unnecessary sweetness or dilution.",
        serving: "Serve freshly prepared in a chilled or warmed glass according to the style of drink. A simple fruit plate, light snack or breakfast dish makes a natural companion.",
        tips: [
          "Use clean, fresh ingredients and chilled water or ice only where the method calls for it.",
          "Adjust consistency at the end so the drink remains lively rather than watery.",
          "Prepare close to serving time for the best colour, aroma and flavour.",
        ],
      };
    case "hotDrink":
      return {
        hook: "a comforting freshly brewed homemade drink",
        texture: "a warm drink with inviting aroma and a smooth freshly prepared finish",
        cooking: "Measure the ingredients before heating, then brew or simmer gently so the aroma develops without overcooking the milk or flavouring ingredients. Stir and strain only as the method requires.",
        serving: "Serve hot in a warm cup with a light breakfast dish or snack that complements the drink.",
        tips: [
          "Use measured water or milk so the drink keeps a balanced strength.",
          "Simmer gently instead of boiling aggressively for a smoother cup.",
          "Serve soon after brewing while its aroma is still fresh.",
        ],
      };
    case "bread":
      return {
        hook: "a comforting handmade flatbread-style dish",
        texture: "soft-centred bread with a pleasing cooked surface and aromatic filling or flour base",
        cooking: "Bring the dough or batter together gently and give it enough time to settle before shaping. Cook over steady heat so the surface colours gradually while the centre cooks through without drying out.",
        serving: "Serve warm with curd, chutney, dal or a simple vegetable side. It also works neatly in a lunch plate when paired with a fresh salad.",
        tips: [
          "Add liquid gradually when mixing so the dough or batter stays manageable.",
          "Use medium heat for even colouring instead of rushing the surface.",
          "Keep cooked portions covered briefly if serving together, so they remain soft.",
        ],
      };
    case "soup":
      return {
        hook: "a warm bowl built for gentle, savoury flavour",
        texture: "a comforting soup with layered aroma and an easy spoonable texture",
        cooking: "Cook aromatics first where listed, then allow the principal vegetables or lentils to soften fully before adjusting the final consistency. A controlled simmer builds flavour more evenly than a hurried boil.",
        serving: "Ladle into warm bowls and finish with fresh herbs or pepper if they suit the ingredient list. It pairs well with toast, a light salad or a simple grain dish.",
        tips: [
          "Cut ingredients evenly so they soften at a similar pace.",
          "Add water or stock in stages when refining the final texture.",
          "Taste once near the finish before adjusting salt or seasoning.",
        ],
      };
    case "salad":
      return {
        hook: "a colourful bowl with crisp, fresh contrast",
        texture: "fresh bites, bright flavour and a pleasing contrast of textures",
        cooking: "Prepare each component cleanly and keep delicate ingredients fresh until assembly. If any cooked element is included, cool it slightly before combining so the salad stays lively rather than wilted.",
        serving: "Toss shortly before serving and present as a side, light lunch component or refreshing companion to a warmer dish.",
        tips: [
          "Dry washed produce well so the final bowl does not become watery.",
          "Cut components to similar bite size for a balanced forkful.",
          "Add seasoning or dressing shortly before serving to protect crunch.",
        ],
      };
    case "dip":
      return {
        hook: "a punchy accompaniment for everyday plates",
        texture: "a flavourful spoonable accompaniment with fresh or gently spiced character",
        cooking: "Build the base gradually, blending or whisking until the texture suits the dish. Season carefully because accompaniments should brighten a meal without overpowering it.",
        serving: "Spoon alongside flatbreads, snacks, rice dishes or vegetable plates, using it as a flavour accent rather than the entire meal.",
        tips: [
          "Keep the texture slightly thick so it sits well beside food.",
          "Taste after resting briefly, as flavours often become clearer.",
          "Store chilled in a clean covered container if made ahead.",
        ],
      };
    case "pantry":
      return {
        hook: "a simple ingredient-led bite for an everyday plate",
        texture: "a minimal preparation where the natural crunch and flavour of the ingredients stay central",
        cooking: "This recipe depends on careful portioning and clean handling rather than complicated cooking. Follow the listed preparation notes where supplied, and keep the featured ingredients fresh and neatly stored.",
        serving: "Serve in a small bowl alongside breakfast, a fruit plate or another simple snack arrangement, according to the occasion shown for the recipe.",
        tips: [
          "Measure a serving into a bowl rather than eating directly from storage.",
          "Keep dry ingredients in a clean, airtight container away from moisture.",
          "Check freshness and aroma before serving, especially for seeds or nuts.",
        ],
      };
    case "fresh":
      return {
        hook: "a fresh ready-to-eat serving with natural flavour",
        texture: "a clean, fresh serving where the ingredient's natural taste and texture stay central",
        cooking: "This recipe needs careful selection, rinsing and portioning rather than cooking. Prepare only what is needed close to serving time so the natural flavour and texture remain appealing.",
        serving: "Serve freshly prepared as a simple fruit, dairy, or ingredient-led portion according to the recipe.",
        tips: [
          "Select fresh ingredients and discard any damaged portions before serving.",
          "Wash and prepare with clean hands, utensils and drinking water.",
          "Cut or portion close to serving time for the freshest texture.",
        ],
      };
    case "soaked":
      return {
        hook: "a simple soaked serving prepared with care",
        texture: "a softly prepared portion where clean soaking supports natural flavour and texture",
        cooking: "This serving relies on rinsing and soaking rather than heat. Use clean drinking water, allow the ingredients to soften as intended, and drain before serving.",
        serving: "Serve the soaked portion fresh as a simple breakfast or snack accompaniment.",
        tips: [
          "Measure the portion before soaking so nothing is wasted.",
          "Use a clean bowl and fresh drinking water for soaking.",
          "Drain before serving and prepare a fresh portion when needed.",
        ],
      };
    case "snack":
      return {
        hook: "a satisfying bite with plenty of savoury character",
        texture: "a snack-friendly finish with a well-cooked centre and inviting surface texture",
        cooking: "Prepare the mixture evenly before shaping or portioning, then cook with controlled heat for an even finish. Resting a formed mixture briefly can make handling easier when the recipe allows.",
        serving: "Serve hot or warm with a chutney, dip and fresh garnish. It is a useful option for an evening snack plate or a shared starter.",
        tips: [
          "Keep portions similar in size so they cook at the same pace.",
          "Do not overcrowd the pan or cooking surface.",
          "Serve soon after cooking when the texture is at its best.",
        ],
      };
    case "sweet":
      return {
        hook: "a homemade sweet with familiar comfort",
        texture: "a gently sweet finish where aroma and texture are as important as sweetness",
        cooking: "Cook patiently and stir as needed to develop an even texture without catching at the base. Let the natural character of the featured ingredients remain noticeable.",
        serving: "Serve in modest portions, warm or cooled according to the dish, as an occasional ending to a home-cooked meal.",
        tips: [
          "Keep heat moderate when thickening or roasting ingredients.",
          "Taste before adding any final sweetening or garnish.",
          "Allow the dish to settle briefly before portioning for a cleaner texture.",
        ],
      };
    case "curry":
      return {
        hook: "a homestyle main with layered spice and comfort",
        texture: "a savoury, well-seasoned dish with ingredients cooked until tender",
        cooking: "Start with the aromatic base and give spices a brief moment to open before adding the principal ingredient. Cook until tender, adjusting moisture only as needed for the intended curry or dry-style finish.",
        serving: "Serve as part of a balanced home plate with roti, rice or another grain preparation and a crisp side salad.",
        tips: [
          "Keep chopped ingredients even so the dish cooks uniformly.",
          "Add powdered spices over gentle heat to avoid a harsh taste.",
          "Finish with fresh herbs only after the main cooking is complete.",
        ],
      };
    case "protein":
      return {
        hook: "a savoury dish centred on a substantial main ingredient",
        texture: "a satisfying preparation with flavour built around its central ingredient",
        cooking: "Cook the featured ingredient only as long as needed for a pleasing texture, while allowing aromatics and seasonings to coat it evenly. Steady heat helps preserve tenderness and flavour.",
        serving: "Pair with roti, rice, vegetables or salad depending on the meal. A fresh chutney or squeeze of lemon can add contrast where it suits the recipe.",
        tips: [
          "Prepare the key ingredient uniformly for even cooking.",
          "Season in layers rather than adding everything at the end.",
          "Allow a short resting minute before serving when the dish is pan-cooked.",
        ],
      };
    case "breakfast":
      return {
        hook: "an easygoing dish for a comforting start",
        texture: "a simple, homestyle preparation with balanced flavour and a satisfying bite",
        cooking: "Keep preparation organised before heating the pan, then cook gently so grains, batter or vegetables reach the right texture without becoming dry.",
        serving: "Serve warm with fruit, chutney, curd or a beverage depending on the flavour direction of the dish.",
        tips: [
          "Prepare chopped ingredients before cooking for an easy morning workflow.",
          "Keep heat moderate so textures stay soft and pleasant.",
          "Serve immediately after finishing for the most appealing bite.",
        ],
      };
    case "vegetable":
      return {
        hook: "an everyday vegetable dish with fresh flavour",
        texture: "vegetables cooked to retain character while carrying gentle seasoning",
        cooking: "Cook aromatics first where included, then add vegetables in an order that lets each reach a pleasant texture. Avoid overcooking so colour and bite remain inviting.",
        serving: "Add to a lunch or dinner plate beside roti, dal or rice, with a cool salad or curd accompaniment if desired.",
        tips: [
          "Keep vegetable pieces even for predictable cooking.",
          "Use only enough moisture to reach the intended texture.",
          "Finish seasoning after checking tenderness.",
        ],
      };
    default:
      return {
        hook: "a thoughtfully prepared everyday recipe",
        texture: "a home-cooked dish with recognisable ingredients and balanced flavour",
        cooking: "Read through the method before beginning, prepare the ingredients, and cook with steady heat or careful assembly as the dish requires. Small adjustments at the finish make the final texture more enjoyable.",
        serving: "Serve freshly prepared as part of a home meal, choosing simple accompaniments that complement rather than hide its main flavours.",
        tips: [
          "Prepare and measure ingredients before beginning.",
          "Taste and adjust seasoning near the finish.",
          "Serve at the temperature that best suits the recipe style.",
        ],
      };
  }
}

function ingredientRole(ingredient: string, index: number) {
  const value = lower(ingredient);
  if (/(chilli|pepper|ginger|garlic|spice|cumin|turmeric|coriander|cardamom|cinnamon|clove|curry leaves)/.test(value)) {
    return "Adds aroma and seasoning depth to the preparation.";
  }
  if (/(lemon|lime|tomato|yogurt|curd|vinegar)/.test(value)) {
    return "Brings brightness and balance to the finished dish.";
  }
  if (/(oil|ghee|butter)/.test(value)) {
    return "Helps ingredients cook evenly and carry flavour.";
  }
  if (index === 0) {
    return "Forms an important part of the recipe's identity and texture.";
  }
  return "Adds its own texture and familiar homemade character.";
}

function openingParagraph(family: RecipeFamily, ingredientText: string) {
  switch (family) {
    case "bread":
      return `A batter or dough based on ${ingredientText} gives this recipe its character, with a freshly cooked surface and a satisfying centre.`;
    case "curry":
      return `This recipe brings ${ingredientText} together in a warming home-style preparation where the seasoning supports, rather than hides, the main ingredients.`;
    case "salad":
      return `Its combination of ${ingredientText} creates a colourful bowl with fresh contrast, making each bite feel clear and well defined.`;
    case "beverage":
      return `The combination of ${ingredientText} shapes a freshly prepared drink with clean flavour and an easy homemade finish.`;
    case "hotDrink":
      return `The combination of ${ingredientText} creates a warm homemade drink with a pleasant aroma and an easy fresh finish.`;
    case "fresh":
      return `Its focus is ${ingredientText}, prepared simply so natural flavour, freshness and texture remain easy to enjoy.`;
    case "soaked":
      return `Made with ${ingredientText}, it is gently soaked and served simply so the ingredient remains the focus.`;
    case "snack":
      return `Together, ${ingredientText} form a savoury bite designed for a crisp or well-cooked outside and a flavourful centre.`;
    case "soup":
      return `The recipe uses ${ingredientText} to build a spoonable bowl with gentle aroma and a comforting finish.`;
    case "dip":
      return `Made with ${ingredientText}, it becomes a lively accompaniment that can lift an everyday plate.`;
    default:
      return `Made with ${ingredientText}, this recipe keeps its key flavours easy to recognise and enjoyable at the table.`;
  }
}

function whyParagraph(family: RecipeFamily) {
  switch (family) {
    case "bread":
      return "The pleasure of this recipe is in the contrast between a tender interior and a surface cooked over steady heat. The main flour, lentil or vegetable component establishes the texture, while aromatics make every portion more inviting.";
    case "curry":
      return "A good home-style main depends on timing: the foundational ingredients need to soften properly, while aromatics and spices are given enough heat to round out the flavour. That sequence produces a dish that feels coherent rather than hurried.";
    case "salad":
      return "Here the ingredients matter in their freshest form. Keeping the cuts even and seasoning close to serving preserves contrast, colour and a clean bite from the first forkful to the last.";
    case "beverage":
      return "Fresh preparation makes the difference in a drink like this. Good ingredients, a considered consistency and careful final tasting allow its aroma and natural character to come through clearly.";
    case "hotDrink":
      return "A hot drink becomes more enjoyable when its strength, sweetness and aroma are kept in balance. Gentle heating and prompt serving let the freshly brewed character stay clear.";
    case "snack":
      return "The appeal is in shaping and cooking the mixture evenly, so each portion carries similar texture and seasoning. It is the kind of recipe where small handling details noticeably improve the final bite.";
    case "soup":
      return "The flavour develops as ingredients soften and mingle over a gentle simmer. Paying attention to consistency near the end gives the bowl its comforting texture without masking its main ingredients.";
    case "dip":
      return "An accompaniment becomes memorable when fresh notes and seasoning stay in balance. Blend or combine the ingredients until spoonable, then taste at the finish so the dip supports the food served alongside it.";
    case "fresh":
      return "This serving is useful because it does not need complicated cooking. Clean handling, an appropriate portion and preparation near serving time keep its natural character clear.";
    case "soaked":
      return "This simple serving depends on clean preparation and enough soaking time for a pleasant softened bite. Preparing only the needed portion keeps it fresh and practical.";
    default:
      return "The appeal of this recipe lies in the way familiar ingredients are prepared with care. Follow the stated quantities and method first, then make small seasoning adjustments only at the finish.";
  }
}

function servingFinish(family: RecipeFamily) {
  switch (family) {
    case "bread":
      return "Keep the accompanying flavours bright and simple so the freshly cooked bread remains the focus.";
    case "curry":
      return "Choose accompaniments that make it easy to enjoy the gravy or cooked masala with each serving.";
    case "salad":
      return "Serve soon after assembling so the textures stay fresh and distinct.";
    case "beverage":
      return "Pour and serve soon after preparation so its aroma and freshness remain at their best.";
    case "hotDrink":
      return "Pour into cups and serve while warm so its aroma remains inviting.";
    case "fresh":
      return "Serve soon after preparing so freshness, colour and texture remain at their best.";
    case "soaked":
      return "Serve after draining, while the soaked texture is fresh and pleasant.";
    case "snack":
      return "A freshly served portion will show its texture and seasoning most clearly.";
    case "soup":
      return "Serve while warm so the aroma and final texture are easy to appreciate.";
    default:
      return "Simple accompaniments let the recipe's main ingredients remain clear on the plate.";
  }
}

function planningParagraph(family: RecipeFamily) {
  switch (family) {
    case "salad":
      return "Wash and dry fresh components before cutting, and keep them separate until close to serving if you are preparing ahead. This small step protects both crunch and appearance, especially when the salad contains ingredients that can release moisture after seasoning.";
    case "beverage":
      return "Arrange the ingredients and serving glasses before you begin, especially when the drink is intended to be served fresh. If preparation is done in advance, keep it covered and chilled only for as long as the ingredients remain bright and appealing.";
    case "hotDrink":
      return "Measure the ingredients before heating so brewing is unhurried. Prepare the drink near serving time and pour it into clean cups while warm, when its aroma and flavour are most enjoyable.";
    case "dip":
      return "For advance preparation, use a clean covered container and keep the accompaniment chilled until it is needed. Stir once before serving and check the texture; a dip should remain spoonable and easy to portion beside the main dish.";
    case "pantry":
      return "Portion only what is required for serving and keep the remainder clean, dry and well covered. A simple ingredient-led recipe is at its best when freshness, aroma and texture have been protected before it reaches the plate.";
    case "fresh":
      return "Choose a fresh portion, wash it safely where appropriate, and prepare it shortly before eating. Keeping the process simple protects natural texture and keeps the serving inviting.";
    case "soaked":
      return "Rinse the measured portion and soak it in clean drinking water for the intended time. Drain before serving and avoid keeping a prepared portion at room temperature longer than needed.";
    case "soup":
      return "If preparing the bowl ahead, complete the cooking first and cool it safely before covering. When reheating, warm it gently and adjust consistency only at the finish, since soups can thicken slightly as they rest.";
    default:
      return "Read through the complete method before heating the pan and arrange measured ingredients within reach. If parts of the dish are prepared in advance, keep them covered and combine or reheat gently near serving time so the intended texture remains inviting.";
  }
}

function shortMetaDescription(recipe: RecipeContentRecord, family: RecipeFamily) {
  const keyIngredients = listText(
    recipe.ingredients.map(displayIngredient).slice(0, 2),
    "everyday ingredients"
  );
  const meal = recipe.mealTimes[0]?.title.replace(/^mid morning$/i, "mid-morning");
  const ending = meal ? ` for ${meal.toLowerCase()}` : " for your table";
  const method =
    family === "beverage" || family === "fresh" || family === "hotDrink" || family === "soaked"
      ? "fresh preparation"
      : "serving";
  const candidate = `${recipe.title} recipe with ${keyIngredients}. Follow clear steps, practical timing and home-style ${method} ideas${ending}.`;
  return candidate.length <= 155
    ? candidate
    : `${recipe.title} recipe with clear steps, practical timing and serving ideas for a homemade result.`;
}

function metaTitle(recipe: RecipeContentRecord) {
  const candidate = `${recipe.title} Recipe | Kya Khayen`;
  return candidate.length <= 60 ? candidate : `${recipe.title} Recipe`.slice(0, 60).trim();
}

function methodSummary(recipe: RecipeContentRecord) {
  const step = recipe.steps.map(cleanText).find(Boolean);
  if (!step) return null;
  const short = (step.length > 175 ? `${step.slice(0, 172).trim()}...` : step).replace(/[.\s]+$/, "");
  return `One useful cue from the method is to ${short.charAt(0).toLowerCase()}${short.slice(1)}`;
}

function relatedParagraph(related: RelatedContentLink[]) {
  if (related.length === 0) {
    return "Browse more home-cooking ideas in the recipe collection to build a plate around flavours you enjoy.";
  }
  const links = related.map(
    (recipe) => `<a href="/${escapeHtml(recipe.slug)}">${escapeHtml(recipe.title)}</a>`
  );
  return `Continue exploring with ${listText(links, "more recipe ideas")}. These recipes share useful flavours, meal occasions or cooking inspiration with this dish.`;
}

export function generateRecipeContent(
  recipe: RecipeContentRecord,
  related: RelatedContentLink[]
): GeneratedRecipeContent {
  const family = familyOf(recipe);
  const copy = familyCopy(family);
  const title = escapeHtml(recipe.title);
  const ingredients = [...new Set(recipe.ingredients.map(displayIngredient))].slice(0, 5);
  const ingredientText = listText(ingredients.slice(0, 4), "carefully chosen everyday ingredients");
  const meals = listText(
    recipe.mealTimes.map((value) => value.title.replace(/^mid morning$/i, "mid-morning")).slice(0, 3),
    "an everyday meal"
  );
  const technique =
    recipe.cookingMethods[0]?.title ??
    (family === "salad"
      ? "fresh assembly"
      : family === "beverage"
        ? "blending or infusion"
      : family === "pantry"
          ? "simple assembly and portioning"
      : family === "fresh"
          ? "clean preparation and serving"
        : family === "hotDrink"
          ? "gentle brewing or simmering"
        : family === "soaked"
          ? "rinsing and soaking"
        : family === "bread"
          ? "mixing and griddle cooking"
          : "step-by-step home cooking");
  const totalTime = recipe.prepTime + recipe.cookTime + recipe.restTime;
  const timeSentence = totalTime > 0
    ? `The recorded preparation and cooking flow takes about ${totalTime} minutes, making it a practical option for ${meals.toLowerCase()}.`
    : `It is suited to ${meals.toLowerCase()}, with a method that rewards an organised mise en place.`;
  const stepSentence = methodSummary(recipe);
  const tips = copy.tips
    .map((tip) => `<li>${escapeHtml(tip)}</li>`)
    .join("");
  const ingredientItems = ingredients.length
    ? ingredients.map((ingredient, index) => `<li><strong>${escapeHtml(ingredient)}:</strong> ${escapeHtml(ingredientRole(ingredient, index))}</li>`).join("")
    : "<li><strong>Preparation first:</strong> Check the ingredient list and arrange everything before beginning the method.</li>";
  const content = [
    `<h2>${title}: ${escapeHtml(copy.hook)}</h2>`,
    `<p><strong>${title}</strong> is ${escapeHtml(copy.texture)}. ${escapeHtml(openingParagraph(family, ingredientText))}</p>`,
    `<p>${escapeHtml(timeSentence)} Always use the ingredient list itself when checking whether this dish matches your food preferences.</p>`,
    `<h3>What makes this ${escapeHtml(recipe.title)} recipe special</h3>`,
    `<p>${escapeHtml(whyParagraph(family))}</p>`,
    `<ul>${ingredientItems}</ul>`,
    `<h3>Cooking approach and texture</h3>`,
    `<p>The technique here centres on ${escapeHtml(technique.toLowerCase())}. ${escapeHtml(copy.cooking)}</p>`,
    stepSentence ? `<p>${escapeHtml(stepSentence)}. Continue through the remaining steps in order so the ingredients come together with a more consistent finish.</p>` : "",
    `<h3>Planning and preparation notes</h3>`,
    `<p>${escapeHtml(planningParagraph(family))}</p>`,
    `<h3>Kitchen tips for a better result</h3>`,
    `<ul>${tips}</ul>`,
    `<h3>How to serve ${title}</h3>`,
    `<p>${escapeHtml(copy.serving)} ${escapeHtml(servingFinish(family))}</p>`,
    `<h3>Explore related recipes</h3>`,
    `<p>${relatedParagraph(related)}</p>`,
    `<blockquote><p>Cook with the ingredient list and method as your primary guide; tags on Kya Khayen help with discovery and everyday preference-based planning, not medical advice.</p></blockquote>`,
  ].filter(Boolean).join("\n");

  return {
    description: content,
    metaTitle: metaTitle(recipe),
    metaDescription: shortMetaDescription(recipe, family),
    wordCount: cleanText(content).split(/\s+/).filter(Boolean).length,
  };
}

function overlap(left: string[], right: string[]) {
  const candidates = new Set(right);
  return left.filter((value) => candidates.has(value)).length;
}

export function findRelatedContentLinks(
  current: RecipeContentRecord,
  candidates: RecipeContentRecord[],
  limit = 3
): RelatedContentLink[] {
  const currentCuisine = current.cuisines.map((value) => value.title);
  const currentMeals = current.mealTimes.map((value) => value.title);
  const currentTypes = current.recipeTypes.map((value) => value.title);
  const currentIngredients = current.ingredients.map(lower);
  const baseTitle = lower(current.title);

  return candidates
    .filter(
      (candidate) =>
        candidate.isPublished &&
        candidate.id !== current.id &&
        lower(candidate.title) !== baseTitle
    )
    .map((candidate) => ({
      candidate,
      score:
        overlap(currentCuisine, candidate.cuisines.map((value) => value.title)) * 5 +
        overlap(currentTypes, candidate.recipeTypes.map((value) => value.title)) * 5 +
        overlap(currentMeals, candidate.mealTimes.map((value) => value.title)) * 2 +
        overlap(currentIngredients, candidate.ingredients.map(lower)) * 2 +
        Number(current.category?.title === candidate.category?.title) * 2,
    }))
    .sort(
      (left, right) =>
        right.score - left.score || left.candidate.title.localeCompare(right.candidate.title)
    )
    .reduce<RelatedContentLink[]>((links, { candidate }) => {
      if (
        links.length < limit &&
        !links.some((link) => lower(link.title) === lower(candidate.title))
      ) {
        links.push({ title: candidate.title, slug: candidate.slug });
      }
      return links;
    }, []);
}
