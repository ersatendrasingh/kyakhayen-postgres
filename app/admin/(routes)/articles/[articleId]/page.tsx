import { notFound } from "next/navigation";

import { ArticleEditor } from "@/components/admin/articles/article-editor";
import type { ArticleEditorRecord } from "@/components/admin/articles/article-types";
import { db } from "@/lib/db";

const ArticlePage = async (props: { params: Promise<{ articleId: string }> }) => {
  const params = await props.params;
  const [post, categories, tags] = await Promise.all([
    db.post.findUnique({
      where: { id: params.articleId },
      include: {
        author: { select: { name: true } },
        PostCategory: { include: { category: { select: { id: true, title: true } } } },
        PostTag: { include: { tag: { select: { id: true, title: true } } } },
      },
    }),
    db.category.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
    db.articleTag.findMany({
      orderBy: [{ position: "asc" }, { title: "asc" }],
      select: { id: true, title: true },
    }),
  ]);

  if (!post) {
    notFound();
  }

  const article: ArticleEditorRecord = {
    id: post.id,
    title: post.title,
    slug: post.slug,
    imageUrl: post.imageUrl,
    content: post.content,
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
    metaSlug: post.metaSlug,
    isPublished: post.isPublished,
    updatedAt: post.updatedAt.toISOString(),
    categories: post.PostCategory.map(({ category }) => ({
      id: category.id,
      label: category.title,
    })),
    tags: post.PostTag.map(({ tag }) => ({ id: tag.id, label: tag.title })),
    authorName: post.author.name,
  };

  return (
    <ArticleEditor
      article={article}
      categoryOptions={categories.map((category) => ({
        id: category.id,
        label: category.title,
      }))}
      tagOptions={tags.map((tag) => ({ id: tag.id, label: tag.title }))}
    />
  );
};

export default ArticlePage;
