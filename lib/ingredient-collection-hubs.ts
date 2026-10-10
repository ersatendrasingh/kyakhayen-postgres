import type { Prisma } from "@prisma/client";

export type IngredientCollectionHubSlug =
  | "paneer"
  | "aloo"
  | "dahi"
  | "tomato"
  | "rice"
  | "besan";

export type IngredientCollectionHub = {
  slug: IngredientCollectionHubSlug;
  title: string;
  searchQuery: string;
  heroIntro: string;
  highlights: string[];
  ingredientSlugs: string[];
  nameIncludes: string[];
  intro: string;
  tableRows: Array<{
    use: string;
    pick: string;
    note: string;
  }>;
  tips: string[];
  faqs: Array<{
    question: string;
    answer: string;
  }>;
};

export type IngredientCollectionHubLink = {
  title: string;
  label: string;
  slug: IngredientCollectionHubSlug;
  href: string;
  description: string;
  imageUrl: string;
};

export const ingredientCollectionHubSlugs = [
  "paneer",
  "aloo",
  "dahi",
  "tomato",
  "rice",
  "besan",
] as const satisfies readonly IngredientCollectionHubSlug[];

const ingredientCollectionHubsBySlug: Record<IngredientCollectionHubSlug, IngredientCollectionHub> = {
  paneer: {
    slug: "paneer",
    title: "Paneer",
    searchQuery: "paneer recipes",
    heroIntro:
      "Explore paneer recipes for lunch, dinner, snacks and festive cooking, from creamy gravies to quick everyday sabzi ideas.",
    highlights: ["paneer recipes", "veg protein", "dinner ideas", "party snacks"],
    ingredientSlugs: ["paneer"],
    nameIncludes: ["paneer"],
    intro:
      "Paneer is one of the most useful ingredients in an Indian kitchen because it can become a quick snack, a rich curry, a lunchbox filling or a dinner main without long prep.",
    tableRows: [
      {
        use: "Quick snack",
        pick: "Dry paneer, tikka style or stir-fry recipes",
        note: "Use firm paneer and keep the masala punchy so the dish does not turn watery.",
      },
      {
        use: "Dinner gravy",
        pick: "Paneer curry, makhani, korma or tomato-onion gravy",
        note: "Add paneer near the end so it stays soft and does not become rubbery.",
      },
      {
        use: "Lunchbox",
        pick: "Paneer bhurji, paneer paratha or paneer wraps",
        note: "Choose lower-moisture fillings when the recipe needs to travel.",
      },
      {
        use: "Protein boost",
        pick: "Paneer with vegetables, dal or whole grains",
        note: "Pair paneer with fiber-rich sides for a more balanced plate.",
      },
    ],
    tips: [
      "Soak store-bought paneer in warm water for a few minutes if it feels firm.",
      "Do not boil paneer for long in gravy; gentle simmering is enough.",
      "For crisp snacks, pat paneer dry before marinating or pan-frying.",
      "Balance rich paneer gravies with salad, roti or steamed rice depending on the meal.",
    ],
    faqs: [
      {
        question: "Which paneer recipe is best for dinner?",
        answer:
          "A paneer gravy or paneer with vegetables works best for dinner because it pairs easily with roti, naan, paratha or rice.",
      },
      {
        question: "Can paneer recipes be made quickly?",
        answer:
          "Yes. Paneer bhurji, paneer stir-fry and simple paneer sabzi can usually be cooked faster than slow gravy recipes.",
      },
      {
        question: "How do I keep paneer soft?",
        answer:
          "Add paneer late in the recipe, avoid hard boiling and use warm water soaking when the paneer is dense.",
      },
    ],
  },
  aloo: {
    slug: "aloo",
    title: "Aloo",
    searchQuery: "aloo recipes",
    heroIntro:
      "Browse aloo recipes for breakfast, snacks, sabzi, paratha and comforting dinner plates made with potato.",
    highlights: ["aloo recipes", "potato snacks", "sabzi ideas", "breakfast recipes"],
    ingredientSlugs: ["potato-aloo"],
    nameIncludes: ["aloo", "potato"],
    intro:
      "Aloo is the dependable everyday ingredient: it stretches a meal, carries spices beautifully and works in breakfast, snacks, curries, dry sabzi and stuffed breads.",
    tableRows: [
      {
        use: "Breakfast",
        pick: "Aloo paratha, poha with potato or light potato fillings",
        note: "Use cooked potato and avoid excess moisture in stuffed recipes.",
      },
      {
        use: "Dry sabzi",
        pick: "Jeera aloo, aloo gobi, roasted aloo or masala aloo",
        note: "Cook uncovered at the end for better texture and less steam.",
      },
      {
        use: "Curry",
        pick: "Aloo tomato curry, dum aloo or potato gravy",
        note: "Cut potatoes evenly so the gravy cooks at one pace.",
      },
      {
        use: "Snack",
        pick: "Aloo tikki, cutlet, chaat or crispy roasted potato",
        note: "Cool boiled potato before shaping for cleaner, firmer snacks.",
      },
    ],
    tips: [
      "Boil potatoes until just tender for sabzi; overcooked potato breaks too quickly.",
      "For crispy aloo, dry the surface before frying, roasting or air-frying.",
      "Add amchur, lemon or tomato to brighten heavy potato dishes.",
      "Keep potato pieces similar in size so the recipe finishes evenly.",
    ],
    faqs: [
      {
        question: "What can I make quickly with aloo?",
        answer:
          "Jeera aloo, aloo fry, simple aloo curry and aloo paratha filling are quick choices when potatoes are already boiled.",
      },
      {
        question: "Which spices go well with aloo?",
        answer:
          "Cumin, coriander, turmeric, red chilli, garam masala, kasuri methi, amchur and fresh coriander all work well with aloo.",
      },
      {
        question: "Can aloo recipes be healthy?",
        answer:
          "Yes, choose boiled, roasted or vegetable-heavy potato recipes and keep deep-fried snacks occasional.",
      },
    ],
  },
  dahi: {
    slug: "dahi",
    title: "Dahi",
    searchQuery: "dahi recipes",
    heroIntro:
      "Find dahi recipes for raita, kadhi, lassi, marinades, cooling sides and curd-based everyday meals.",
    highlights: ["dahi recipes", "raita", "kadhi", "cooling meals"],
    ingredientSlugs: ["plain-curd-dahi", "sour-curd", "yogurt-greek-plain-lowfat"],
    nameIncludes: ["dahi", "curd", "yogurt"],
    intro:
      "Dahi brings cooling balance, tang and body to Indian food. It can become a side, a drink, a curry base, a marinade or a simple way to soften spicy meals.",
    tableRows: [
      {
        use: "Cooling side",
        pick: "Raita, plain curd bowls or cucumber dahi recipes",
        note: "Use fresh chilled curd and add salt close to serving time.",
      },
      {
        use: "Curry base",
        pick: "Kadhi, dahi aloo or yogurt-based gravies",
        note: "Whisk curd smooth and cook gently to reduce splitting.",
      },
      {
        use: "Drinks",
        pick: "Lassi, chaas and buttermilk style recipes",
        note: "Blend with chilled water or milk and adjust sweetness or salt.",
      },
      {
        use: "Marinade",
        pick: "Tikka-style marinades and spiced yogurt coatings",
        note: "Use thick curd or hung curd when the recipe needs cling.",
      },
    ],
    tips: [
      "Whisk curd before adding it to hot dishes for a smoother texture.",
      "Lower the flame when adding dahi to gravies to prevent splitting.",
      "Use sour curd for kadhi and fresher curd for raita or lassi.",
      "For thick marinades, strain curd for a short time before mixing spices.",
    ],
    faqs: [
      {
        question: "Can I cook dahi directly in curry?",
        answer:
          "Yes, but whisk it first and add it on low heat. Constant stirring helps keep the gravy smooth.",
      },
      {
        question: "What is the best use of sour dahi?",
        answer:
          "Sour dahi is useful for kadhi, some marinades and tangy curries where acidity is welcome.",
      },
      {
        question: "Is dahi good for summer recipes?",
        answer:
          "Dahi works very well in summer through raita, chaas, lassi and cooling rice or salad-style dishes.",
      },
    ],
  },
  tomato: {
    slug: "tomato",
    title: "Tomato",
    searchQuery: "tomato recipes",
    heroIntro:
      "Explore tomato recipes for Indian gravies, chutney, rice, soups, salads and quick everyday cooking.",
    highlights: ["tomato recipes", "gravy base", "chutney", "quick curries"],
    ingredientSlugs: ["tomato-ripe-local"],
    nameIncludes: ["tomato"],
    intro:
      "Tomato gives Indian recipes acidity, colour and body. It is a base ingredient for gravies, chutneys, rice dishes, soups and quick sabzi ideas.",
    tableRows: [
      {
        use: "Gravy base",
        pick: "Tomato-onion curry, paneer gravy or masala sauce",
        note: "Cook tomato until the raw smell goes and oil starts separating.",
      },
      {
        use: "Quick side",
        pick: "Tomato chutney, tomato raita or salad-style recipes",
        note: "Use ripe tomatoes for natural sweetness and better colour.",
      },
      {
        use: "Rice meal",
        pick: "Tomato rice, pulao or one-pot tomato masala rice",
        note: "Balance acidity with spices, herbs and the right amount of salt.",
      },
      {
        use: "Light meal",
        pick: "Soup, rasam style recipes or tomato-forward broths",
        note: "Simmer enough for flavour but avoid dulling the freshness.",
      },
    ],
    tips: [
      "Use ripe tomatoes for gravies; underripe tomatoes can taste sharp.",
      "Cook tomatoes well before adding cream, paneer or delicate vegetables.",
      "A small pinch of sugar can balance overly sour tomatoes when needed.",
      "For smoother gravies, blend cooked tomato masala before finishing the dish.",
    ],
    faqs: [
      {
        question: "Why does my tomato gravy taste raw?",
        answer:
          "Tomato needs enough cooking time. Cook until it softens deeply and the masala looks glossy.",
      },
      {
        question: "Can tomato recipes be made without onion?",
        answer:
          "Yes. Tomato can pair with ginger, garlic, spices, coconut, curd or lentils depending on the recipe.",
      },
      {
        question: "Which recipes use tomatoes daily?",
        answer:
          "Curries, dal tadka, chutney, rasam, tomato rice and many dry sabzi recipes commonly use tomato.",
      },
    ],
  },
  rice: {
    slug: "rice",
    title: "Rice",
    searchQuery: "rice recipes",
    heroIntro:
      "Browse rice recipes for breakfast, lunch, dinner, leftovers, one-pot meals and comforting Indian plates.",
    highlights: ["rice recipes", "one-pot meals", "lunch ideas", "leftover rice"],
    ingredientSlugs: [],
    nameIncludes: ["rice", "chawal", "poha"],
    intro:
      "Rice can be the main dish, a side, a breakfast base or a leftover rescue. The best rice recipes depend on grain type, moisture and how much flavour the dish needs.",
    tableRows: [
      {
        use: "One-pot meal",
        pick: "Pulao, tomato rice, masala rice or vegetable rice",
        note: "Use measured water so the grains stay separate and not mushy.",
      },
      {
        use: "Breakfast",
        pick: "Poha, idli-style ideas or light rice preparations",
        note: "Choose the rice form the recipe expects, especially for poha or batter dishes.",
      },
      {
        use: "Leftovers",
        pick: "Fried rice, tadka rice, curd rice or quick masala rice",
        note: "Cold cooked rice works better for stir-fry style recipes.",
      },
      {
        use: "Comfort plate",
        pick: "Dal rice, kadhi rice, curd rice or simple steamed rice pairings",
        note: "Match the rice texture to the gravy: softer for comfort, separate grains for pulao.",
      },
    ],
    tips: [
      "Rinse rice until the water is less cloudy for cleaner, separate grains.",
      "Rest cooked rice for a few minutes before fluffing.",
      "Use cold leftover rice for fried rice or quick stir-fry recipes.",
      "Adjust water by grain type; basmati, short-grain rice and poha behave differently.",
    ],
    faqs: [
      {
        question: "What can I make with leftover rice?",
        answer:
          "Fried rice, curd rice, lemon rice, tomato rice and quick masala rice are good leftover rice ideas.",
      },
      {
        question: "How do I keep rice from becoming mushy?",
        answer:
          "Rinse well, measure water, avoid over-stirring and let cooked rice rest before serving.",
      },
      {
        question: "Which rice recipes are good for lunch?",
        answer:
          "Pulao, dal rice, curd rice, lemon rice, tomato rice and vegetable rice work well for lunch.",
      },
    ],
  },
  besan: {
    slug: "besan",
    title: "Besan",
    searchQuery: "besan recipes",
    heroIntro:
      "Find besan recipes for chilla, kadhi, pakora, snacks, sweets and everyday gram-flour cooking.",
    highlights: ["besan recipes", "chilla", "kadhi", "snack ideas"],
    ingredientSlugs: ["bengal-gram-flour-besan"],
    nameIncludes: ["besan", "gram flour", "bengal gram flour"],
    intro:
      "Besan is gram flour with huge range: it thickens kadhi, becomes chilla batter, coats pakora, binds snacks and can turn into classic Indian sweets.",
    tableRows: [
      {
        use: "Breakfast",
        pick: "Besan chilla, cheela wraps or vegetable batter recipes",
        note: "Rest the batter briefly so it hydrates and spreads better.",
      },
      {
        use: "Curry",
        pick: "Kadhi or besan-thickened gravies",
        note: "Whisk besan with liquid first to avoid lumps.",
      },
      {
        use: "Snack",
        pick: "Pakora, dhokla-style ideas or crisp coatings",
        note: "Keep batter thickness matched to the recipe: pourable for chilla, coating for pakora.",
      },
      {
        use: "Sweet",
        pick: "Besan ladoo, halwa or festive gram-flour desserts",
        note: "Roast besan patiently until nutty and aromatic.",
      },
    ],
    tips: [
      "Sieve besan when making smooth batters or sweets.",
      "Add water slowly while whisking to avoid lumps.",
      "Roast besan on controlled heat so it cooks evenly without burning.",
      "For chilla, let the batter rest for better texture and flavour.",
    ],
    faqs: [
      {
        question: "What can I make quickly with besan?",
        answer:
          "Besan chilla, quick pakora batter and simple kadhi-style recipes are practical quick options.",
      },
      {
        question: "How do I prevent lumps in besan recipes?",
        answer:
          "Add liquid gradually while whisking, or mix besan with a small amount of liquid before adding it to the pot.",
      },
      {
        question: "Can besan be used for both snacks and sweets?",
        answer:
          "Yes. Besan works in savoury snacks like pakora and chilla, and sweets like ladoo or halwa.",
      },
    ],
  },
};

