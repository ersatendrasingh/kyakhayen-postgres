export type ArticleCategoryOption = {
  id: string;
  label: string;
};

export type ArticleTagOption = {
  id: string;
  label: string;
};

export type ArticleListRecord = {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  content: string | null;
  metaTitle: string | null;
  isPublished: boolean;
  updatedAt: string;
  categories: ArticleCategoryOption[];
  tags: ArticleTagOption[];
  authorName: string | null;
};

export type ArticleFilters = {
  search: string;
  categoryId: string;
  tagId: string;
  status: string;
};

export type ArticleEditorRecord = {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  content: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaSlug: string | null;
  isPublished: boolean;
  updatedAt: string;
  categories: ArticleCategoryOption[];
  tags: ArticleTagOption[];
  authorName: string | null;
};
