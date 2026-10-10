import type {
  MeasurementUnitImportRow,
  MeasurementUnitRecord,
} from "@/components/admin/measurement-units/measurement-unit-types";

function escapeCsv(value: string | number | null | undefined) {
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

export function exportMeasurementUnits(units: MeasurementUnitRecord[], fileName: string) {
  const lines = [
    ["title", "symbol", "recipeUses", "ingredientMappings"].map(escapeCsv).join(","),
    ...units.map((unit) =>
      [
        unit.title,
        unit.shortName,
        unit._count.RecipeIngredients,
        unit._count.IngredientUnitMeasurements,
      ]
        .map(escapeCsv)
        .join(",")
    ),
  ];

  downloadCsv(lines.join("\n"), fileName);
}

export function downloadMeasurementUnitTemplate() {
  downloadCsv(["title,shortName", "Tablespoon,tbsp"].join("\n"), "measurement-units-import-template.csv");
}

export async function parseMeasurementUnitCsv(file: File) {
  const lines = (await file.text())
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV file must include a header and at least one row.");
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase());
  const titleIndex = headers.indexOf("title");
  const symbolIndex = headers.indexOf("shortname");

  if (titleIndex === -1 || symbolIndex === -1) {
    throw new Error('CSV header must contain "title" and "shortName" columns.');
  }

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const title = values[titleIndex]?.trim();
    const shortName = values[symbolIndex]?.trim();
    if (!title || !shortName) {
      throw new Error("Every measurement unit row must include a title and symbol.");
    }
    return { title, shortName } satisfies MeasurementUnitImportRow;
  });
}
