const PANTRY_EXACT_VALUES = new Set([
  "ajwain",
  "asafoetida",
  "bay leaf",
  "black pepper",
  "black salt",
  "cardamom",
  "carom seeds",
  "chaat masala",
  "chilli powder",
  "cinnamon",
  "clove",
  "coriander powder",
  "coriander seeds",
  "cumin",
  "cumin seeds",
  "coriander leaves",
  "curry leaves",
  "dalchini",
  "dhania powder",
  "elaichi",
  "fennel",
  "fenugreek seeds",
  "garam masala",
  "garlic",
  "ghee",
  "green chilli",
  "green chillies",
  "haldi",
  "hing",
  "jeera",
  "kasuri methi",
  "laung",
  "lemon",
  "lime",
  "masala",
  "methi dana",
  "mirch",
  "mustard oil",
  "mustard seeds",
  "namak",
  "oil",
  "pepper",
  "rai",
  "red chilli",
  "red chillies",
  "red chilli powder",
  "rock salt",
  "salt",
  "saunf",
  "sendha namak",
  "soy sauce",
  "sugar",
  "tel",
  "tej patta",
  "turmeric",
  "turmeric powder",
  "vinegar",
  "water",
]);

const PANTRY_PATTERN =
  /\b(ajwain|asafoetida|bay leaf|black pepper|black salt|cardamom|carom|chaat masala|chilli|chillies|chilli powder|cilantro|cinnamon|clove|coriander leaves|coriander powder|coriander seeds|cumin|curry leaves|dalchini|dhania powder|elaichi|fennel|garam masala|garlic|ginger|ghee|green chilli|green chillies|haldi|hing|jeera|kasuri methi|laung|lemon|lemon juice|lime|lime juice|masala|methi dana|mint|mirch|mustard oil|mustard seeds|namak|oil|pepper|pudina|rai|red chilli|red chillies|rock salt|salt|saunf|sendha namak|soy sauce|sugar|tel|tej patta|turmeric|vinegar|water)\b/;

const PANTRY_CATEGORY_SLUGS = new Set([
  "morning hydration",
  "oils",
  "spices",
  "teas infusions",
]);
const PRIMARY_FOOD_CATEGORY_SLUGS = new Set([
  "cereals and pulses",
  "fruits and vegetables",
  "milk dairy products",
  "non vegetarian foods",
  "protein sources",
]);
const SUPPORTING_PRIMARY_INGREDIENTS = new Set([
  "onion",
  "tomato",
]);
const OPTIONAL_MAIN_FOOD_PATTERN =
  /\b(cilantro|coriander leaves|curry leaves|fresh coriander|green chilli|green chillies|lemon juice|lime juice|mint|pudina|red chilli|red chillies)\b/;

const PRIMARY_INGREDIENT_ALIASES: Record<string, string> = {
  aaloo: "potato",
  aloo: "potato",
  arbi: "colocasia",
  baingan: "brinjal",
  bhindi: "okra",
  chawal: "rice",
  dahi: "curd",
  doodhi: "bottle gourd",
  dudhi: "bottle gourd",
  ghia: "bottle gourd",
  ghiya: "bottle gourd",
  gobhi: "cauliflower",
  gobi: "cauliflower",
  daal: "dal",
  "chana dal": "dal",
  "channa dal": "dal",
  lentil: "dal",
  lentils: "dal",
  kathal: "jackfruit",
  lauki: "bottle gourd",
  matar: "peas",
  artichoke: "artichoke",
  artichokes: "artichoke",
  "jerusalem artichoke": "artichoke",
  "jerusalem artichokes": "artichoke",
  besan: "chickpea",
  "bengal gram": "chickpea",
  chickpea: "chickpea",
  chickpeas: "chickpea",
  "gram flour": "chickpea",
  karela: "bitter gourd",
  "bitter gourd": "bitter gourd",
  "bitter gourds": "bitter gourd",
  moringa: "moringa",
  "drumstick leaves": "moringa",
  "drumstick leaf": "moringa",
  drumstick: "moringa",
  patol: "pointed gourd",
  parwar: "pointed gourd",
  parval: "pointed gourd",
  parwal: "pointed gourd",
  palak: "spinach",
  paneer: "paneer",
  potatoes: "potato",
  "sweet potatoes": "sweet potato",
  pyaz: "onion",
  shimla: "capsicum",
  "shimla mirch": "capsicum",
  tamatar: "tomato",
  "taro root": "colocasia",
  tinda: "apple gourd",
  tori: "ridge gourd",
  torai: "ridge gourd",
  turai: "ridge gourd",
};

