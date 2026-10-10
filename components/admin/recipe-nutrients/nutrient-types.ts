export type NutrientRecord = {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  position: number | null;
  isPublished: boolean;
  _count: {
    recipeNutrient: number;
  };
};

export type NutrientImportRow = {
  title: string;
  imageUrl?: string;
};
