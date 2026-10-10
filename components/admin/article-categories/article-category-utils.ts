import type {
  ArticleCategoryImportRow,
  ArticleCategoryRecord,
} from "@/components/admin/article-categories/article-category-types";

function escapeCsv(value: string | number | boolean | null | undefined) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function parseCsvLine(line: string) {
  const fields: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      fields.push(value.trim());
      value = "";
    } else {
      value += character;
    }
  }

  fields.push(value.trim());
  return fields;
}

function downloadCsv(content: string, fileName: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(href);
}

export function exportArticleCategories(
  categories: ArticleCategoryRecord[],
  fileName = "article-categories.csv"
) {
  const lines = [
    ["title", "slug", "position", "published", "linkedArticles", "imageUrl"]
      .map(escapeCsv)
      .join(","),
    ...categories.map((category) =>
      [
        category.title,
        category.slug,
        category.position,
        category.isPublished,
        category.articleCount,
        category.imageUrl,
      ]
        .map(escapeCsv)
        .join(",")
    ),
  ];
  downloadCsv(lines.join("\n"), fileName);
}

export function downloadArticleCategoryTemplate() {
  downloadCsv(
    ["title,imageUrl", "Kitchen Guides,"].join("\n"),
    "article-categories-import-template.csv"
  );
}

export async function parseArticleCategoryCsv(file: File) {
  const text = await file.text();
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV file must include a header and at least one row.");
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase());
  const titleIndex = headers.indexOf("title");
  const imageIndex = headers.indexOf("imageurl");

  if (titleIndex === -1) {
    throw new Error('CSV header must contain a "title" column.');
  }

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const title = values[titleIndex]?.trim();
    const imageUrl = imageIndex >= 0 ? values[imageIndex]?.trim() : undefined;
    if (!title) {
      throw new Error("Every category row must have a title.");
    }
    return { title, imageUrl: imageUrl || undefined } satisfies ArticleCategoryImportRow;
  });
}
