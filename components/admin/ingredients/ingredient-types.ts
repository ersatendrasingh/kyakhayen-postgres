export type IngredientCategoryOption = {
  id: string;
  name: string;
};

export type IngredientRecord = {
  id: string;
  name: string;
  slug: string | null;
  imageUrl: string | null;
  isPublished: boolean;
  category: IngredientCategoryOption | null;
  nutritionComplete: boolean;
  recipeUsageCount: number;
  unitMappingCount: number;
  missingConversionCount: number;
};

export type IngredientMeasurement = {
  id: string;
  values: number;
  unit: {
    id: string;
    title: string;
    shortName: string;
  };
};

export type IngredientEditorRecord = {
  id: string;
  name: string;
  slug: string | null;
  imageUrl: string | null;
  isPublished: boolean;
  ingredientCategoriesId: string | null;
  nutritionSource: string | null;
  nutritionBasisGrams: number;
  calories: number | null;
  carbohydrate: number | null;
  totalFat: number | null;
  dietaryFiber: number | null;
  protein: number | null;
  marketPriceInr: number | null;
  marketPriceBasisGrams: number;
  marketPriceSource: string | null;
  marketPriceUpdatedAt: Date | null;
  vitaminA: number | null;
  ascorbicAcids: number | null;
  vitaminD: number | null;
  tocopherolEquivalent: number | null;
  vitaminK: number | null;
  thiamine: number | null;
  riboflavin: number | null;
  totalB6: number | null;
  folates: number | null;
  calcium: number | null;
  iron: number | null;
  phosphorus: number | null;
  potassium: number | null;
  sodium: number | null;
  zinc: number | null;
  IngredientUnitMeasurements: IngredientMeasurement[];
  _count: {
    RecipeIngredients: number;
  };
};
