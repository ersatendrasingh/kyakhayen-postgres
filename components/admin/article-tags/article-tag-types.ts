export type ArticleTagRecord = {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  position: number | null;
  isPublished: boolean;
  articleCount: number;
};
