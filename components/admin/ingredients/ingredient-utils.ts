import type { IngredientRecord } from "@/components/admin/ingredients/ingredient-types";

const escapeCsvValue = (value: string | number | boolean) =>
  `"${String(value).replaceAll('"', '""')}"`;

export function exportIngredients(ingredients: IngredientRecord[], fileName: string) {
  const rows = [
    [
      "name",
      "slug",
      "category",
      "imageUrl",
      "published",
      "nutritionComplete",
      "unitMappings",
      "recipeUses",
      "missingConversions",
    ],
    ...ingredients.map((ingredient) => [
      ingredient.name,
      ingredient.slug ?? "",
      ingredient.category?.name ?? "",
      ingredient.imageUrl ?? "",
      ingredient.isPublished,
      ingredient.nutritionComplete,
      ingredient.unitMappingCount,
      ingredient.recipeUsageCount,
      ingredient.missingConversionCount,
    ]),
  ];

  const content = rows
    .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
