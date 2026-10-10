import type { ArticleListRecord } from "@/components/admin/articles/article-types";

function csvValue(value: string | number | boolean) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function exportArticles(articles: ArticleListRecord[], fileName: string) {
  const rows = [
    ["Title", "Slug", "Categories", "Status", "Author", "Updated"].map(csvValue).join(","),
    ...articles.map((article) =>
      [
        article.title,
        article.slug,
        article.categories.map((category) => category.label).join(", "),
        article.isPublished ? "Published" : "Draft",
        article.authorName ?? "",
        article.updatedAt,
      ]
        .map(csvValue)
        .join(",")
    ),
  ];
  const url = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
