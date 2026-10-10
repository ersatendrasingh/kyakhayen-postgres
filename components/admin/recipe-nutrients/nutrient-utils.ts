import type {
  NutrientImportRow,
  NutrientRecord,
} from "@/components/admin/recipe-nutrients/nutrient-types";

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

export function exportNutrients(nutrients: NutrientRecord[], fileName: string) {
  const lines = [
    ["title", "slug", "linkedRecipes", "published", "imageUrl"]
      .map(escapeCsv)
      .join(","),
    ...nutrients.map((nutrient) =>
      [
        nutrient.title,
        nutrient.slug,
        nutrient._count.recipeNutrient,
        nutrient.isPublished,
        nutrient.imageUrl,
      ]
        .map(escapeCsv)
        .join(",")
    ),
  ];

  downloadCsv(lines.join("\n"), fileName);
}

export function downloadNutrientTemplate() {
  downloadCsv(
    ["title,imageUrl", "High Protein,"].join("\n"),
    "nutrients-import-template.csv"
  );
}

export async function parseNutrientCsv(file: File) {
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
      throw new Error("Every nutrient row must have a title.");
    }

    return {
      title,
      imageUrl: imageUrl || undefined,
    } satisfies NutrientImportRow;
  });
}
