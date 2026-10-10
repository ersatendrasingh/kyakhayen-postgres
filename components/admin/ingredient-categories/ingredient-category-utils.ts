import type {
  IngredientCategoryImportRow,
  IngredientCategoryRecord,
} from "@/components/admin/ingredient-categories/ingredient-category-types";

function escapeCsv(value: string | number | boolean | null | undefined) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
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

export function exportIngredientCategories(
  categories: IngredientCategoryRecord[],
  fileName: string
) {
  const lines = [
    ["name", "slug", "linkedIngredients", "published", "imageUrl"]
      .map(escapeCsv)
      .join(","),
    ...categories.map((category) =>
      [
        category.name,
        category.slug,
        category._count.ingredient,
        category.isPublished,
        category.imageUrl,
      ]
        .map(escapeCsv)
        .join(",")
    ),
  ];

  downloadCsv(lines.join("\n"), fileName);
}

export function downloadIngredientCategoryTemplate() {
  downloadCsv(
    ["name,imageUrl", "Fruits and Vegetables,"].join("\n"),
    "ingredient-categories-import-template.csv"
  );
}

export async function parseIngredientCategoryCsv(file: File) {
  const text = await file.text();
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV file must include a header and at least one row.");
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase());
  const nameIndex = headers.indexOf("name");
  const imageIndex = headers.indexOf("imageurl");

  if (nameIndex === -1) {
    throw new Error('CSV header must contain a "name" column.');
  }

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const name = values[nameIndex]?.trim();
    const imageUrl = imageIndex >= 0 ? values[imageIndex]?.trim() : undefined;

    if (!name) {
      throw new Error("Every category row must have a name.");
    }

    return {
      name,
      imageUrl: imageUrl || undefined,
    } satisfies IngredientCategoryImportRow;
  });
}
