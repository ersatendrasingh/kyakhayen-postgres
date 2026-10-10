import { CuisinesDashboard } from "@/components/admin/recipe-cuisines/cuisines-dashboard";
import { db } from "@/lib/db";

const CuisinesPage = async () => {
  const [cuisines, recipesCovered] = await Promise.all([
    db.cuisines.findMany({
      orderBy: [{ position: "asc" }, { title: "asc" }],
      include: {
        _count: {
          select: {
            recipeCuisine: true,
          },
        },
      },
    }),
    db.recipes.count({
      where: {
        recipeCuisine: {
          some: {},
        },
      },
    }),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <CuisinesDashboard cuisines={cuisines} recipesCovered={recipesCovered} />
    </div>
  );
};

export default CuisinesPage;
