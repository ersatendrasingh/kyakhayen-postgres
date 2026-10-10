import type { SituationKey } from "@/components/sections/situation-tools/types";

export type ToolPageConfig = {
  slug: string;
  href: string;
  mode: SituationKey;
  title: string;
  shortTitle: string;
  eyebrow: string;
  seoTitle: string;
  heroTitle: string;
  heroLead: string;
  description: string;
  intro: string;
  keywords: string[];
  defaultMealFocus?: string;
  defaultGuestCount?: number;
  defaultGuestPlan?: string;
  defaultBudget?: number;
  defaultFoodType?: string;
  highlights: string[];
  popularSearches: Array<{ label: string; href: string }>;
  featuredSearch: {
    eyebrow: string;
    title: string;
    body: string;
    href: string;
    cta: string;
    chips: string[];
  };
  readySearches: Array<{
    eyebrow: string;
    title: string;
    body: string;
    href: string;
  }>;
  howTo: {
    title: string;
    body: string;
    chips: string[];
    steps: Array<{ title: string; body: string }>;
  };
  questionPrompts: string[];
  useCases: Array<{ title: string; body: string }>;
  faqs: Array<{ question: string; answer: string }>;
};

export type InteractiveToolPageConfig = ToolPageConfig & {
  mode: Exclude<SituationKey, "ingredients">;
};

