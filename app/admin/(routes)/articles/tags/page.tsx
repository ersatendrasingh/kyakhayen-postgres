import { ArticleTagsDashboard } from "@/components/admin/article-tags/article-tags-dashboard";
import { db } from "@/lib/db";

export default async function ArticleTagsPage() {
  const tags = await db.articleTag.findMany({
    orderBy: [{ position: "asc" }, { title: "asc" }],
    include: { _count: { select: { PostTag: true } } },
  });
  return <ArticleTagsDashboard tags={tags.map((tag) => ({ id: tag.id, title: tag.title, slug: tag.slug, imageUrl: tag.imageUrl, position: tag.position, isPublished: tag.isPublished, articleCount: tag._count.PostTag }))} />;
}
