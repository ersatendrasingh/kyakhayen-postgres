export type IngredientCategoryRecord = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  position: number | null;
  isPublished: boolean;
  _count: {
    ingredient: number;
  };
};

export type IngredientCategoryImportRow = {
  name: string;
  imageUrl?: string;
};
