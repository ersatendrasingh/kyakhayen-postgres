export type MeasurementUnitRecord = {
  id: string;
  title: string;
  shortName: string;
  position: number | null;
  _count: {
    RecipeIngredients: number;
    IngredientUnitMeasurements: number;
  };
};

export type MeasurementUnitImportRow = {
  title: string;
  shortName: string;
};
