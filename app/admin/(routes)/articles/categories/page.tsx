import { ArticleCategoriesDashboard } from "@/components/admin/article-categories/article-categories-dashboard";
import { db } from "@/lib/db";

const ArticleCategoriesPage = async () => {
  const [categories, totalArticles, uncategorizedArticles] = await Promise.all([
    db.category.findMany({
      orderBy: [{ position: "asc" }, { title: "asc" }],
      include: { _count: { select: { PostCategory: true } } },
    }),
    db.post.count(),
    db.post.count({ where: { PostCategory: { none: {} } } }),
  ]);

  return (
    <ArticleCategoriesDashboard
      categories={categories.map((category) => ({
        id: category.id,
        title: category.title,
        slug: category.slug,
        imageUrl: category.imageUrl,
        position: category.position,
        isPublished: category.isPublished,
        articleCount: category._count.PostCategory,
      }))}
      totalArticles={totalArticles}
      uncategorizedArticles={uncategorizedArticles}
    />
  );
};

export default ArticleCategoriesPage;