export const toolPages: ToolPageConfig[] = [
  {
    slug: "smart-recipe-finder",
    href: "/tools/smart-recipe-finder",
    mode: "ingredients",
    title: "Smart Recipe Finder",
    shortTitle: "Recipe Finder",
    eyebrow: "Smart recipe finder",
    seoTitle: "Smart Recipe Finder: Find Recipes by Ingredients",
    heroTitle: "Find recipes from the ingredients already at home.",
    heroLead:
      "Search the food sitting in your kitchen and open recipe ideas that fit today, from leftover rice to bottle gourd, potato, curd, lentils, spinach, and cauliflower.",
    description:
      "Find recipes by ingredients you already have at home, from bottle gourd and potato to leftover rice, curd, lentils, and vegetables.",
    intro:
      "Search bottle gourd, potato, rice, lentils, spinach, cauliflower, curd, leftovers, or anything available at home.",
    keywords: [
      "smart recipe finder",
      "what can I cook with ingredients",
      "what can I make with ingredients I have",
      "recipe finder by ingredients",
      "recipes by ingredients",
      "cook with what you have",
      "what to cook with ingredients at home",
      "Indian recipe finder by ingredients",
    ],
    highlights: ["Ingredients", "Recipe finder", "Shareable ideas"],
    popularSearches: [
      {
        label: "What can I cook with potato and onion?",
        href: "/tools/smart-recipe-finder?ingredients=potato%2Conion#fridge-tool",
      },
      {
        label: "Recipes with leftover rice",
        href: "/tools/smart-recipe-finder?ingredients=rice#fridge-tool",
      },
      {
        label: "Bottle gourd dinner ideas",
        href: "/tools/smart-recipe-finder?ingredients=bottle%20gourd#fridge-tool",
      },
    ],
    featuredSearch: {
      eyebrow: "Use it first",
      title: "Bottle gourd is still in the fridge.",
      body: "Open bottle gourd ideas, then add lentils, tomato, onion, or curd to tighten the recipe matches for lunch or dinner.",
      href: "/tools/smart-recipe-finder?ingredients=bottle%20gourd#fridge-tool",
      cta: "Open bottle gourd ideas",
      chips: ["Opens finder", "Add support items", "Recipe cards"],
    },
    readySearches: [
      {
        eyebrow: "Everyday veg",
        title: "Potato + onion ideas",
        body: "A practical search when the kitchen has only the basics and dinner still needs a plan.",
        href: "/tools/smart-recipe-finder?ingredients=potato%2Conion#fridge-tool",
      },
      {
        eyebrow: "Gravy starter",
        title: "Onion + tomato base",
        body: "Useful for quick Indian gravies, sabzi, and curry-style recipe ideas.",
        href: "/tools/smart-recipe-finder?ingredients=onion%2Ctomato#fridge-tool",
      },
      {
        eyebrow: "Leftover rescue",
        title: "Leftover rice ideas",
        body: "Turn cooked rice into lunch, dinner, or one-pot recipe ideas without starting from zero.",
        href: "/tools/smart-recipe-finder?ingredients=rice#fridge-tool",
      },
    ],
    howTo: {
      title: "Search ingredients first, recipes second.",
      body: "Use the tool when you are not sure what to make. Add what is available at home and let recipe cards narrow the options.",
      chips: ["One ingredient", "Better combo", "Open recipe"],
      steps: [
        {
          title: "Search what is actually in your kitchen",
          body: "Type a real ingredient instead of a recipe name, such as bottle gourd, potato, rice, lentils, curd, cauliflower, or spinach.",
        },
        {
          title: "Add one supporting item",
          body: "Add onion, tomato, curd, peas, or lentils when they are available so the result list becomes more useful.",
        },
        {
          title: "Open a recipe that can be cooked today",
          body: "Recipe cards show image, time, cuisine, and useful detail so the decision is quick.",
        },
      ],
    },
    questionPrompts: [
      "what can I cook with bottle gourd",
      "what can I make with potato and onion",
      "leftover rice lunch ideas",
      "spinach recipes for dinner",
    ],
    useCases: [
      {
        title: "When the fridge has random ingredients",
        body: "Start with the ingredient that needs to be used first, then add one support item for tighter recipe matches.",
      },
      {
        title: "When you do not know the recipe name",
        body: "Search by ingredients instead of guessing a dish name. The tool returns real recipe cards from the collection.",
      },
    ],
    faqs: [
      {
        question: "How does the ingredient recipe finder work?",
        answer:
          "Add ingredients available in your kitchen, choose food type, and open matching Indian recipe cards from Kya Khayen.",
      },
      {
        question: "Can I add more than one ingredient?",
        answer:
          "Yes. Add a main ingredient and supporting ingredients to make the recipe matches tighter.",
      },
    ],
  },
  {
    slug: "smart-daily-menu",
    href: "/tools/smart-daily-menu",
    mode: "daily",
    title: "Smart Daily Menu",
    shortTitle: "Daily Menu",
    eyebrow: "Daily meal tool",
    seoTitle: "Smart Daily Menu: What to Cook Today",
    heroTitle: "Plan breakfast, lunch, or dinner without overthinking it.",
    heroLead:
      "Pick the meal slot and get Indian recipe ideas for the day. Useful when the question is simple but the answer keeps changing: breakfast, lunch, dinner, or any meal.",
    description:
      "Choose breakfast, lunch, dinner, or any meal and get recipe ideas for today from real Indian recipes.",
    intro:
      "Pick a meal slot and browse recipe ideas that fit the moment, from breakfast to dinner.",
    keywords: [
      "smart daily menu",
      "what to cook today",
      "what should I cook today",
      "today dinner ideas",
      "today meal ideas",
      "what to make for lunch today",
      "breakfast lunch dinner recipes",
      "Indian meal planner",
      "daily meal ideas India",
    ],
    defaultMealFocus: "full-day",
    highlights: ["Breakfast", "Lunch", "Dinner"],
    popularSearches: [
      { label: "Breakfast ideas for today", href: "/tools/smart-daily-menu" },
      { label: "Lunch recipes for today", href: "/tools/smart-daily-menu" },
      { label: "Dinner ideas tonight", href: "/tools/smart-daily-menu" },
    ],
    featuredSearch: {
      eyebrow: "Daily decision",
      title: "The whole day needs a food plan.",
      body: "Open the planner, choose breakfast, lunch, dinner, or any meal, then keep the recipe list focused on the moment instead of browsing everything.",
      href: "/tools/smart-daily-menu#tool",
      cta: "Plan today's meals",
      chips: ["Breakfast", "Lunch", "Dinner"],
    },
    readySearches: [
      {
        eyebrow: "Morning",
        title: "Breakfast ideas for today",
        body: "Use this when you need fast breakfast options without lunch-style sabzi taking over the result list.",
        href: "/tools/smart-daily-menu#tool",
      },
      {
        eyebrow: "Midday",
        title: "Lunch recipes for today",
        body: "Find practical lunch ideas that work around dal, sabzi, rice, roti, or a simple family meal.",
        href: "/tools/smart-daily-menu#tool",
      },
      {
        eyebrow: "Evening",
        title: "Dinner ideas tonight",
        body: "Browse dinner-friendly recipes when you want a proper meal but do not want to repeat yesterday's plan.",
        href: "/tools/smart-daily-menu#tool",
      },
      {
        eyebrow: "Open choice",
        title: "Any meal ideas",
        body: "Use any meal mode when you only want fresh recipe inspiration and do not care about the meal slot.",
        href: "/tools/smart-daily-menu#tool",
      },
    ],
    howTo: {
      title: "Choose the meal moment before choosing the dish.",
      body: "The tool works better when the meal slot is clear. Breakfast, lunch, and dinner can share some recipes, but the first screen should match the user's current decision.",
      chips: ["Meal slot", "Food type", "Recipe cards"],
      steps: [
        {
          title: "Select breakfast, lunch, dinner, or any meal",
          body: "Start with the actual moment so breakfast ideas do not mix with dinner sabzi and dinner ideas do not start with morning recipes.",
        },
        {
          title: "Choose veg, non veg, or any",
          body: "Keep the result list aligned with the household preference before opening a recipe card.",
        },
        {
          title: "Use pagination to explore more",
          body: "The first six cards stay easy to scan, and the next pages keep giving more recipe options from the database.",
        },
      ],
    },
    questionPrompts: [
      "what to cook today for dinner",
      "what should I make for lunch today",
      "easy breakfast ideas for today",
      "Indian daily meal ideas",
    ],
    useCases: [
      {
        title: "When the day needs a menu",
        body: "Switch between breakfast, lunch, dinner, or any meal and keep the results focused on that moment.",
      },
      {
        title: "When you want fewer repeat choices",
        body: "Use the tool as a fresh starting point instead of searching the same recipe names every day.",
      },
      {
        title: "When one person wants veg and another wants broader ideas",
        body: "Food type controls help the same page work for different households without forcing one fixed recipe list.",
      },
      {
        title: "When you want a quick plan, not a long article",
        body: "Open the tool, pick the meal slot, and start from recipe cards immediately.",
      },
    ],
    faqs: [
      {
        question: "Can I choose only breakfast or lunch?",
        answer:
          "Yes. Pick a meal slot and the tool shows recipe ideas for that meal.",
      },
      {
        question: "Does the tool support vegetarian recipes?",
        answer:
          "Yes. It starts with vegetarian ideas and also lets you switch the food type.",
      },
      {
        question: "Why should I use a daily meal planner instead of normal recipe search?",
        answer:
          "Normal recipe search starts with a dish name. This page starts with the real question: what should I cook today for breakfast, lunch, dinner, or any meal?",
      },
      {
        question: "Will lunch and dinner show the same recipes?",
        answer:
          "Lunch and dinner can naturally overlap because many Indian sabzi, curry, dal, and rice recipes work for both. The tool keeps the selected meal slot visible so the result context remains clear.",
      },
      {
        question: "Can I use it for vegetarian dinner ideas?",
        answer:
          "Yes. Keep food type on veg and choose dinner to browse vegetarian dinner ideas from the recipe database.",
      },
      {
        question: "Can I open full recipes from the cards?",
        answer:
          "Yes. Each card opens the full recipe page with image, cooking time, ingredients, and steps where available.",
      },
      {
        question: "Is this page useful for Indian family meals?",
        answer:
          "Yes. The page is built around everyday Indian food decisions such as breakfast, lunch, dinner, simple sabzi, dal, snacks, and family-friendly recipes.",
      },
    ],
  },
  {
    slug: "smart-budget-meals",
    href: "/tools/smart-budget-meals",
    mode: "budget",
    title: "Smart Budget Meals",
    shortTitle: "Budget Meals",
    eyebrow: "Budget meal tool",
    seoTitle: "Smart Budget Meals: Budget Meal Planner for Indian Recipes",
    heroTitle: "Find recipe ideas that fit the money available today.",
    heroLead:
      "Set a food budget and browse Indian recipes estimated around that amount. Useful for low-cost meals, month-end cooking, and simple vegetarian ideas.",
    description:
      "Set a food budget and find Indian recipe ideas estimated around that amount using available ingredient price data.",
    intro:
      "Choose a budget and browse recipe ideas matched by ingredient quantity and price data.",
    keywords: [
      "smart budget meals",
      "budget meal planner",
      "budget meals India",
      "cheap Indian recipes",
      "recipes under 100 rupees",
      "recipes under 150 rupees",
      "low budget dinner ideas",
      "low cost meal ideas",
      "cheap vegetarian meals India",
    ],
    defaultBudget: 150,
    highlights: ["Rs 75", "Rs 150", "Rs 250"],
    popularSearches: [
      { label: "Recipes under Rs 100", href: "/tools/smart-budget-meals" },
      { label: "Budget dinner ideas", href: "/tools/smart-budget-meals" },
      { label: "Cheap vegetarian meals", href: "/tools/smart-budget-meals" },
    ],
    featuredSearch: {
      eyebrow: "Month-end cooking",
      title: "Cook within the money available today.",
      body: "Set a budget range and browse recipe ideas estimated from ingredient quantity and price data. It is useful when groceries need to stretch without making dinner boring.",
      href: "/tools/smart-budget-meals#tool",
      cta: "Open budget planner",
      chips: ["Rs 75", "Rs 150", "Rs 250"],
    },
    readySearches: [
      {
        eyebrow: "Low cost",
        title: "Recipes under Rs 100",
        body: "Start here when you want simple food ideas that can work with basic pantry ingredients.",
        href: "/tools/smart-budget-meals#tool",
      },
      {
        eyebrow: "Dinner",
        title: "Budget dinner ideas",
        body: "Find practical dinner recipes before opening richer or ingredient-heavy options.",
        href: "/tools/smart-budget-meals#tool",
      },
      {
        eyebrow: "Veg first",
        title: "Cheap vegetarian meals",
        body: "Browse vegetarian recipes that are easier to keep affordable for daily cooking.",
        href: "/tools/smart-budget-meals#tool",
      },
      {
        eyebrow: "Family use",
        title: "Simple low-cost recipes",
        body: "Use a slightly higher amount when the meal needs to serve more people at home.",
        href: "/tools/smart-budget-meals#tool",
      },
    ],
    howTo: {
      title: "Let the budget narrow the recipe list.",
      body: "Budget search is useful only when recipe matching respects ingredient price data. The control gives people a practical way to start with affordable choices.",
      chips: ["Set amount", "Compare ideas", "Open recipe"],
      steps: [
        {
          title: "Choose a budget amount",
          body: "Start with Rs 75, Rs 150, Rs 250, or enter the amount that matches today's grocery situation.",
        },
        {
          title: "Keep food type aligned",
          body: "Vegetarian recipes are often easier to fit into smaller budgets, but the tool also supports broader preferences.",
        },
        {
          title: "Open recipes that look realistic",
          body: "Use the cards to compare time, useful detail, and the recipe before deciding what to cook.",
        },
      ],
    },
    questionPrompts: [
      "recipes under Rs 100",
      "budget dinner ideas Indian",
      "cheap vegetarian meals India",
      "low cost lunch ideas",
    ],
    useCases: [
      {
        title: "When salary is still a few days away",
        body: "Keep the meal practical by choosing a budget range before opening recipe cards.",
      },
      {
        title: "When groceries need to stretch",
        body: "Use the budget control to compare simple recipe ideas without browsing expensive dishes first.",
      },
      {
        title: "When you want affordable vegetarian ideas",
        body: "Start with veg mode and a lower budget to make the first result page more practical.",
      },
      {
        title: "When price data should guide the UX",
        body: "The page is designed around ingredient pricing, so the budget control has a real purpose beyond decoration.",
      },
    ],
    faqs: [
      {
        question: "How are budget recipes matched?",
        answer:
          "Recipes are estimated from ingredient quantities and available ingredient price data.",
      },
      {
        question: "Can I increase or reduce the budget?",
        answer:
          "Yes. Use quick budget buttons or adjust the amount to see different recipe ideas.",
      },
      {
        question: "Does the budget planner use real ingredient prices?",
        answer:
          "It uses the ingredient price data available in the system with recipe quantities to estimate which recipes can fit the selected range.",
      },
      {
        question: "Why do some recipes still appear near the budget limit?",
        answer:
          "Recipe costs depend on the ingredients and mapped quantity data. If an ingredient does not have reliable price data yet, the estimate can be less precise.",
      },
      {
        question: "Can I find vegetarian recipes under a small budget?",
        answer:
          "Yes. Use the veg food type with a lower budget amount to start from simpler vegetarian recipe ideas.",
      },
      {
        question: "Is this useful for month-end cooking?",
        answer:
          "Yes. The page is built for days when the food budget is limited and you still want practical lunch or dinner ideas.",
      },
      {
        question: "Can I use this for lunch and dinner both?",
        answer:
          "Yes. Budget-friendly recipes can work for lunch or dinner. Use the result cards to open the recipe that fits the meal you are planning.",
      },
    ],
  },
  {
    slug: "smart-guest-menu",
    href: "/tools/smart-guest-menu",
    mode: "guests",
    title: "Smart Guest Menu",
    shortTitle: "Guest Menu",
    eyebrow: "Guest menu tool",
    seoTitle: "Smart Guest Menu: Indian Menu for Guests at Home",
    heroTitle: "Plan food for guests without serving the same default dishes.",
    heroLead:
      "Choose the serving style first: full meal, snacks, or quick serve. Then use guest count to browse practical Indian recipes that are easier to scale.",
    description:
      "Choose guest count and serving style to get Indian menu ideas for guests at home, from snacks to full meal recipes.",
    intro:
      "Pick the serving style first, then use the guest count to plan easier recipes.",
    keywords: [
      "smart guest menu",
      "menu for guests at home",
      "guest menu ideas",
      "Indian menu for guests at home",
      "Indian recipes for guests",
      "dinner menu for guests Indian",
      "party menu planner",
      "quick snacks for guests",
      "easy recipes for guests",
    ],
    defaultGuestCount: 5,
    defaultGuestPlan: "full-meal",
    highlights: ["Full meal", "Quick serve", "Snacks"],
    popularSearches: [
      { label: "Dinner menu for guests", href: "/tools/smart-guest-menu" },
      { label: "Quick snacks for guests", href: "/tools/smart-guest-menu" },
      { label: "Indian party menu ideas", href: "/tools/smart-guest-menu" },
    ],
    featuredSearch: {
      eyebrow: "Hosting at home",
      title: "Guests are coming and the menu needs to feel special.",
      body: "Choose full meal, quick serve, or snacks first. The tool helps keep guest recipes practical instead of showing plain everyday food first.",
      href: "/tools/smart-guest-menu#tool",
      cta: "Open guest menu tool",
      chips: ["Full meal", "Snacks", "Quick serve"],
    },
    readySearches: [
      {
        eyebrow: "Dinner",
        title: "Dinner menu for guests",
        body: "Start here when you want recipes that feel more suitable for hosting than a regular weekday meal.",
        href: "/tools/smart-guest-menu#tool",
      },
      {
        eyebrow: "Tea time",
        title: "Quick snacks for guests",
        body: "Use snacks mode when visitors are coming for tea, a short stop, or an evening get-together.",
        href: "/tools/smart-guest-menu#tool",
      },
      {
        eyebrow: "Party",
        title: "Indian party menu ideas",
        body: "Browse recipes that can work for a small gathering without forcing a full restaurant-style spread.",
        href: "/tools/smart-guest-menu#tool",
      },
      {
        eyebrow: "Fast plan",
        title: "Quick serve recipes",
        body: "Useful when guests arrive with little notice and the first result page needs to stay realistic.",
        href: "/tools/smart-guest-menu#tool",
      },
    ],
    howTo: {
      title: "Plan by serving style, not only guest count.",
      body: "Guest count alone does not change what food should be served. The useful decision is whether the visit needs a full meal, snacks, or a quick serve menu.",
      chips: ["Serving style", "Guest count", "Special recipes"],
      steps: [
        {
          title: "Choose the type of visit",
          body: "Select full meal for lunch or dinner, snacks for tea-time visitors, or quick serve when time is short.",
        },
        {
          title: "Use guest count for scale",
          body: "Guest count helps you think about batch-friendly recipes and the amount of food needed.",
        },
        {
          title: "Pick recipes that feel presentable",
          body: "Open recipe cards that are suitable for guests instead of plain everyday defaults.",
        },
      ],
    },
    questionPrompts: [
      "dinner menu for guests at home",
      "quick snacks for guests Indian",
      "Indian party menu ideas",
      "easy recipes for guests",
    ],
    useCases: [
      {
        title: "When guests arrive with little notice",
        body: "Switch to quick serve or snacks so the result list stays practical for short prep time.",
      },
      {
        title: "When you need a full meal",
        body: "Use full meal mode for recipes that feel more suitable for hosting than everyday plain meals.",
      },
      {
        title: "When tea-time needs something better",
        body: "Snacks mode gives a better starting point for evening visits than forcing lunch or dinner recipes.",
      },
      {
        title: "When guest count should guide effort",
        body: "Use the count to decide whether the menu should stay simple, batch-friendly, or a little more elaborate.",
      },
    ],
    faqs: [
      {
        question: "Does guest count change the menu?",
        answer:
          "Guest count is used with serving style to prioritize easier, batch-friendly ideas.",
      },
      {
        question: "Can I plan only snacks?",
        answer:
          "Yes. Choose snacks when guests are coming for tea or a light visit.",
      },
      {
        question: "Why is serving style more important than only guest count?",
        answer:
          "Two guests for dinner and two guests for tea need different food. Serving style tells the tool whether to prioritize full meal recipes, snacks, or quick serve ideas.",
      },
      {
        question: "Will this show plain everyday dishes first?",
        answer:
          "The guest tool is designed to prioritize recipes that feel more suitable for visitors, especially when full meal or snacks mode is selected.",
      },
      {
        question: "Can I use this for sudden guests?",
        answer:
          "Yes. Choose quick serve or snacks when guests arrive with little notice and you need realistic ideas fast.",
      },
      {
        question: "Can I plan a vegetarian guest menu?",
        answer:
          "Yes. Keep food type on veg to browse vegetarian recipes for guests at home.",
      },
      {
        question: "Is this useful for small home gatherings?",
        answer:
          "Yes. It works for small dinners, tea-time guests, casual get-togethers, and simple party-style food at home.",
      },
    ],
  },
  {
    slug: "smart-kids-meals",
    href: "/tools/smart-kids-meals",
    mode: "moms",
    title: "Smart Kids Meals",
    shortTitle: "Kids Meals",
    eyebrow: "Family meal tool",
    seoTitle: "Smart Kids Meals: Kids Lunch Box and Family Food Ideas",
    heroTitle: "Find food ideas kids may actually want to eat.",
    heroLead:
      "Browse simple recipe ideas for family cooking, lunch boxes, snacks, and everyday meals. This is a food idea tool, not medical or nutrition advice.",
    description:
      "Find simple family-friendly recipe ideas for kids, lunch boxes, snacks, and everyday meals at home.",
    intro:
      "Browse family-friendly recipe ideas and choose food type based on preference.",
    keywords: [
      "smart kids meals",
      "kids meal ideas",
      "kids lunch box ideas",
      "healthy snacks for kids India",
      "family recipes India",
      "simple food for kids",
      "easy recipes for kids",
      "family friendly Indian recipes",
    ],
    highlights: ["Family meals", "Kids-friendly", "Simple ideas"],
    popularSearches: [
      { label: "Kids lunch box ideas", href: "/tools/smart-kids-meals" },
      { label: "Simple food for kids", href: "/tools/smart-kids-meals" },
      { label: "Family-friendly recipes", href: "/tools/smart-kids-meals" },
    ],
    featuredSearch: {
      eyebrow: "Family cooking",
      title: "Kids need food ideas that are simple, familiar, and easy to open.",
      body: "Browse family-friendly recipes, switch food type when needed, and use the cards as meal ideas rather than medical or nutrition advice.",
      href: "/tools/smart-kids-meals#tool",
      cta: "Open kids meal ideas",
      chips: ["Lunch box", "Snacks", "Family meals"],
    },
    readySearches: [
      {
        eyebrow: "School day",
        title: "Kids lunch box ideas",
        body: "Use this when the meal needs to be easy to pack, easy to eat, and not too complicated.",
        href: "/tools/smart-kids-meals#tool",
      },
      {
        eyebrow: "Everyday",
        title: "Simple food for kids",
        body: "Find familiar recipe ideas when children are rejecting the usual plate.",
        href: "/tools/smart-kids-meals#tool",
      },
      {
        eyebrow: "Family table",
        title: "Family-friendly recipes",
        body: "Browse recipes that can work for kids and adults without making separate food every time.",
        href: "/tools/smart-kids-meals#tool",
      },
      {
        eyebrow: "Snack time",
        title: "Quick snack ideas",
        body: "Use snack-style ideas when the need is between meals, after school, or evening hunger.",
        href: "/tools/smart-kids-meals#tool",
      },
    ],
    howTo: {
      title: "Keep it practical: food ideas, not health advice.",
      body: "The page is built for everyday family cooking. It helps discover recipe ideas while keeping the final food decision with the parent or caregiver.",
      chips: ["Food type", "Lunch box", "Family-friendly"],
      steps: [
        {
          title: "Choose the preferred food type",
          body: "Keep the results vegetarian, non veg, or open depending on what the family eats.",
        },
        {
          title: "Look for familiar recipe formats",
          body: "Use cards that feel easy for kids to recognize, eat, and repeat at home.",
        },
        {
          title: "Open the full recipe before deciding",
          body: "Check ingredients, image, and cooking method so the idea actually works for the child and the household.",
        },
      ],
    },
    questionPrompts: [
      "kids lunch box ideas",
      "simple food for kids",
      "easy snacks for kids India",
      "family friendly Indian recipes",
    ],
    useCases: [
      {
        title: "When kids reject the usual food",
        body: "Use the tool to refresh the format while keeping the recipe practical for home cooking.",
      },
      {
        title: "When the family needs simple choices",
        body: "Filter by food type and browse easy recipe cards without turning it into health advice.",
      },
      {
        title: "When lunch box ideas are running out",
        body: "Open recipe cards that can inspire school-day meals or simple packed food ideas.",
      },
      {
        title: "When one recipe should work for everyone",
        body: "Family-friendly browsing helps avoid cooking separate food for kids and adults every day.",
      },
    ],
    faqs: [
      {
        question: "Is this kids meal tool medical advice?",
        answer:
          "No. It is only a food idea tool and does not provide medical or nutrition advice.",
      },
      {
        question: "Can I filter veg and non veg ideas?",
        answer:
          "Yes. Use the food type control to keep recipe ideas aligned with family preference.",
      },
      {
        question: "Can I use it for lunch box ideas?",
        answer:
          "Yes. Use the page as a starting point for lunch box recipes, simple packed meals, and school-day food ideas.",
      },
      {
        question: "Does this tool decide what is healthy for my child?",
        answer:
          "No. It only shows food ideas and recipe cards. Parents and caregivers should make the final decision based on the child, age, allergies, and dietary needs.",
      },
      {
        question: "Can I find vegetarian kids meal ideas?",
        answer:
          "Yes. Keep the food type set to veg to browse vegetarian recipe ideas for kids and family meals.",
      },
      {
        question: "Can adults eat the same recipes?",
        answer:
          "Yes. Many family-friendly recipes can work for adults too, which makes the tool useful for shared home cooking.",
      },
      {
        question: "What should I do if my child has allergies?",
        answer:
          "Use the recipe only as an idea and check ingredients carefully. This page does not replace medical or allergy advice.",
      },
    ],
  },
];

export const interactiveToolPages = toolPages.filter(
  (tool): tool is InteractiveToolPageConfig => tool.mode !== "ingredients",
);

export function getToolPage(slug: string) {
  return toolPages.find((tool) => tool.slug === slug);
}

export function getInteractiveToolPage(slug: string) {
  return interactiveToolPages.find((tool) => tool.slug === slug);
}
