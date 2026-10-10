import Link from "next/link";
import { ArrowLeft, CircleAlert, FlaskConical, Scale } from "lucide-react";

import { IngredientBasicsCard } from "@/components/admin/ingredients/ingredient-basics-card";
import { IngredientEditorActions } from "@/components/admin/ingredients/ingredient-editor-actions";
import { IngredientMeasurementsCard } from "@/components/admin/ingredients/ingredient-measurements-card";
import { IngredientNutritionCard } from "@/components/admin/ingredients/ingredient-nutrition-card";
import { IngredientPricingCard } from "@/components/admin/ingredients/ingredient-pricing-card";
import type {
  IngredientCategoryOption,
  IngredientEditorRecord,
} from "@/components/admin/ingredients/ingredient-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const nutritionFields: Array<keyof IngredientEditorRecord> = [
  "calories",
  "carbohydrate",
  "totalFat",
  "dietaryFiber",
  "protein",
  "vitaminA",
  "ascorbicAcids",
  "vitaminD",
  "tocopherolEquivalent",
  "vitaminK",
  "thiamine",
  "riboflavin",
  "totalB6",
  "folates",
  "calcium",
  "iron",
  "phosphorus",
  "potassium",
  "sodium",
  "zinc",
];

export function IngredientEditor({
  ingredient,
  categories,
  units,
}: {
  ingredient: IngredientEditorRecord;
  categories: IngredientCategoryOption[];
  units: Array<{ id: string; title: string; shortName: string }>;
}) {
  const completedNutritionFields = nutritionFields.filter(
    (field) => ingredient[field] !== null
  ).length;
  const nutritionComplete = completedNutritionFields === nutritionFields.length;
  const identityComplete = Boolean(ingredient.name && ingredient.ingredientCategoriesId);
  const measurementComplete = ingredient.IngredientUnitMeasurements.length > 0;
  const pricingComplete = Boolean(
    ingredient.marketPriceInr !== null && ingredient.marketPriceBasisGrams > 0,
  );
  const canPublish = identityComplete && nutritionComplete && measurementComplete;

  return (
    <div className="min-w-0 space-y-6 overflow-x-clip">
      <section className="admin-taxonomy-hero rounded-[32px] p-5 sm:p-7">
        <div className="relative z-[1] flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-4">
            <Button variant="outline" className="admin-taxonomy-hero-action rounded-xl" asChild>
              <Link href="/admin/ingredients">
                <ArrowLeft />
                Ingredients catalog
              </Link>
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={ingredient.isPublished ? "secondary" : "outline"}>
                  {ingredient.isPublished ? "Published" : "Draft"}
                </Badge>
                {!canPublish && !ingredient.isPublished && (
                  <Badge variant="outline" className="gap-1">
                    <CircleAlert />
                    Setup incomplete
                  </Badge>
                )}
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                {ingredient.name}
              </h1>
              <p className="admin-taxonomy-hero-copy mt-2 text-sm sm:text-base">
                Maintain identity, complete nutrition data and reliable serving
                conversions in one workspace.
              </p>
            </div>
          </div>
          <IngredientEditorActions
            ingredientId={ingredient.id}
            ingredientName={ingredient.name}
            isPublished={ingredient.isPublished}
            canPublish={canPublish}
            recipeUsageCount={ingredient._count.RecipeIngredients}
          />
        </div>

        <div className="relative z-[1] mt-7 grid gap-4 sm:grid-cols-3">
          <div className="admin-taxonomy-stat rounded-3xl px-5 py-4">
            <p className="admin-taxonomy-stat-label text-sm">Nutrition coverage</p>
            <div className="mt-2 flex items-center gap-2">
              <FlaskConical className="admin-taxonomy-stat-icon size-5" />
              <p className="admin-taxonomy-stat-value text-2xl font-semibold">
                {completedNutritionFields}/{nutritionFields.length}
              </p>
            </div>
          </div>
          <div className="admin-taxonomy-stat rounded-3xl px-5 py-4">
            <p className="admin-taxonomy-stat-label text-sm">Unit mappings</p>
            <div className="mt-2 flex items-center gap-2">
              <Scale className="admin-taxonomy-stat-icon size-5" />
              <p className="admin-taxonomy-stat-value text-2xl font-semibold">
                {ingredient.IngredientUnitMeasurements.length}
              </p>
            </div>
          </div>
          <div className="admin-taxonomy-stat rounded-3xl px-5 py-4">
            <p className="admin-taxonomy-stat-label text-sm">Recipe usage</p>
            <p className="admin-taxonomy-stat-value mt-2 text-2xl font-semibold">
              {ingredient._count.RecipeIngredients}
            </p>
            <p className="admin-taxonomy-stat-label mt-1 text-xs">
              {pricingComplete ? "Price ready" : "Price missing"}
            </p>
          </div>
        </div>
      </section>

      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[370px_minmax(0,1fr)]">
        <IngredientBasicsCard ingredient={ingredient} categories={categories} />
        <div className="min-w-0 space-y-6">
          <IngredientPricingCard ingredient={ingredient} />
          <IngredientNutritionCard ingredient={ingredient} />
          <IngredientMeasurementsCard
            ingredientId={ingredient.id}
            measurements={ingredient.IngredientUnitMeasurements}
            units={units}
          />
        </div>
      </div>
    </div>
  );
}
