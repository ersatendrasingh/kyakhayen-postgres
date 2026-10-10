import type {
  PreparationFormImportRow,
  PreparationFormRecord,
} from "@/components/admin/preparation-forms/preparation-form-types";

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

export function exportPreparationForms(forms: PreparationFormRecord[], fileName: string) {
  const lines = [
    ["name", "recipeUses"].map(escapeCsv).join(","),
    ...forms.map((form) => [form.name, form._count.RecipeIngredients].map(escapeCsv).join(",")),
  ];
  downloadCsv(lines.join("\n"), fileName);
}

export function downloadPreparationFormTemplate() {
  downloadCsv(["name", "Chopped"].join("\n"), "preparation-forms-import-template.csv");
}

export async function parsePreparationFormCsv(file: File) {
  const lines = (await file.text())
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV file must include a header and at least one row.");
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase());
  const nameIndex = headers.indexOf("name");
  if (nameIndex === -1) {
    throw new Error('CSV header must contain a "name" column.');
  }

  return lines.slice(1).map((line) => {
    const name = parseCsvLine(line)[nameIndex]?.trim();
    if (!name) throw new Error("Every preparation form row must include a name.");
    return { name } satisfies PreparationFormImportRow;
  });
}
