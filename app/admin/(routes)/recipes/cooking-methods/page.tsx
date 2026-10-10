import { db } from "@/lib/db";

import { CookingMethodsDashboard } from "@/components/admin/recipe-cooking-methods/cooking-methods-dashboard";

const CookingMethodsPage = async () => {
  const cookingMethods = await db.cookingMethods.findMany({
    orderBy: [{ position: "asc" }, { title: "asc" }],
    include: {
      _count: {
        select: {
          recipeCookingMethod: true,
        },
      },
    },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <CookingMethodsDashboard cookingMethods={cookingMethods} />
    </div>
  );
};

export default CookingMethodsPage;
