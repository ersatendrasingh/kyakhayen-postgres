import { slugify } from "./slugify";

export function normalizeIngredientName(value: string) {
  const cleaned = value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",");
  const letters = cleaned.replace(/[^A-Za-z]/g, "");
  const uppercaseRatio =
    letters.length > 0
      ? letters.replace(/[^A-Z]/g, "").length / letters.length
      : 0;

  if (cleaned === cleaned.toLowerCase() || uppercaseRatio > 0.75) {
    return cleaned
      .toLowerCase()
      .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
  }

  return cleaned.replace(/^[a-z]/, (letter) => letter.toUpperCase());
}

const displayNameOverrides = new Map(
  Object.entries({
    "Alcoholic Beverage, Beer, Light": "Light Beer",
    "Alcoholic Beverage, Beer, Light, Low Carb": "Low-Carb Light Beer",
    "Alcoholic Beverage, Beer, Regular, All": "Regular Beer",
    "Bengal Gram, Dal": "Chana Dal",
    "Bread Crumbs, Dry, Grated, Plain": "Breadcrumbs",
    "Bread, Multi-Grain (Includes Whole-Grain)": "Multigrain Bread",
    "Chicken, Poultry, Breast, Skinless": "Chicken Breast",
    "Chickpeas (Garbanzo Beans, Bengal Gram), Mature Seeds, Raw": "Chickpeas",
    "Chillies, Green - All Varieties": "Green Chillies",
    "Cucumber, Green, Elongate": "Cucumber",
    "Egg, Poultry, Whole, Raw": "Egg",
    "Beverages, Almond Milk, Unsweetened, Shelf Stable": "Almond Milk",
    "Bottle Gourd, Elongate, Dark Green": "Bottle Gourd",
    "Bottle Gourd, Elongate, Pale Green": "Bottle Gourd",
    "Brinjal - All Varieties": "Brinjal",
    "Butter, Without Salt": "Unsalted Butter",
    "Carrot, Orange": "Carrot",
    "Corn Flour, Masa, Enriched, White": "Corn Flour",
    "Coconut Kernal, Dry": "Dry Coconut Kernel",
    "Leavening Agents, Baking Soda": "Baking Soda",
    "Leavening Agents, Yeast, Baker's, Active Dry": "Active Dry Yeast",
    "Lemon, Juice": "Lemon Juice",
    "Lime Juice, Raw": "Lime Juice",
    "Milk, Whole, Cow": "Cow Milk",
    "Nuts, Coconut Milk, Raw Liquid Expressed From Grated Meat and Water": "Coconut Milk",
    "Nuts, Coconut Meat, Raw": "Coconut Meat",
    "Oranges, Raw, All Commercial Varieties": "Orange",
    "Peanuts, All Types, Raw": "Peanuts",
    "Potato, Brown Skin, Big": "Potato",
    "Pomegranate, Maroon Seeds": "Pomegranate Seeds",
    "Radishes, Raw": "Radish",
    "Salad Dressing, Mayonnaise, Regular": "Mayonnaise",
    "Sauce, Tomato, Chili Sauce, Bottled, With Salt": "Tomato Chilli Sauce",
    "Seeds, Flaxseed": "Flaxseed",
    "Seeds, Pumpkin and Squash Seed Kernels, Dried": "Pumpkin Seeds",
    "Soymilk, Original and Vanilla, With Added Calcium, Vitamins A and D": "Soy Milk",
    "Soup, Stock, Chicken, Home-Prepared": "Chicken Stock",
    "Soup, Vegetable Broth, Ready To Serve": "Vegetable Broth",
    "Soda, Bicarbonate": "Baking Soda",
    "Sweetener, Herbal Extract Powder From Stevia Leaf": "Stevia Powder",
    "Tofu, Soft, Prepared With Calcium Sulfate and Magnesium Chloride Nigari": "Tofu",
    "Water, Tap, Drinking": "Water",
    "Wheat Bran, Crude": "Wheat Bran",
    "Wheat Flour, Whole-Grain": "Whole Wheat Flour",
    "Wheat, Semolina": "Semolina",
    "Yogurt, Greek, Plain, Lowfat": "Low-Fat Greek Yogurt",
  }).map(([key, value]) => [key.toLowerCase(), value]),
);

const removableDescriptors = new Set([
  "all",
  "all varieties",
  "big",
  "common",
  "drinking",
  "elongate",
  "fresh",
  "local",
  "plain",
  "poultry",
  "regular",
  "ripe",
  "raw",
  "skinless",
  "small",
  "tap",
  "whole",
]);

const prefixDescriptors = new Map<string, string>([
  ["active dry", "Active Dry"],
  ["baked", "Baked"],
  ["boiled", "Boiled"],
  ["brown", "Brown"],
  ["canned", "Canned"],
  ["cooked", "Cooked"],
  ["country", "Country"],
  ["dried", "Dried"],
  ["dry", "Dry"],
  ["frozen", "Frozen"],
  ["golden", "Golden"],
  ["grated", "Grated"],
  ["green", "Green"],
  ["ground", "Ground"],
  ["light", "Light"],
  ["low carb", "Low-Carb"],
  ["lowfat", "Low-Fat"],
  ["orange", "Orange"],
  ["powdered", "Powdered"],
  ["red", "Red"],
  ["roasted", "Roasted"],
  ["skimmed", "Skimmed"],
  ["white", "White"],
  ["yellow", "Yellow"],
]);