const PRIMARY_INGREDIENT_IDENTITY_TERMS: Record<string, string[]> = {
  "apple gourd": ["apple gourd", "tinda"],
  "bottle gourd": ["bottle gourd", "lauki", "doodhi", "dudhi", "ghia", "ghiya"],
  brinjal: ["brinjal", "baingan", "eggplant", "aubergine"],
  cabbage: ["cabbage", "patta gobhi", "patta gobi"],
  artichoke: ["artichoke", "artichokes", "jerusalem artichoke", "jerusalem artichokes"],
  "bitter gourd": ["bitter gourd", "bitter gourds", "karela"],
  capsicum: ["capsicum", "bell pepper", "bell peppers", "shimla mirch", "shimla"],
  carrot: ["carrot", "carrots", "gajar"],
  cauliflower: ["cauliflower", "gobhi", "gobi", "phool gobhi", "phool gobi"],
  colocasia: ["colocasia", "arbi", "taro", "taro root"],
  corn: ["corn", "sweet corn", "makai"],
  chickpea: ["chickpea", "chickpeas", "kabuli chana", "bengal gram", "besan", "gram flour"],
  curd: ["curd", "dahi", "yogurt", "yoghurt"],
  dal: ["dal", "daal", "lentil", "lentils", "moong dal", "chana dal"],
  jackfruit: ["jackfruit", "kathal"],
  moringa: ["moringa", "drumstick leaves", "drumstick leaf", "drumstick"],
  mushroom: ["mushroom", "mushrooms"],
  okra: ["okra", "bhindi", "lady finger", "ladyfinger"],
  onion: ["onion", "onions", "pyaz"],
  paneer: ["paneer"],
  peas: ["peas", "matar", "green peas"],
  "pointed gourd": ["pointed gourd", "parwal", "parval", "parwar", "patol", "potol"],
  potato: ["potato", "potatoes", "aloo", "aaloo"],
  rice: ["rice", "chawal"],
  "ridge gourd": ["ridge gourd", "turai", "tori", "torai"],
  spinach: ["spinach", "palak"],
  "sweet potato": ["sweet potato", "sweet potatoes", "shakarkand"],
  tomato: ["tomato", "tomatoes", "tamatar"],
};

export const PRIMARY_INGREDIENT_HELP =
  "Search main fridge ingredients like lauki, turai, aloo, arbi, paneer, dal, rice, or curd. Pantry items like salt, haldi, mirch, oil, and masala will not show recipe results.";

export function normalizePrimaryIngredientValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function canonicalPrimaryIngredientValue(value: string) {
  const normalized = normalizePrimaryIngredientValue(value);

  return PRIMARY_INGREDIENT_ALIASES[normalized] ?? normalized;
}

export function primaryIngredientSearchTerms(value: string) {
  const canonical = canonicalPrimaryIngredientValue(value);
  const terms = new Set([canonical]);

  Object.entries(PRIMARY_INGREDIENT_ALIASES).forEach(([alias, aliasCanonical]) => {
    if (aliasCanonical === canonical) terms.add(alias);
  });

  return Array.from(terms).filter(Boolean);
}

