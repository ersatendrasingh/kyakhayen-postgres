export type AllergyRecord = {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  position: number | null;
  isPublished: boolean;
  _count: {
    recipeAllergies: number;
  };
};

export type AllergyImportRow = {
  title: string;
  imageUrl?: string;
};
