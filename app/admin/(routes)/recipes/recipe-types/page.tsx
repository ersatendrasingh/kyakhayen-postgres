import { RecipeTypesDashboard } from "@/components/admin/recipe-recipe-types/recipe-types-dashboard";
import { db } from "@/lib/db";

const RecipeTypePage = async () => {
  const [recipeTypes, recipesTagged, totalRecipes] = await Promise.all([
    db.recipeTypes.findMany({
      orderBy: [{ position: "asc" }, { title: "asc" }],
      include: {
        _count: {
          select: { recipeRecipeType: true },
        },
      },
    }),
    db.recipes.count({
      where: {
        recipeRecipeType: {
          some: {},
        },
      },
    }),
    db.recipes.count(),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <RecipeTypesDashboard
        recipeTypes={recipeTypes}
        recipesTagged={recipesTagged}
        untaggedRecipes={totalRecipes - recipesTagged}
      />
    </div>
  );
};

export default RecipeTypePage;
