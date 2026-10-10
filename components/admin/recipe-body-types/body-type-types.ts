export type BodyTypeRecord = {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  position: number | null;
  isPublished: boolean;
  _count: {
    recipeBodyTypes: number;
  };
};

export type BodyTypeImportRow = {
  title: string;
  imageUrl?: string;
};