const groupPrefixes = new Map<string, string>([
  ["Oil", "Oil"],
  ["Oils", "Oil"],
  ["Sauce", "Sauce"],
  ["Sauces", "Sauce"],
  ["Seed", "Seed"],
  ["Seeds", "Seeds"],
  ["Spice", "Spice"],
  ["Spices", "Spice"],
  ["Sugar", "Sugar"],
  ["Sugars", "Sugar"],
  ["Syrup", "Syrup"],
  ["Syrups", "Syrup"],
]);

const accessibleAliases = new Map(
  Object.entries({
    "Active Dry Yeast": "baking yeast",
    "Almond Flour": "badam ka atta",
    "Almond Milk": "badam milk",
    "Amaranth Flour": "rajgira atta",
    "Arugula": "salad wala leafy green",
    "Asafoetida": "hing",
    "Asparagus": "hari asparagus",
    "Avocado Fruit": "makhanphal",
    "Baby Lettuce": "salad patta",
    "Bajra": "pearl millet",
    "Baking Soda": "meetha soda",
    "Balsamic Vinegar": "sweet dark vinegar",
    "Barley": "jau",
    "Basil Leaves": "tulsi jaisi herb",
    "Bay Leaf": "tej patta",
    "Breadcrumbs": "bread ka chura",
    "Bulgur Wheat": "daliya jaisa wheat",
    "Button Mushroom": "safed mushroom",
    "Carom Seeds": "ajwain",
    "Chana Dal": "split chana dal",
    "Cheddar Cheese": "cheese",
    "Chia Seeds": "chia beej",
    "Chickpeas": "kabuli chana",
    "Chives": "hara onion herb",
    "Cider Vinegar": "apple vinegar",
    "Cinnamon Stick": "dalchini",
    "Cloves": "laung",
    "Coconut Milk": "nariyal milk",
    "Coconut Meat": "nariyal giri",
    "Coriander Leaves": "hara dhaniya",
    "Coriander Powder": "dhaniya powder",
    "Coriander Seeds": "sabut dhaniya",
    "Couscous": "suji jaisa grain",
    "Cow Milk": "doodh",
    "Cumin Seeds": "jeera",
    "Curry Leaves": "kadi patta",
    "Dried Basil": "sukhi basil herb",
    "Dried Mango Powder": "amchur powder",
    "Dried Oregano": "pizza herb",
    "Dried Parsley": "sukhi parsley herb",
    "Dried Sesame Seeds": "til",
    "Dried Thyme": "sukhi thyme herb",
    "Egg White": "ande ka safed hissa",
    "Extra Virgin Olive Oil": "olive oil",
    "Fennel Seeds": "saunf",
    "Fenugreek Leaves": "methi leaves",
    "Fenugreek Seeds": "methi dana",
    "Feta Cheese": "crumbly cheese",
    "Flaxseed Seeds": "alsi ke beej",
    "Flaxseed": "alsi ke beej",
    "Ghee": "desi ghee",
    "Gingelly Oil": "til ka tel",
    "Green Gram": "sabut moong",
    "Ground Cinnamon": "dalchini powder",
    "Himalayan Pink Salt": "sendha namak",
    "Jaggery": "gud",
    "Jowar": "sorghum millet",
    "Kale": "hara saag",
    "Kidney Red Mature Seeds Beans": "rajma",
    "Lemon Juice": "nimbu ka ras",
    "Lime Juice": "nimbu ka ras",
    "Low-Fat Greek Yogurt": "hung curd jaisa dahi",
    "Mustard Oil": "sarson ka tel",
    "Mustard Seeds": "rai",
    "Nutmeg": "jaiphal",
    "Oat Bran": "oats ka chilka",
    "Oats Flour": "oats atta",
    "Olive Oil": "zaitoon ka tel",
    "Organic Jaggery": "gud",
    "Paprika": "mild red chilli powder",
    "Parmesan Grated Cheese": "grated cheese",
    "Pearled Barley": "jau",
    "Pigeonpeas": "arhar/toor dal",
    "Pumpkin Seeds": "kaddu ke beej",
    "Pressed Rice": "poha",
    "Pumpkin and Squash Kernels Seeds": "kaddu ke beej",
    "Quinoa": "quinoa grain",
    "Ragi": "finger millet",
    "Red Bell Pepper": "red capsicum",
    "Rice Flakes": "poha",
    "Rock Salt": "sendha namak",
    "Rosemary": "herb",
    "Samai": "little millet",
    "Semolina Wheat": "sooji/rava",
    "Semolina": "sooji/rava",
    "Sour Cream": "khatti cream",
    "Sour Curd": "khatta dahi",
    "Soy Milk": "soya milk",
    "Soy Sauce Made From Soy Tamari": "soy sauce",
    "Soya Nuggets": "soya chunks",
    "Stevia Powder": "natural sweetener",
    "Table Salt": "namak",
    "Tamarind Paste": "imli paste",
    "Tofu": "soy paneer",
    "Toned Milk": "doodh",
    "Vegetable Broth": "sabzi stock",
    "Walnut": "akhrot",
    "Whole Wheat Flour": "gehun atta",
    "Wheat Bran": "gehun ka chokar",
    "Yellow Moong Dal": "peeli moong dal",
    "Zucchini": "turai jaisi squash",
  }).map(([key, value]) => [key.toLowerCase(), value]),
);

