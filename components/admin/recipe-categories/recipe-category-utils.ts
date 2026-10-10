import type {
  RecipeCategoryImportRow,
  RecipeCategoryRecord,
} from "@/components/admin/recipe-categories/recipe-category-types";

function escapeCsv(value: string | number | null | undefined) {
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

export function exportRecipeCategories(
  categories: RecipeCategoryRecord[],
  fileName: string
) {
  const lines = [
    ["name", "slug", "linkedRecipes", "imageUrl"].map(escapeCsv).join(","),
    ...categories.map((category) =>
      [
        category.name,
        category.slug,
        category._count.recipe,
        category.imageUrl,
      ]
        .map(escapeCsv)
        .join(",")
    ),
  ];

  downloadCsv(lines.join("\n"), fileName);
}

export function downloadRecipeCategoryTemplate() {
  downloadCsv(
    ["name,imageUrl", "Breakfast,"].join("\n"),
    "recipe-categories-import-template.csv"
  );
}

export async function parseRecipeCategoryCsv(file: File) {
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

  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const name = values[nameIndex]?.trim();
    const imageUrl = imageIndex >= 0 ? values[imageIndex]?.trim() : undefined;

    if (!name) {
      throw new Error("Every category row must have a name.");
    }

    return {
      name,
      imageUrl: imageUrl || undefined,
    } satisfies RecipeCategoryImportRow;
  });

  return rows;
}
