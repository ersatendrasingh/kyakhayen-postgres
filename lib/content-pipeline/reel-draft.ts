export type PipelineRecipe = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  category: string | null;
  cuisines: string[];
  totalMinutes: number | null;
  ingredients: string[];
  methods: Array<{
    title: string;
    description: string | null;
  }>;
};

export type ReelScene = {
  id: string;
  seconds: string;
  label: string;
  text: string;
  voiceoverLine: string;
  speechLine: string;
  visual: string;
};

export type ContentDraft = {
  id: string;
  recipeId: string | null;
  customContentType?: "ready_reel" | "post";
  recipeTitle: string;
  recipeUrl: string;
  imageUrl: string | null;
  status: "pending" | "approved" | "needs_edit";
  platforms: string[];
  hook: string;
  durationSeconds: number;
  scenes: ReelScene[];
  voiceover: string;
  voiceoverSpeech: string;
  instagramCaption: string;
  youtubeTitle: string;
  youtubeDescription: string;
  facebookPost: string;
  xPost: string;
  linkedinPost: string;
  pinterestTitle: string;
  pinterestDescription: string;
  hashtags: string[];
  renderSpec: {
    format: "1080x1920";
    template: string;
    assets: Array<{
      type: "image" | "voiceover" | "music";
      value: string;
    }>;
  };
};

const SITE_URL = "https://www.kyakhayen.com";

