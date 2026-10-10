import { redirect } from "next/navigation";

import { IngredientEditor } from "@/components/admin/ingredients/ingredient-editor";
import { db } from "@/lib/db";

const IngredientIdPage = async ({
  params,
}: {
  params: Promise<{ ingredientId: string }>;
}) => {
  const { ingredientId } = await params;
  const [ingredient, categories, units] = await Promise.all([
    db.ingredients.findUnique({
      where: { id: ingredientId },
      include: {
        IngredientUnitMeasurements: {
          include: { unit: true },
          orderBy: { unit: { title: "asc" } },
        },
        _count: { select: { RecipeIngredients: true } },
      },
    }),
    db.ingredientCategories.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.units.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true, shortName: true },
    }),
  ]);

  if (!ingredient) {
    redirect("/admin/ingredients");
  }

  return (
    <IngredientEditor ingredient={ingredient} categories={categories} units={units} />
  );
};

export default IngredientIdPage;
