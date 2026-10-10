import { DietTypesDashboard } from "@/components/admin/recipe-diet-types/diet-types-dashboard";
import { db } from "@/lib/db";

const DietTypePage = async () => {
  const [dietTypes, recipesTagged, totalRecipes] = await Promise.all([
    db.dietTypes.findMany({
      orderBy: [{ position: "asc" }, { title: "asc" }],
      include: {
        _count: {
          select: { recipeDietType: true },
        },
      },
    }),
    db.recipes.count({
      where: {
        recipeDietType: {
          some: {},
        },
      },
    }),
    db.recipes.count(),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <DietTypesDashboard
        dietTypes={dietTypes}
        recipesTagged={recipesTagged}
        untaggedRecipes={totalRecipes - recipesTagged}
      />
    </div>
  );
};

export default DietTypePage;
