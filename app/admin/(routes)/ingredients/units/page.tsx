import { MeasurementUnitsDashboard } from "@/components/admin/measurement-units/measurement-units-dashboard";
import { db } from "@/lib/db";

const UnitsPage = async () => {
  const [units, recipeIngredients, conversionMappings] = await Promise.all([
    db.units.findMany({
      orderBy: [{ position: "asc" }, { title: "asc" }],
      include: {
        _count: {
          select: {
            RecipeIngredients: true,
            IngredientUnitMeasurements: true,
          },
        },
      },
    }),
    db.recipeIngredients.findMany({
      select: {
        unitId: true,
        unit: { select: { shortName: true } },
        ingredient: {
          select: {
            IngredientUnitMeasurements: { select: { unitId: true } },
          },
        },
      },
    }),
    db.ingredientUnitMeasurements.count(),
  ]);

  const missingConversionRows = recipeIngredients.filter((row) => {
    if (["g", "gm"].includes(row.unit.shortName.toLowerCase())) return false;
    return !row.ingredient.IngredientUnitMeasurements.some(
      (measurement) => measurement.unitId === row.unitId
    );
  }).length;

  return (
    <MeasurementUnitsDashboard
      units={units}
      recipeUses={recipeIngredients.length}
      conversionMappings={conversionMappings}
      missingConversionRows={missingConversionRows}
    />
  );
};

export default UnitsPage;
