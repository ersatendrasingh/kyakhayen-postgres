export type PreparationFormRecord = {
  id: string;
  name: string;
  position: number | null;
  _count: {
    RecipeIngredients: number;
  };
};

export type PreparationFormImportRow = {
  name: string;
};
