import { AllergiesDashboard } from "@/components/admin/recipe-allergies/allergies-dashboard";
import { db } from "@/lib/db";

const AllergiesPage = async () => {
  const [allergies, recipesTagged, totalRecipes] = await Promise.all([
    db.allergies.findMany({
      orderBy: [{ position: "asc" }, { title: "asc" }],
      include: {
        _count: {
          select: {
            recipeAllergies: true,
          },
        },
      },
    }),
    db.recipes.count({
      where: {
        recipeAllergies: {
          some: {},
        },
      },
    }),
    db.recipes.count(),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <AllergiesDashboard
        allergies={allergies}
        recipesTagged={recipesTagged}
        untaggedRecipes={totalRecipes - recipesTagged}
      />
    </div>
  );
};

export default AllergiesPage;
