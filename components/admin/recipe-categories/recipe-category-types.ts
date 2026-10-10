export type RecipeCategoryRecord = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  position: number | null;
  isPublished: boolean;
  _count: {
    recipe: number;
  };
};

export type RecipeCategoryImportRow = {
  name: string;
  imageUrl?: string;
};
