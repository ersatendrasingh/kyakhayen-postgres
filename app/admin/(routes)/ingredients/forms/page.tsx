import { PreparationFormsDashboard } from "@/components/admin/preparation-forms/preparation-forms-dashboard";
import { db } from "@/lib/db";

const IngredientsForm = async () => {
  const ingredientsForm = await db.ingredientsForm.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { RecipeIngredients: true } },
    },
  });

  return <PreparationFormsDashboard forms={ingredientsForm} />;
};

export default IngredientsForm;
