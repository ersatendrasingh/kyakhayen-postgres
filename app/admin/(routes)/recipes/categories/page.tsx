import { RecipeCategoriesDashboard } from "@/components/admin/recipe-categories/recipe-categories-dashboard";
import { db } from "@/lib/db";

const CategoriesPage = async () => {
  const recipeCategories = await db.recipeCategories.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          recipe: true,
        },
      },
    },
  });

  return <RecipeCategoriesDashboard categories={recipeCategories} />;
};

export default CategoriesPage;
