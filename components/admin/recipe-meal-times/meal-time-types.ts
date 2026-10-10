export type MealTimeRecord = {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  position: number | null;
  isPublished: boolean;
  _count: {
    recipeMealTime: number;
  };
};

export type MealTimeImportRow = {
  title: string;
  imageUrl?: string;
};
