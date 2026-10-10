import { RecipeIngredientType } from "@/types/recipe";

export type RecipeNutritionTotals = {
  calories: number;
  carbohydrate: number;
  protein: number;
  dietaryFiber: number;
  totalFat: number;
  vitaminA: number;
  vitaminD: number;
  vitaminK: number;
  ascorbicAcids: number;
  tocopherolEquivalent: number;
  thiamine: number;
  riboflavin: number;
  totalB6: number;
  folates: number;
  calcium: number;
  iron: number;
  phosphorus: number;
  potassium: number;
  sodium: number;
  zinc: number;
};

const emptyTotals = (): RecipeNutritionTotals => ({
  calories: 0,
  carbohydrate: 0,
  protein: 0,
  dietaryFiber: 0,
  totalFat: 0,
  vitaminA: 0,
  vitaminD: 0,
  vitaminK: 0,
  ascorbicAcids: 0,
  tocopherolEquivalent: 0,
  thiamine: 0,
  riboflavin: 0,
  totalB6: 0,
  folates: 0,
  calcium: 0,
  iron: 0,
  phosphorus: 0,
  potassium: 0,
  sodium: 0,
  zinc: 0,
});

const gramUnitShortNames = new Set(["g", "gm", "gram", "grams"]);
const kilogramUnitShortNames = new Set(["kg", "kgs", "kilogram", "kilograms"]);
const milligramUnitShortNames = new Set(["mg", "milligram", "milligrams"]);
const milliliterUnitShortNames = new Set(["ml", "milliliter", "milliliters"]);
const literUnitShortNames = new Set(["l", "ltr", "liter", "liters", "litre", "litres"]);

function unitShortName(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, "");
}

export function recipeIngredientGrams(recipeIngredient: RecipeIngredientType) {
  const { ingredient, quantity, unitId, unit } = recipeIngredient;
  const matchingUnit = ingredient.IngredientUnitMeasurements.find(
    (measurement) => measurement.unitId === unitId
  );

  if (matchingUnit) return matchingUnit.values * quantity;

  const shortName = unitShortName(unit?.shortName);

  if (gramUnitShortNames.has(shortName)) return quantity;
  if (kilogramUnitShortNames.has(shortName)) return quantity * 1000;
  if (milligramUnitShortNames.has(shortName)) return quantity / 1000;
  if (milliliterUnitShortNames.has(shortName)) return quantity;
  if (literUnitShortNames.has(shortName)) return quantity * 1000;

  return null;
}

export function calculateRecipeNutrition(ingredients: RecipeIngredientType[]) {
  const totals = emptyTotals();
  const missingConversions: string[] = [];

  ingredients.forEach((recipeIngredient) => {
    const { ingredient, unit } = recipeIngredient;
    const grams = recipeIngredientGrams(recipeIngredient);

    if (grams === null) {
      missingConversions.push(`${ingredient.name} (${unit?.title ?? "unknown unit"})`);
      return;
    }

    const basisGrams = ingredient.nutritionBasisGrams || 100;
    const add = (value: number | null | undefined) =>
      ((value ?? 0) / basisGrams) * grams;

    totals.calories += add(ingredient.calories);
    totals.carbohydrate += add(ingredient.carbohydrate);
    totals.protein += add(ingredient.protein);
    totals.dietaryFiber += add(ingredient.dietaryFiber);
    totals.totalFat += add(ingredient.totalFat);
    totals.vitaminA += add(ingredient.vitaminA);
    totals.vitaminD += add(ingredient.vitaminD);
    totals.vitaminK += add(ingredient.vitaminK);
    totals.ascorbicAcids += add(ingredient.ascorbicAcids);
    totals.tocopherolEquivalent += add(ingredient.tocopherolEquivalent);
    totals.thiamine += add(ingredient.thiamine);
    totals.riboflavin += add(ingredient.riboflavin);
    totals.totalB6 += add(ingredient.totalB6);
    totals.folates += add(ingredient.folates);
    totals.calcium += add(ingredient.calcium);
    totals.iron += add(ingredient.iron);
    totals.phosphorus += add(ingredient.phosphorus);
    totals.potassium += add(ingredient.potassium);
    totals.sodium += add(ingredient.sodium);
    totals.zinc += add(ingredient.zinc);
  });

  return { totals, missingConversions };
}
