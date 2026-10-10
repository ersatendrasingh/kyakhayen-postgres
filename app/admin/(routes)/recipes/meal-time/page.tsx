import { MealTimesDashboard } from "@/components/admin/recipe-meal-times/meal-times-dashboard";
import { db } from "@/lib/db";

const MealTimePage = async () => {
  const [mealTimes, recipesScheduled, totalRecipes] = await Promise.all([
    db.mealTimes.findMany({
      orderBy: [{ position: "asc" }, { title: "asc" }],
      include: {
        _count: {
          select: {
            recipeMealTime: true,
          },
        },
      },
    }),
    db.recipes.count({
      where: {
        recipeMealTime: {
          some: {},
        },
      },
    }),
    db.recipes.count(),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <MealTimesDashboard
        mealTimes={mealTimes}
        recipesScheduled={recipesScheduled}
        untaggedRecipes={totalRecipes - recipesScheduled}
      />
    </div>
  );
};

export default MealTimePage;
