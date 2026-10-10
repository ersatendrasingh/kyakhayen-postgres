import {
  broadCuisineSlugs,
  foodTypeOptions,
  guestPlanOptions,
  mealFocusOptions,
} from "@/components/sections/situation-tools/constants";
import type {
  RecipeSuggestion,
  ResultCopy,
  SituationKey,
  SituationRecipe,
} from "@/components/sections/situation-tools/types";
import { recipeHref as canonicalRecipeHref } from "@/lib/seo";

export function recipeHref(recipe: SituationRecipe) {
  return canonicalRecipeHref(recipe);
}

export function getTotalMinutes(recipe: SituationRecipe) {
  if (!recipe.recipeCookingTime) return null;

  return (
    recipe.recipeCookingTime.prepTime +
    recipe.recipeCookingTime.cookTime +
    recipe.recipeCookingTime.restTime
  );
}

export function formatMinutes(minutes: number | null) {
  if (minutes === null || minutes <= 0) return "Recipe";
  return minutes === 1 ? "1 min" : `${minutes} min`;
}

export function normalizeValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatLabel(value: string, labels: Record<string, string> = {}) {
  return (
    labels[value] ??
    value
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
}

export function listLabels(values: string[], labels: Record<string, string>) {
  return values.map((value) => formatLabel(value, labels));
}

export function readableList(items: string[], fallback: string) {
  if (items.length === 0) return fallback;
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;

  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function mealFocusLabel(mealFocus: string) {
  return (
    mealFocusOptions.find((option) => option.id === mealFocus)?.label ?? "Any meal"
  );
}

export function foodTypeLabel(foodType: string) {
  return foodTypeOptions.find((option) => option.id === foodType)?.label ?? "Veg";
}

export function guestPlanLabel(guestPlan: string) {
  return guestPlanOptions.find((option) => option.id === guestPlan)?.label ?? "Full meal";
}

function mealLabel(recipe: SituationRecipe) {
  const preferred = ["lunch", "dinner", "breakfast", "snack", "starter"].find((meal) =>
    [
      ...(recipe.recipeMealTime ?? []).map(
        (item) => `${item.mealTime.title} ${item.mealTime.slug}`,
      ),
      ...(recipe.recipeRecipeType ?? []).map(
        (item) => `${item.recipeType.title} ${item.recipeType.slug}`,
      ),
    ].some((value) => normalizeValue(value).includes(meal)),
  );

  if (preferred === "snack" || preferred === "starter") return "Snacks";
  if (preferred) return formatLabel(preferred);
  return recipe.recipeMealTime?.[0]?.mealTime.title ?? "Any meal";
}

function cuisineLabel(recipe: SituationRecipe) {
  const cuisines = recipe.recipeCuisine?.map((item) => item.cuisine) ?? [];
  const preferred =
    cuisines.find((cuisine) => {
      const slug = cuisine.slug || normalizeValue(cuisine.title).replace(/\s+/g, "-");
      return !broadCuisineSlugs.has(slug);
    }) ?? cuisines[0];

  return preferred?.title ?? null;
}

export function recipeToSuggestion(
  recipe: SituationRecipe,
  context: {
    activeKey: SituationKey;
    selectedIngredients: string[];
    ingredientLabels: Record<string, string>;
    mealFocus: string;
    guestCount: number;
    guestPlan: string;
    budget: number;
  },
): RecipeSuggestion | null {
  if (!recipe.imageUrl) return null;

  const ingredientCount =
    recipe.ingredientCount ?? recipe.recipeIngredients?.length ?? null;
  const meal = mealLabel(recipe);
  const type = recipe.recipeRecipeType?.[0]?.recipeType.title ?? "Meal";
  const cuisine = cuisineLabel(recipe);
  const benefit = recipe.recipeNutrient?.[0]?.nutrient.title ?? null;
  let badge = cuisine ?? meal;
  let info =
    benefit ||
    (ingredientCount && ingredientCount > 0 ? `${ingredientCount} items` : type);

  const meta =
    recipe.matchLabel ||
    recipe.recipeMealTime?.[0]?.mealTime.title ||
    recipe.recipeIngredients
      ?.slice(0, 3)
      .map((item) => item.ingredient.name)
      .join(", ") ||
    "Recipe pick";

  if (context.activeKey === "budget" && recipe.estimatedCostInr) {
    info = `~Rs ${recipe.estimatedCostInr}`;
  }

  if (!cuisine) {
    if (context.activeKey === "ingredients") {
      badge = meal === "Any meal" ? type : meal;
    } else if (context.activeKey === "daily") {
      badge =
        context.mealFocus === "full-day" ? meal : mealFocusLabel(context.mealFocus);
    } else if (context.activeKey === "guests") {
      badge =
        context.guestPlan === "snacks"
          ? "Snacks"
          : context.guestPlan === "quick"
            ? meal === "Any meal"
              ? "Quick"
              : meal
            : meal === "Any meal"
              ? "Guests"
              : meal;
    } else if (context.activeKey === "budget") {
      badge = meal === "Any meal" ? "Budget" : meal;
    } else if (context.activeKey === "moms") {
      badge = meal === "Any meal" ? "Kids" : meal;
    }
  }

  return {
    key: recipe.id,
    title: recipe.title,
    meta,
    tag: formatMinutes(getTotalMinutes(recipe)),
    badge,
    href: recipeHref(recipe),
    imageUrl: recipe.imageUrl,
    context: info,
  };
}

export function buildResultCopy({
  activeKey,
  selectedIngredients,
  ingredientLabels,
  mealFocus,
  guestCount,
  guestPlan,
  budget,
  foodType,
}: {
  activeKey: SituationKey;
  selectedIngredients: string[];
  ingredientLabels: Record<string, string>;
  mealFocus: string;
  guestCount: number;
  guestPlan: string;
  budget: number;
  foodType: string;
}): ResultCopy {
  const foodLabel = foodTypeLabel(foodType);

  if (activeKey === "ingredients") {
    const labels = listLabels(selectedIngredients, ingredientLabels);
    const ingredientText = readableList(labels, "your ingredients");

    return {
      heading:
        selectedIngredients.length > 0
          ? `Recipes using ${ingredientText}.`
          : "Search ingredients from your kitchen.",
      subheading: "Add what you have at home and find ideas that fit.",
      highlights: [
        `${selectedIngredients.length} selected`,
        foodLabel,
        "Smart matches",
      ],
      quickTip:
        "Add one main ingredient and one supporting ingredient for tighter matches.",
      emptyTitle:
        selectedIngredients.length > 0
          ? "No matching recipes found."
          : "Add an ingredient to see recipe ideas.",
      emptyBody:
        selectedIngredients.length > 0
          ? "Try a broader ingredient name or add another item from your kitchen."
          : "Search for paneer, rice, roti, dal, potato, onion, or anything available at home.",
    };
  }

  if (activeKey === "daily") {
    const label = mealFocusLabel(mealFocus);

    return {
      heading: `${label} recipe picks.`,
      subheading: "Choose the meal slot and get ideas for the day.",
      highlights: [label, foodLabel, "Fresh ideas"],
      quickTip: "Switch the meal slot when you want a different kind of idea.",
      emptyTitle: "No recipes found for this meal slot.",
      emptyBody: "Try Any meal for more options.",
    };
  }

  if (activeKey === "guests") {
    const plan = guestPlanLabel(guestPlan);

    return {
      heading: `${plan} ideas for ${guestCount} guests.`,
      subheading: "Choose what you are serving, then browse easier options.",
      highlights: [`${guestCount} guests`, plan, foodLabel],
      quickTip: "Guest mode now changes by serving style, not just the headcount.",
      emptyTitle: "Guest recipes could not be matched.",
      emptyBody: "Try another serving style once.",
    };
  }

  if (activeKey === "budget") {
    return {
      heading: `Recipes around Rs ${budget}.`,
      subheading: "Browse ideas matched by ingredient cost and recipe quantity.",
      highlights: [`Rs ${budget}`, foodLabel, "Cost matched"],
      quickTip:
        "Lower the budget for simpler meals, or increase it to unlock richer dishes.",
      emptyTitle: "No reliable budget matches yet.",
      emptyBody: "Try a slightly higher budget or switch the food type.",
    };
  }

  return {
    heading: "Moms mode recipe picks.",
    subheading: "Simple recipes kids can enjoy at home.",
    highlights: [foodLabel, "Kids-friendly", "Family meals"],
    quickTip: "Use the food type filter so the ideas match the family preference.",
    emptyTitle: "Kids-friendly picks are not available right now.",
    emptyBody: "Try Any food type for more options.",
  };
}
