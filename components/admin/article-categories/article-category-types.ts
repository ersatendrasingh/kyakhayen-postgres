export type ArticleCategoryRecord = {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  position: number | null;
  isPublished: boolean;
  articleCount: number;
};

export type ArticleCategoryImportRow = {
  title: string;
  imageUrl?: string;
};
