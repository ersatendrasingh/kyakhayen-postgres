import { NutrientsDashboard } from "@/components/admin/recipe-nutrients/nutrients-dashboard";
import { db } from "@/lib/db";

const NutrientsPage = async () => {
  const [nutrients, recipesTagged, totalRecipes] = await Promise.all([
    db.nutrient.findMany({
      orderBy: [{ position: "asc" }, { title: "asc" }],
      include: {
        _count: {
          select: {
            recipeNutrient: true,
          },
        },
      },
    }),
    db.recipes.count({
      where: {
        recipeNutrient: {
          some: {},
        },
      },
    }),
    db.recipes.count(),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <NutrientsDashboard
        nutrients={nutrients}
        recipesTagged={recipesTagged}
        untaggedRecipes={totalRecipes - recipesTagged}
      />
    </div>
  );
};

export default NutrientsPage;
