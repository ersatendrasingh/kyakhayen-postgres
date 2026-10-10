import { Prisma } from "@prisma/client";

import { ArticlesDashboard } from "@/components/admin/articles/articles-dashboard";
import type { ArticleListRecord } from "@/components/admin/articles/article-types";
import { db } from "@/lib/db";

const PAGE_SIZE = 12;

type ArticleSearchParams = Promise<{
  q?: string | string[];
  category?: string | string[];
  status?: string | string[];
  tag?: string | string[];
  page?: string | string[];
}>;

const singleParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? (value[0] ?? "") : (value ?? "");

const contentReadyFilter: Prisma.PostWhereInput = {
  content: { not: null },
  imageUrl: { not: null },
  metaTitle: { not: null },
  PostCategory: { some: {} },
  PostTag: { some: {} },
};

const ArticlesPage = async ({
  searchParams,
}: {
  searchParams: ArticleSearchParams;
}) => {
  const params = await searchParams;
  const search = singleParam(params.q).trim();
  const categoryId = singleParam(params.category);
  const status = singleParam(params.status);
  const tagId = singleParam(params.tag);
  const requestedPage = Math.max(
    Number.parseInt(singleParam(params.page) || "1", 10) || 1,
    1
  );

  const where: Prisma.PostWhereInput = {
    ...(search
      ? {
          OR: [{ title: { contains: search } }, { slug: { contains: search } }],
        }
      : {}),
    ...(categoryId ? { PostCategory: { some: { categoryId } } } : {}),
    ...(tagId ? { PostTag: { some: { tagId } } } : {}),
    ...(status === "published"
      ? { isPublished: true }
      : status === "draft"
        ? { isPublished: false }
        : status === "incomplete"
          ? { NOT: contentReadyFilter }
          : {}),
  };

  const [total, published, contentReady, totalFiltered, categories, tags] = await Promise.all([
    db.post.count(),
    db.post.count({ where: { isPublished: true } }),
    db.post.count({ where: contentReadyFilter }),
    db.post.count({ where }),
    db.category.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
    db.articleTag.findMany({
      orderBy: [{ position: "asc" }, { title: "asc" }],
      select: { id: true, title: true },
    }),
  ]);

  const pageCount = Math.max(Math.ceil(totalFiltered / PAGE_SIZE), 1);
  const page = Math.min(requestedPage, pageCount);
  const entries = await db.post.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: {
      author: { select: { name: true } },
      PostCategory: { include: { category: { select: { id: true, title: true } } } },
      PostTag: { include: { tag: { select: { id: true, title: true } } } },
    },
  });

  const articles: ArticleListRecord[] = entries.map((article) => ({
    id: article.id,
    title: article.title,
    slug: article.slug,
    imageUrl: article.imageUrl,
    content: article.content,
    metaTitle: article.metaTitle,
    isPublished: article.isPublished,
    updatedAt: article.updatedAt.toISOString(),
    categories: article.PostCategory.map(({ category }) => ({
      id: category.id,
      label: category.title,
    })),
    tags: article.PostTag.map(({ tag }) => ({ id: tag.id, label: tag.title })),
    authorName: article.author.name,
  }));

  return (
    <ArticlesDashboard
      key={[search, categoryId, tagId, status, page].join(":")}
      articles={articles}
      categories={categories.map((category) => ({ id: category.id, label: category.title }))}
      tags={tags.map((tag) => ({ id: tag.id, label: tag.title }))}
      stats={{
        total,
        published,
        drafts: total - published,
        contentReady,
      }}
      filters={{ search, categoryId, tagId, status }}
      page={page}
      pageCount={pageCount}
      totalFiltered={totalFiltered}
    />
  );
};

export default ArticlesPage;
