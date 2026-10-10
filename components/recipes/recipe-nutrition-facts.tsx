"use client";

import { ShieldCheck } from "lucide-react";

import { calculateRecipeNutrition } from "@/lib/calculate-recipe-nutrition";
import type { RecipeIngredientType } from "@/types/recipe";

interface RecipeNutritionFactsProps {
  recipeIngredients: RecipeIngredientType[];
  quantity: number;
}

const RecipeNutritionFacts = ({
  recipeIngredients,
  quantity,
}: RecipeNutritionFactsProps) => {
  const hasVerifiedNutrition =
    recipeIngredients.length > 0 &&
    recipeIngredients.every((item) => item.ingredient.isPublished);
  const { totals, missingConversions } =
    calculateRecipeNutrition(recipeIngredients);

  if (!hasVerifiedNutrition || missingConversions.length > 0) {
    return (
      <div className="flex gap-3 rounded-2xl border border-[#ead8bc] bg-[#fbf4e7] p-5 dark:border-white/10 dark:bg-[#162e27]">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#a67a40] dark:text-[#d4ad67]" />
        <div>
          <p className="font-semibold text-[#352a22] dark:text-[#eff2eb]">
            Nutrition details are being prepared
          </p>
          <p className="mt-1 text-sm leading-6 text-[#75665a] dark:text-[#aab8b1]">
            Ingredient quantities and cooking steps are ready. Verified nutrient
            values will appear here once every measure is confirmed.
          </p>
        </div>
      </div>
    );
  }

  const scaled = (value: number) => value * quantity;
  const nutrientBars = [
    { label: "Protein", value: scaled(totals.protein), target: 50, unit: "g" },
    { label: "Carbohydrates", value: scaled(totals.carbohydrate), target: 275, unit: "g" },
    { label: "Total fat", value: scaled(totals.totalFat), target: 78, unit: "g" },
    { label: "Dietary fiber", value: scaled(totals.dietaryFiber), target: 28, unit: "g" },
  ];
  const vitamins = [
    ["Vitamin A", scaled(totals.vitaminA), "mcg"],
    ["Vitamin C", scaled(totals.ascorbicAcids), "mg"],
    ["Vitamin D", scaled(totals.vitaminD), "mcg"],
    ["Vitamin E", scaled(totals.tocopherolEquivalent), "mg"],
    ["Vitamin K", scaled(totals.vitaminK), "mcg"],
    ["Vitamin B1", scaled(totals.thiamine), "mg"],
    ["Vitamin B2", scaled(totals.riboflavin), "mg"],
    ["Vitamin B6", scaled(totals.totalB6), "mg"],
    ["Folate B9", scaled(totals.folates), "mcg"],
  ] as const;
  const minerals = [
    ["Calcium", scaled(totals.calcium), "mg"],
    ["Iron", scaled(totals.iron), "mg"],
    ["Phosphorus", scaled(totals.phosphorus), "mg"],
    ["Potassium", scaled(totals.potassium), "mg"],
    ["Sodium", scaled(totals.sodium), "mg"],
    ["Zinc", scaled(totals.zinc), "mg"],
  ] as const;

  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="relative overflow-hidden rounded-[1.55rem] bg-[#17382d] p-6 text-[#fff9ed] dark:bg-[#18372f]">
          <div className="absolute -right-9 -top-12 size-40 rounded-full border border-[#e8c779]/18" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#e2bf73]">
            Estimated energy
          </p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-5xl font-semibold leading-none">
              {scaled(totals.calories).toFixed(0)}
            </span>
            <span className="text-sm text-white/70">kcal</span>
          </div>
          <p className="mt-4 max-w-[14rem] text-sm leading-6 text-white/68">
            For {quantity} {quantity === 1 ? "serving" : "servings"}, based
            on measured ingredients.
          </p>
          <div className="mt-6 flex gap-3">
            <div className="rounded-xl bg-white/8 px-3 py-2">
              <p className="text-[11px] text-white/60">Protein</p>
              <p className="font-semibold">{scaled(totals.protein).toFixed(1)} g</p>
            </div>
            <div className="rounded-xl bg-white/8 px-3 py-2">
              <p className="text-[11px] text-white/60">Fiber</p>
              <p className="font-semibold">{scaled(totals.dietaryFiber).toFixed(1)} g</p>
            </div>
          </div>
        </div>
        <div className="rounded-[1.55rem] border border-[#eee1cf] bg-[#fcf7ed] p-5 dark:border-white/8 dark:bg-[#162e27]">
          <p className="mb-4 text-sm font-semibold text-[#342920] dark:text-[#eef2ed]">
            Nutrient balance
          </p>
          <div className="space-y-4">
            {nutrientBars.map(({ label, value, target, unit }) => (
              <div key={label}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-[#75665a] dark:text-[#a7b5af]">{label}</span>
                  <span className="font-semibold text-[#342920] dark:text-[#e9eee9]">
                    {value.toFixed(1)} {unit}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#ece2d2] dark:bg-white/8">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#c9943d] to-[#3e8861]"
                    style={{ width: `${Math.min((value / target) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] leading-5 text-[#887566] dark:text-[#95a59e]">
            Bars provide a simple visual reference against general daily values.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {[
          { label: "Vitamins", values: vitamins },
          { label: "Minerals", values: minerals },
        ].map((group) => (
          <div
            key={group.label}
            className="rounded-2xl border border-[#eee1cf] p-4 dark:border-white/8"
          >
            <h3 className="mb-3 text-sm font-semibold text-[#322820] dark:text-[#eef2ed]">
              {group.label}
            </h3>
            <div className="space-y-2.5">
              {group.values.map(([label, value, unit]) => (
                <div
                  key={label}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-[#75665a] dark:text-[#a7b5af]">{label}</span>
                  <span className="font-medium text-[#342920] dark:text-[#e9eee9]">
                    {value.toFixed(1)} {unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-5 flex items-center gap-2 text-xs text-[#807061] dark:text-[#a6b4ae]">
        <ShieldCheck className="size-4 text-[#478561]" />
        Calculated from measured ingredients for {quantity}{" "}
        {quantity === 1 ? "serving" : "servings"}.
      </p>
    </div>
  );
};

export default RecipeNutritionFacts;
