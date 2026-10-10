import type { RecipeListRecord } from "@/components/admin/recipes/recipe-types";

const escapeCsv = (value: string | number | boolean | null) =>
  `"${String(value ?? "").replaceAll('"', '""')}"`;

export function exportRecipes(recipes: RecipeListRecord[], fileName: string) {
  const rows = [
    [
      "title",
      "slug",
      "category",
      "difficulty",
      "seasonUse",
      "seasons",
      "totalMinutes",
      "published",
      "updatedAt",
    ],
    ...recipes.map((recipe) => [
      recipe.title,
      recipe.slug,
      recipe.category?.name ?? "",
      recipe.difficulty?.title ?? "",
      recipe.seasonality,
      recipe.seasons.map((season) => season.title).join("; "),
      recipe.totalMinutes ?? "",
      recipe.isPublished,
      recipe.updatedAt,
    ]),
  ];

  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
