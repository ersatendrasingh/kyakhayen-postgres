export type DietTypeRecord = {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  position: number | null;
  isPublished: boolean;
  _count: {
    recipeDietType: number;
  };
};

export type DietTypeImportRow = {
  title: string;
  imageUrl?: string;
};