function phrasePattern(value: string) {
  return new RegExp(
    `(?:^|\\b)${escapeRegExp(value).replace(/\s+/g, "\\s+")}(?=\\b|$)`,
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function primaryIngredientIdentityMatchers() {
  return Object.entries(PRIMARY_INGREDIENT_IDENTITY_TERMS)
    .flatMap(([value, terms]) => {
      const canonical = canonicalPrimaryIngredientValue(value);
      const allTerms = new Set([
        canonical,
        ...terms,
        ...primaryIngredientSearchTerms(canonical),
      ]);

      return Array.from(allTerms)
        .map(normalizePrimaryIngredientValue)
        .filter(Boolean)
        .map((term) => ({
          canonical,
          term,
          pattern: new RegExp(
            `(?:^|\\b)${escapeRegExp(term).replace(/\s+/g, "\\s+")}(?=\\b|$)`,
            "g",
          ),
        }));
    })
    .sort((left, right) => right.term.length - left.term.length);
}

function rangesOverlap(
  left: readonly [number, number],
  right: readonly [number, number],
) {
  return left[0] < right[1] && right[0] < left[1];
}

export function primaryIngredientMentions(value: string) {
  const normalized = normalizePrimaryIngredientValue(value);
  const mentions = new Set<string>();
  const claimedRanges: Array<[number, number]> = [];

  primaryIngredientIdentityMatchers().forEach((matcher) => {
    Array.from(normalized.matchAll(matcher.pattern)).forEach((match) => {
      const start = match.index ?? 0;
      const end = start + match[0].length;
      const range: [number, number] = [start, end];

      if (claimedRanges.some((claimed) => rangesOverlap(claimed, range))) return;

      claimedRanges.push(range);
      mentions.add(matcher.canonical);
    });
  });

  return Array.from(mentions);
}

export function hasOnlySelectedPrimaryIngredientMentions(
  value: string,
  selected: string[],
) {
  const selectedValues = new Set(filterPrimaryIngredientValues(selected, 20));

  return primaryIngredientMentions(value).every((mention) =>
    selectedValues.has(mention),
  );
}

export function isPantryIngredientValue(value: string, categorySlug?: string | null) {
  const category = normalizePrimaryIngredientValue(categorySlug ?? "");
  const normalized = canonicalPrimaryIngredientValue(value);
  const mentions = primaryIngredientMentions(normalized);

  if (!normalized) return true;
  if (PANTRY_EXACT_VALUES.has(normalized)) return true;
  if (mentions.some((mention) => !SUPPORTING_PRIMARY_INGREDIENTS.has(mention))) {
    return false;
  }
  if (category && PANTRY_CATEGORY_SLUGS.has(category)) return true;
  if (category && PRIMARY_FOOD_CATEGORY_SLUGS.has(category)) {
    return OPTIONAL_MAIN_FOOD_PATTERN.test(normalized);
  }

  return PANTRY_PATTERN.test(normalized);
}

export function matchesSelectedPrimaryIngredient(value: string, selected: string[]) {
  const normalized = normalizePrimaryIngredientValue(value);
  const selectedValues = new Set(filterPrimaryIngredientValues(selected, 20));
  const mentions = primaryIngredientMentions(normalized);

  if (mentions.length > 0) {
    return mentions.some((mention) => selectedValues.has(mention));
  }

  return Array.from(selectedValues).some((ingredient) =>
    primaryIngredientSearchTerms(ingredient).some((term) =>
      phrasePattern(normalizePrimaryIngredientValue(term)).test(normalized),
    ),
  );
}

export function isSupportingPrimaryIngredientValue(value: string) {
  const normalized = canonicalPrimaryIngredientValue(value);
  const mentions = primaryIngredientMentions(normalized);

  return (
    mentions.length > 0 &&
    mentions.every((mention) => SUPPORTING_PRIMARY_INGREDIENTS.has(mention))
  );
}

function selectedAllowsSupportingExtras(selected: string[]) {
  const selectedValues = filterPrimaryIngredientValues(selected, 20);

  return selectedValues.some((value) => !SUPPORTING_PRIMARY_INGREDIENTS.has(value));
}

export function isExtraPrimaryIngredientValue(
  value: string,
  selected: string[],
  categorySlug?: string | null,
) {
  const normalized = normalizePrimaryIngredientValue(value);
  const mentions = primaryIngredientMentions(normalized);
  const selectedValues = filterPrimaryIngredientValues(selected, 20);

  if (isPantryIngredientValue(value, categorySlug)) return false;
  if (mentions.some((mention) => SUPPORTING_PRIMARY_INGREDIENTS.has(mention))) {
    if (mentions.some((mention) => selectedValues.includes(mention))) return false;
    return !selectedAllowsSupportingExtras(selected);
  }

  return !matchesSelectedPrimaryIngredient(value, selected);
}

export function isPrimaryIngredientValue(value: string) {
  const normalized = canonicalPrimaryIngredientValue(value);

  if (!normalized) return false;
  if (isPantryIngredientValue(normalized)) return false;

  return !PANTRY_PATTERN.test(normalized);
}

export function filterPrimaryIngredientValues(values: string[], limit = 10) {
  const unique = new Set<string>();

  values.forEach((value) => {
    const canonical = canonicalPrimaryIngredientValue(value);
    if (!isPrimaryIngredientValue(canonical)) return;
    unique.add(canonical);
  });

  return Array.from(unique).slice(0, limit);
}