function sentenceCaseWords(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b[A-Za-z][A-Za-z']*/g, (word) => {
      const lower = word.toLowerCase();
      if (lower === "and" || lower === "of" || lower === "to") return lower;
      return lower.replace(/^[a-z]/, (letter) => letter.toUpperCase());
    });
}

function singularizeBase(value: string) {
  return value
    .replace(/^Onions$/i, "Onion")
    .replace(/^Mushrooms$/i, "Mushroom")
    .replace(/^Sugars$/i, "Sugar")
    .replace(/^Syrups$/i, "Syrup")
    .replace(/^Chillies$/i, "Chillies");
}

function compactIngredientPhrase(value: string) {
  return sentenceCaseWords(value)
    .replace(/\bChili\b/g, "Chilli")
    .replace(/\bLowfat\b/g, "Low-Fat")
    .replace(/\bMulti Grain\b/g, "Multigrain")
    .replace(/\bWhole Grain\b/g, "Whole Grain")
    .replace(/\s+-\s+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function appendAccessibleAlias(value: string) {
  if (value.includes("(")) return value;

  const alias = accessibleAliases.get(value.toLowerCase());
  return alias ? `${value} (${alias})` : value;
}

function applyGroupedDisplayName(parts: string[]) {
  const lowerGroup = parts[0].toLowerCase();
  if (lowerGroup === "alcoholic beverage" || lowerGroup === "alcoholic beverages") {
    const descriptors = parts.slice(1).map((part) => part.toLowerCase());
    const beverage = descriptors.find((part) =>
      ["beer", "wine", "rum", "vodka", "whiskey", "gin", "sake", "liqueur"].some(
        (token) => part.includes(token),
      ),
    ) ?? descriptors[0];
    const prefixes = descriptors
      .filter((part) => part !== beverage)
      .filter((part) => !removableDescriptors.has(part))
      .map((part) => prefixDescriptors.get(part) ?? compactIngredientPhrase(part));

    return compactIngredientPhrase(`${prefixes.join(" ")} ${beverage}`);
  }

  const group = groupPrefixes.get(parts[0]);
  if (!group) return null;

  const descriptors = parts
    .slice(1)
    .map((part) => part.toLowerCase())
    .filter((part) => !removableDescriptors.has(part));
  if (descriptors.length === 0) return compactIngredientPhrase(parts[0]);

  const keyPart = descriptors[0]
    .replace(/\bseeds?\b/gi, "")
    .replace(/\bagents?\b/gi, "")
    .trim();
  const prefixes = descriptors
    .slice(1)
    .map((part) => prefixDescriptors.get(part) ?? compactIngredientPhrase(part))
    .filter(Boolean);
  const base = compactIngredientPhrase(keyPart || descriptors[0]);

  if (group === "Oil") return compactIngredientPhrase(`${base} Oil`);
  if (group === "Sauce") return compactIngredientPhrase(`${base} Sauce`);
  if (group === "Sugar") return compactIngredientPhrase(`${prefixes.join(" ")} ${base} Sugar`);
  if (group === "Syrup") return compactIngredientPhrase(`${prefixes.join(" ")} ${base} Syrup`);
  if (group === "Seeds") return compactIngredientPhrase(`${prefixes.join(" ")} ${base} Seeds`);
  if (group === "Spice") return compactIngredientPhrase(`${prefixes.join(" ")} ${base}`);

  return compactIngredientPhrase(`${prefixes.join(" ")} ${base}`);
}

export function normalizeIngredientDisplayName(value: string) {
  const cleanName = normalizeIngredientName(value);
  const override = displayNameOverrides.get(cleanName.toLowerCase());
  if (override) return appendAccessibleAlias(override);

  const normalized = cleanName
    .replace(/\(([^)]*)\)/g, " $1 ")
    .replace(/\s+/g, " ")
    .trim();

  const parts = normalized
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length <= 1) return appendAccessibleAlias(compactIngredientPhrase(normalized));

  const grouped = applyGroupedDisplayName(parts);
  if (grouped) return appendAccessibleAlias(grouped);

  const base = singularizeBase(parts[0]);
  const prefixes = parts
    .slice(1)
    .map((part) => part.toLowerCase().replace(/\s+-\s+/g, " "))
    .filter((part) => !removableDescriptors.has(part))
    .map((part) => prefixDescriptors.get(part) ?? compactIngredientPhrase(part));

  return appendAccessibleAlias(compactIngredientPhrase(`${prefixes.join(" ")} ${base}`));
}

export function getIngredientSlug(name: string) {
  return slugify(normalizeIngredientName(name));
}
