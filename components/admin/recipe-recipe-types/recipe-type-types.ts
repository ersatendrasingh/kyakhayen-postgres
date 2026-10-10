export type RecipeTypeRecord = {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  position: number | null;
  isPublished: boolean;
  _count: {
    recipeRecipeType: number;
  };
};

export type RecipeTypeImportRow = {
  title: string;
  imageUrl?: string;
};