function normalizeIngredientSlug(value?: string | null) {
  return decodeURIComponent(value || "").trim().toLowerCase();
}

export function getIngredientCollectionHub(rawSlug?: string | null) {
  const slug = normalizeIngredientSlug(rawSlug);
  if (!slug) return null;

  if (slug in ingredientCollectionHubsBySlug) {
    return ingredientCollectionHubsBySlug[slug as IngredientCollectionHubSlug];
  }

  return (
    Object.values(ingredientCollectionHubsBySlug).find(
      (hub) => hub.ingredientSlugs.includes(slug) || hub.nameIncludes.includes(slug),
    ) || null
  );
}

export function getIngredientCollectionHubLinks(): IngredientCollectionHubLink[] {
  return ingredientCollectionHubSlugs.map((slug) => {
    const hub = ingredientCollectionHubsBySlug[slug];

    return {
      title: `${hub.title} recipes`,
      label: hub.title,
      slug: hub.slug,
      href: `/recipes/${hub.slug}`,
      description: hub.highlights.slice(0, 3).join(", "),
      imageUrl: `/assets/images/pantry-menu/${hub.slug === "paneer" ? "paneer-tofu" : hub.slug}.jpg`,
    };
  });
}

export function ingredientCollectionIngredientWhere(
  rawSlug: string,
): Prisma.IngredientsWhereInput {
  const slug = normalizeIngredientSlug(rawSlug);
  const hub = getIngredientCollectionHub(slug);

  if (!hub) {
    return {
      isPublished: true,
      OR: [{ slug }, { name: { contains: slug } }],
    };
  }

  const exactSlugs = Array.from(new Set([hub.slug, ...hub.ingredientSlugs]));
  const nameTerms = Array.from(new Set([hub.title, ...hub.nameIncludes]));

  return {
    isPublished: true,
    OR: [
      ...exactSlugs.map((ingredientSlug) => ({ slug: ingredientSlug })),
      ...nameTerms.map((term) => ({ name: { contains: term } })),
    ],
  };
}
