export type CuisineRecord = {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  position: number | null;
  isPublished: boolean;
  _count: {
    recipeCuisine: number;
  };
};

export type CuisineImportRow = {
  title: string;
  imageUrl?: string;
};