function cleanTitle(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function titleToHashtag(title: string) {
  return title
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
}

function compactList(items: string[], max = 3) {
  return items
    .map(simplifyIngredientName)
    .filter(Boolean)
    .slice(0, max);
}

function stripHtml(value: string | null | undefined) {
  return (value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function shortText(value: string, max = 72) {
  const clean = stripHtml(value);
  return clean.length > max ? `${clean.slice(0, max - 1).trim()}...` : clean;
}

function simplifyIngredientName(value: string) {
  return stripHtml(value)
    .replace(/^\d+(\.\d+)?\s*/i, "")
    .replace(/^(g|kg|ml|l|cup|cups|tbsp|tsp|pinch|no|nos|piece|pieces)\s+/i, "")
    .replace(
      /^(raw|fresh|dried|whole|powdered|chopped|finely|paste|cubes|pureed)\s+/i,
      ""
    )
    .replace(
      /^(raw|fresh|dried|whole|powdered|chopped|finely|paste|cubes|pureed)\s+/i,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();
}

type RecipeMode = "dessert" | "drink" | "curry" | "generic";

function recipeMode(title: string, recipe: PipelineRecipe): RecipeMode {
  const text = `${title} ${recipe.category ?? ""} ${recipe.ingredients.join(" ")}`.toLowerCase();

  if (
    /(dessert|sweet|cake|chocolate|brownie|cookie|halwa|kheer|laddu|ladoo|barfi|ice cream|pudding|rabri|gulab jamun|rasmalai|jalebi|mousse|custard|payasam)/.test(
      text
    )
  ) {
    return "dessert";
  }

  if (/(water|tea|infusion|smoothie|juice|lassi|drink|detox|sharbat|kadha)/.test(text)) {
    return "drink";
  }

  if (/(paneer|masala|curry|sabzi|dal|chole|bhature|bhurji|gravy)/.test(text)) {
    return "curry";
  }

  return "generic";
}

function readableJoin(items: string[], fallback: string) {
  return items.length ? items.join(" + ") : fallback;
}

function minutesSpeech(totalMinutes: number | null) {
  if (!totalMinutes) return "Yeh ek easy homemade plan hai.";
  return `Sirf ${totalMinutes} minute ka plan hai.`;
}

function ingredientSpeech(items: string[], mode: RecipeMode) {
  if (mode === "dessert") {
    return "Thodi sweetness, creamy texture, aur woh comfort wali khushboo chahiye.";
  }

  if (mode === "drink") {
    return "Iske liye warm water, simple spices, aur ek slow sa mood chahiye.";
  }

  if (!items.length) return "Iske liye fresh ingredients, simple spices, aur thoda patience chahiye.";

  return `Main ingredients: ${items.slice(0, 3).join(", ")}... aur baaki ka magic heat karti hai.`;
}

function buildHashtags(recipe: PipelineRecipe) {
  const tags = [
    titleToHashtag(recipe.title),
    `${titleToHashtag(recipe.title)}Recipe`,
    recipe.category ? titleToHashtag(recipe.category) : "",
    ...recipe.cuisines.map(titleToHashtag),
    "IndianFood",
    "DinnerRecipe",
    "VegetarianRecipe",
    "Kyakhayen",
  ];

  return Array.from(new Set(tags.filter(Boolean))).slice(0, 12);
}

function formatHashtags(hashtags: string[]) {
  return hashtags.map((tag) => `#${tag}`).join(" ");
}

function socialOpening(title: string, mode: RecipeMode) {
  if (mode === "dessert") return `${title} for the craving that never asks permission.`;
  if (mode === "drink") return `${title} for slow mornings and softer pauses.`;
  if (mode === "curry") return `${title} for that restaurant-style dinner craving.`;
  return `${title} for the days when a simple plate can fix the mood.`;
}

function socialBody(mode: RecipeMode) {
  if (mode === "dessert") {
    return "Creamy, sweet, and exactly the kind of idea you save before the next craving arrives.";
  }

  if (mode === "drink") {
    return "Warm, light, and easy to save for the next time you want something soothing.";
  }

  if (mode === "curry") {
    return "Comforting, flavorful, and simple enough to make at home without overthinking dinner.";
  }

  return "A practical recipe idea with clean steps, good flavor, and a reason to save it.";
}

export function buildContentDraft(recipe: PipelineRecipe): ContentDraft {
  const title = cleanTitle(recipe.title);
  const recipeUrl = `${SITE_URL}/${recipe.slug}`;
  const mode = recipeMode(title, recipe);
  const ingredients = compactList(recipe.ingredients, 5);
  const heroIngredients = compactList(recipe.ingredients, 3);
  const timeText = recipe.totalMinutes
    ? `Ready in ${recipe.totalMinutes} min`
    : "Easy homemade recipe";
  const timeScreenText = recipe.totalMinutes ? `${recipe.totalMinutes} min plan` : "Easy plan";
  const hook =
    mode === "dessert"
      ? `Sirf ek bite: ${title}`
      : mode === "drink"
        ? `Bas ek sip: ${title}`
        : mode === "curry"
          ? `Restaurant craving: ${title}`
          : `Aaj kya khayen: ${title}`;

  const ingredientText = readableJoin(
    heroIngredients,
    mode === "dessert"
      ? "Cream + sweetness + comfort"
      : mode === "drink"
        ? "Warm water + simple spices"
        : "Fresh ingredients + simple spices"
  );
  const scenes: ReelScene[] =
    mode === "dessert"
      ? [
          {
            id: "hook",
            seconds: "0-6",
            label: "Hook",
            text: "Sirf ek bite",
            voiceoverLine:
              "Sirf ek bite... aur phir wahi jhooth jo hum sab khud se bolte hain.",
            speechLine:
              "Sirf ek bite... aur phir wahi jhooth jo hum sab khud se bolte hain.",
            visual: "Dessert close-up with a slow, tempting push-in",
          },
          {
            id: "time",
            seconds: "6-12",
            label: "Timing",
            text: "Kal se diet?",
            voiceoverLine: `"Aaj kha leta hoon, kal se diet pakka." ${minutesSpeech(
              recipe.totalMinutes
            )}`,
            speechLine: `"Aaj kha leta hoon, kal se diet pakka." ${minutesSpeech(
              recipe.totalMinutes
            )}`,
            visual: "Timer badge lands over the plated dessert",
          },
          {
            id: "ingredients",
            seconds: "12-18",
            label: "Ingredients",
            text: "Creamy craving",
            voiceoverLine: `Lekin phir ${title} ka texture, ${ingredientText} wali richness, aur woh meethi khushboo...`,
            speechLine: `Lekin phir ${title} ka texture, ${ingredientText} wali richness, aur woh meethi khushboo...`,
            visual: "Ingredient words fade in like craving thoughts",
          },
          {
            id: "cook",
            seconds: "18-24",
            label: "Build",
            text: "Monday shift",
            voiceoverLine:
              "Bas yahin par plan hil jaata hai, aur diet seedha Monday par shift.",
            speechLine:
              "Bas yahin par plan hil jaata hai, aur diet seedha Monday par shift.",
            visual: "Soft steam or shine pass across the dessert image",
          },
          {
            id: "finish",
            seconds: "24-30",
            label: "Craving",
            text: "Kaun strong?",
            voiceoverLine:
              "Sach batao... aisi dessert craving ke saamne kaun strong reh sakta hai?",
            speechLine:
              "Sach batao... aisi dessert craving ke saamne kaun strong reh sakta hai?",
            visual: "Final plated crop with slight handheld-style motion",
          },
          {
            id: "cta",
            seconds: "30-36",
            label: "CTA",
            text: "Save for cravings",
            voiceoverLine:
              "Cravings kabhi bata kar nahi aati. Save kar lo... aur jab samajh na aaye Kya Khayen, jawab Kyakhayen par milega.",
            speechLine:
              "Cravings kabhi bata kar nahi aati. Save kar lo... aur jab samajh na aaye Kya Khayen, jawab Kyakhayen par milega.",
            visual: "Logo, save prompt, and final dessert hero shot",
          },
        ]
      : mode === "drink"
        ? [
            {
              id: "hook",
              seconds: "0-6",
              label: "Hook",
              text: "Bas ek sip",
              voiceoverLine:
                "Bas ek sip... aur slow morning thodi softer lagne lagti hai.",
              speechLine:
                "Bas ek sip... aur slow morning thodi softer lagne lagti hai.",
              visual: "Warm cup close-up with steam and slow zoom",
            },
            {
              id: "time",
              seconds: "6-12",
              label: "Timing",
              text: timeScreenText,
              voiceoverLine: `${title} ka yeh ${minutesSpeech(
                recipe.totalMinutes
              )} Mood kaafi der tak settle rehta hai.`,
              speechLine: `${title} ka yeh ${minutesSpeech(
                recipe.totalMinutes
              )} Mood kaafi der tak settle rehta hai.`,
              visual: "Timer badge with a calm side pan",
            },
            {
              id: "ingredients",
              seconds: "12-18",
              label: "Ingredients",
              text: shortText(ingredientText, 42),
              voiceoverLine: ingredientSpeech(ingredients, mode),
              speechLine: ingredientSpeech(ingredients, mode),
              visual: "Ingredient names appear one by one",
            },
            {
              id: "steep",
              seconds: "18-24",
              label: "Steep",
              text: "Steep and breathe",
              voiceoverLine:
                "Inhe kuch minute steep hone do, taaki flavor cup mein araam se utar aaye.",
              speechLine:
                "Inhe kuch minute steep hone do, taaki flavor cup mein araam se utar aaye.",
              visual: "Steam overlay, slow crop, and gentle light pass",
            },
            {
              id: "serve",
              seconds: "24-30",
              label: "Serve",
              text: "Serve warm",
              voiceoverLine:
                "Ab strain karo, sip lo, aur phone ko thodi der side par rakho.",
              speechLine:
                "Ab strain karo, sip lo, aur phone ko thodi der side par rakho.",
              visual: "Final cup crop with soft motion",
            },
            {
              id: "cta",
              seconds: "30-36",
              label: "CTA",
              text: "Save this sip",
              voiceoverLine:
                "Aise simple ideas ke liye video save kar lo. Jab socho Kya Khayen, Kyakhayen yaad rakhna.",
              speechLine:
                "Aise simple ideas ke liye video save kar lo. Jab socho Kya Khayen, Kyakhayen yaad rakhna.",
              visual: "Logo, save prompt, and warm final image",
            },
          ]
        : mode === "curry"
          ? [
              {
                id: "hook",
                seconds: "0-6",
                label: "Hook",
                text: "Restaurant craving",
                voiceoverLine:
                  "Sirf ek spoon... aur restaurant wali craving seedha ghar aa jaati hai.",
                speechLine:
                  "Sirf ek spoon... aur restaurant wali craving seedha ghar aa jaati hai.",
                visual: "Final curry image with glossy slow zoom",
              },
              {
                id: "time",
                seconds: "6-12",
                label: "Timing",
                text: timeScreenText,
                voiceoverLine: `Dinner ka stress? ${minutesSpeech(
                  recipe.totalMinutes
                )} Yeh plan kaafi handle ho sakta hai.`,
                speechLine: `Dinner ka stress? ${minutesSpeech(
                  recipe.totalMinutes
                )} Yeh plan kaafi handle ho sakta hai.`,
                visual: "Timer badge over a warm pan crop",
              },
              {
                id: "ingredients",
                seconds: "12-18",
                label: "Ingredients",
                text: shortText(ingredientText, 42),
                voiceoverLine: ingredientSpeech(ingredients, mode),
                speechLine: ingredientSpeech(ingredients, mode),
                visual: "Ingredient names pop in with a spice sprinkle motion",
              },
              {
                id: "cook",
                seconds: "18-24",
                label: "Cook",
                text: "Glossy masala",
                voiceoverLine:
                  "Onion tomato masala ko glossy hone do; wahi gravy ka real mood set karta hai.",
                speechLine:
                  "Onion tomato masala ko glossy hone do; wahi gravy ka real mood set karta hai.",
                visual: "Warm steam overlay on the recipe image",
              },
              {
                id: "finish",
                seconds: "24-30",
                label: "Finish",
                text: "Simmer slow",
                voiceoverLine:
                  "Paneer ya main ingredient ko gently simmer karo, taaki flavor andar tak jaaye.",
                speechLine:
                  "Paneer ya main ingredient ko gently simmer karo, taaki flavor andar tak jaaye.",
                visual: "Close crop with garnish focus",
              },
              {
                id: "cta",
                seconds: "30-36",
                label: "CTA",
                text: "Dinner sorted",
                voiceoverLine:
                  "Save kar lo. Aaj dinner ka sawaal aaye, toh Kya Khayen ka jawab ready rahe.",
                speechLine:
                  "Save kar lo. Aaj dinner ka sawaal aaye, toh Kya Khayen ka jawab ready rahe.",
                visual: "Final dish with logo and save prompt",
              },
            ]
          : [
              {
                id: "hook",
                seconds: "0-6",
                label: "Hook",
                text: shortText(hook, 42),
                voiceoverLine:
                  "Kabhi kabhi ek simple plate hi poora mood reset kar deti hai.",
                speechLine:
                  "Kabhi kabhi ek simple plate hi poora mood reset kar deti hai.",
                visual: "Final dish image with slow zoom",
              },
              {
                id: "time",
                seconds: "6-12",
                label: "Timing",
                text: timeScreenText,
                voiceoverLine: `Busy day ho ya sudden craving, ${minutesSpeech(
                  recipe.totalMinutes
                )} Yeh idea kaam aa sakta hai.`,
                speechLine: `Busy day ho ya sudden craving, ${minutesSpeech(
                  recipe.totalMinutes
                )} Yeh idea kaam aa sakta hai.`,
                visual: "Dish image pan with timer badge",
              },
              {
                id: "ingredients",
                seconds: "12-18",
                label: "Ingredients",
                text: shortText(ingredientText, 42),
                voiceoverLine: ingredientSpeech(ingredients, mode),
                speechLine: ingredientSpeech(ingredients, mode),
                visual: "Ingredient names pop in one by one",
              },
              {
                id: "cook",
                seconds: "18-24",
                label: "Cook",
                text: "Flavor build",
                voiceoverLine:
                  "Steps simple rakho, heat steady rakho, aur flavor ko jaldi mat karo.",
                speechLine:
                  "Steps simple rakho, heat steady rakho, aur flavor ko jaldi mat karo.",
                visual: "Warm steam overlay on recipe image",
              },
              {
                id: "finish",
                seconds: "24-30",
                label: "Finish",
                text: "First bite",
                voiceoverLine:
                  "Serve karte hi woh first bite wala silence aa jaata hai.",
                speechLine:
                  "Serve karte hi woh first bite wala silence aa jaata hai.",
                visual: "Close crop with garnish focus",
              },
              {
                id: "cta",
                seconds: "30-36",
                label: "CTA",
                text: "Save the idea",
                voiceoverLine:
                  "Video save kar lo. Jab agla sawaal aaye, Kya Khayen, toh jawab ready milega.",
                speechLine:
                  "Video save kar lo. Jab agla sawaal aaye, Kya Khayen, toh jawab ready milega.",
                visual: "Final dish with logo and save prompt",
              },
            ];

  const voiceover = scenes.map((scene) => scene.voiceoverLine).join(" ");
  const voiceoverSpeech = scenes.map((scene) => scene.speechLine).join(" ");

  const hashtags = buildHashtags(recipe);
  const primaryHashtags = formatHashtags(hashtags.slice(0, 6));
  const compactHashtags = formatHashtags(hashtags.slice(0, 4));
  const captionIntro = socialOpening(title, mode);
  const captionBody = socialBody(mode);
  const caption = [
    captionIntro,
    "",
    captionBody,
    "",
    `Full recipe: ${recipeUrl}`,
    "",
    primaryHashtags,
  ].join("\n");
  const facebookPost = [
    captionIntro,
    "",
    captionBody,
    "",
    `Full recipe: ${recipeUrl}`,
    "",
    primaryHashtags,
  ]
    .filter(Boolean)
    .join("\n");
  const xPost = [
    `${captionIntro} ${timeText}.`,
    `Full recipe: ${recipeUrl}`,
    compactHashtags,
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 275);
  const linkedinPost = [
    captionIntro,
    "",
    captionBody,
    "",
    `Read the full recipe: ${recipeUrl}`,
    "",
    primaryHashtags,
  ]
    .filter(Boolean)
    .join("\n");
  const youtubeDescription = [
    captionIntro,
    "",
    captionBody,
    "",
    `Full recipe: ${recipeUrl}`,
    "",
    primaryHashtags,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    id: `draft-${recipe.id}`,
    recipeId: recipe.id,
    recipeTitle: title,
    recipeUrl,
    imageUrl: recipe.imageUrl,
    status: "pending",
    platforms: [
      "Instagram Reel",
      "Facebook Reel",
      "YouTube Short",
      "Facebook Post",
      "Pinterest Pin",
      "X Post",
      "LinkedIn Post",
    ],
    hook,
    durationSeconds: 36,
    scenes,
    voiceover,
    voiceoverSpeech,
    instagramCaption: caption,
    youtubeTitle: `${title} | Quick Recipe | Kyakhayen`,
    youtubeDescription,
    facebookPost,
    xPost,
    linkedinPost,
    pinterestTitle: `${title} Recipe`,
    pinterestDescription: `${hook}. ${timeText}. Save this easy recipe idea from Kyakhayen: ${recipeUrl}`,
    hashtags,
    renderSpec: {
      format: "1080x1920",
      template: "recipe-image-text-voiceover-v1",
      assets: [
        ...(recipe.imageUrl ? [{ type: "image" as const, value: recipe.imageUrl }] : []),
        { type: "voiceover", value: voiceoverSpeech },
        { type: "music", value: "light-indian-instrumental" },
      ],
    },
  };
}
