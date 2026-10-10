import { ArrowRight, BarChart3, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { FoodCompareSuggestion } from "@/components/sections/food-compare/types";

type RecipeComparePromptProps = {
  base: FoodCompareSuggestion;
  competitor: FoodCompareSuggestion;
  reason: string;
  variant?: "default" | "nutrition";
};

function compareHref(leftId: string, rightId: string) {
  const params = new URLSearchParams({ leftId, rightId });
  return `/tools/smart-food-compare?${params.toString()}#tool`;
}

function formatRecipeCost(value: number | null | undefined) {
  return value ? `Approx Rs ${value}` : null;
}

function foodMeta(food: FoodCompareSuggestion) {
  return [food.cuisine ?? food.category, formatRecipeCost(food.estimatedCostInr)]
    .filter(Boolean)
    .join(" · ");
}

function FoodThumb({ food }: { food: FoodCompareSuggestion }) {
  const meta = foodMeta(food);

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#eadcc8] bg-white/78 p-2.5 dark:border-white/10 dark:bg-white/[0.04]">
      <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-[#eef1e8]">
        {food.imageUrl ? (
          <Image
            src={food.imageUrl}
            alt={food.label}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : null}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-[#2f241d] dark:text-white">
          {food.label}
        </span>
        {meta && (
          <span className="mt-1 block truncate text-xs font-medium text-[#776658] dark:text-white/60">
            {meta}
          </span>
        )}
        <span className="mt-1 block text-xs font-medium text-[#776658] dark:text-white/60">
          {food.calories.toFixed(0)} kcal · {food.protein.toFixed(1)}g protein
        </span>
      </span>
    </div>
  );
}

export default function RecipeComparePrompt({
  base,
  competitor,
  reason,
  variant = "default",
}: RecipeComparePromptProps) {
  const isNutritionVariant = variant === "nutrition";
  const sectionClassName = isNutritionVariant
    ? "rounded-[1.75rem] border border-[#d9e4d9] bg-[#f7fbf5] p-4 shadow-sm dark:border-white/10 dark:bg-[#10221d] sm:p-5"
    : "rounded-[1.75rem] border border-[#d9e4d9] bg-[#f7fbf5] p-4 shadow-sm dark:border-white/10 dark:bg-[#10221d] sm:p-5";

  return (
    <section className={sectionClassName}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#b9dacb] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#0f766e] dark:border-white/10 dark:bg-[#123b36] dark:text-[#5eead4]">
            <BarChart3 className="size-3.5" />
            Food compare
          </p>
          <h2 className="mt-3 text-2xl font-semibold leading-tight text-[#2f241d] dark:text-white">
            {isNutritionVariant
              ? `Compare nutrition with ${competitor.label}`
              : `Compare ${base.label} with ${competitor.label}`}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#756354] dark:text-white/64">
            {isNutritionVariant
              ? `${reason}. Check which one gives better calories, protein, fiber, time, and recipe cost.`
              : `${reason}. See calories, protein, fiber, time, and simple reasons side by side.`}
          </p>
        </div>

        <Link
          href={compareHref(base.id, competitor.id)}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#173629] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#234b3b] dark:bg-[#f4b04d] dark:text-[#20150b] dark:hover:bg-[#ffd27a]"
        >
          Compare now
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <FoodThumb food={base} />
        <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-[#173629] text-white dark:bg-[#f4b04d] dark:text-[#20150b]">
          <Sparkles className="size-4" />
        </div>
        <FoodThumb food={competitor} />
      </div>
    </section>
  );
}
