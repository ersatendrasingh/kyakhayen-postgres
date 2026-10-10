import { BodyTypesDashboard } from "@/components/admin/recipe-body-types/body-types-dashboard";
import { db } from "@/lib/db";

const BodyTypesPage = async () => {
  const [bodyTypes, taggedRecipes] = await Promise.all([
    db.bodyTypes.findMany({
      orderBy: [{ position: "asc" }, { title: "asc" }],
      include: {
        _count: {
          select: {
            recipeBodyTypes: true,
          },
        },
      },
    }),
    db.recipes.count({
      where: {
        recipeBodyTypes: {
          some: {},
        },
      },
    }),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <BodyTypesDashboard bodyTypes={bodyTypes} taggedRecipes={taggedRecipes} />
    </div>
  );
};

export default BodyTypesPage;
