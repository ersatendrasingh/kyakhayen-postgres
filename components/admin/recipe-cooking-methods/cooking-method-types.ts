export type CookingMethodRecord = {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  position: number | null;
  isPublished: boolean;
  _count: {
    recipeCookingMethod: number;
  };
};

export type CookingMethodImportRow = {
  title: string;
  imageUrl?: string;
};
