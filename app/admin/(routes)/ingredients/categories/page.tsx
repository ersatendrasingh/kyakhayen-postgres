import { IngredientCategoriesDashboard } from "@/components/admin/ingredient-categories/ingredient-categories-dashboard";
import { db } from "@/lib/db";

const IngredientCategoriesPage = async () => {
  const [ingredientCategories, publishedIngredients, unassignedIngredients] =
    await Promise.all([
      db.ingredientCategories.findMany({
        orderBy: [{ position: "asc" }, { name: "asc" }],
        include: {
          _count: { select: { ingredient: true } },
        },
      }),
      db.ingredients.count({ where: { isPublished: true } }),
      db.ingredients.count({ where: { ingredientCategoriesId: null } }),
    ]);

  return (
    <IngredientCategoriesDashboard
      categories={ingredientCategories}
      publishedIngredients={publishedIngredients}
      unassignedIngredients={unassignedIngredients}
    />
  );
};

export default IngredientCategoriesPage;
