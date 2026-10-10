import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

import RecipeSidebarWidget from "@/components/recipes/recipe-sidebar-widget";
import SmartBmiCta from "@/components/sections/bmi-tool/smart-bmi-cta";
import type { RecipeSidebarTaxonomyItem } from "@/lib/public-content";

interface RecipeSidebarProps {
  recipeCategories: RecipeSidebarTaxonomyItem[];
  recipeMealTimes?: RecipeSidebarTaxonomyItem[];
  recipeTypes?: RecipeSidebarTaxonomyItem[];
}

const RecipeSidebar = ({
  recipeCategories,
  recipeMealTimes,
  recipeTypes,
}: RecipeSidebarProps) => {
  return (
    <aside className="space-y-5 lg:sticky lg:top-[76px]">
      <div className="recipe-sidebar-panel overflow-hidden rounded-[1.75rem] bg-[#153329] p-6 text-white shadow-[0_28px_62px_-42px_rgba(16,40,29,0.84)] dark:bg-[#132c25]">
        <Sparkles className="mb-4 size-5 text-[#e6c476]" />
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#e0bd72]">
          Find another plate
        </p>
        <h2 className="mt-3 text-xl font-semibold leading-snug">
          Explore recipes made around your craving.
        </h2>
        <p className="mt-3 text-sm leading-6 text-white/67">
          Browse by food preference or time of day and discover your next meal.
        </p>
        <Link
          href="/recipes"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#fff7e9] px-4 py-3 text-sm font-semibold text-[#173229] transition hover:bg-white"
        >
          Browse all recipes
          <ArrowRight className="size-4" />
        </Link>
      </div>
      <SmartBmiCta variant="sidebar" />
      <RecipeSidebarWidget
        title="Food preference"
        eyebrow="Choose your style"
        widgetItems={recipeCategories}
        type="category"
      />
      <RecipeSidebarWidget
        title="Mealtime inspiration"
        eyebrow="Cook by moment"
        widgetItems={recipeMealTimes}
        type="mealTime"
      />
      <RecipeSidebarWidget
        title="Recipe collections"
        eyebrow="Try something new"
        widgetItems={recipeTypes}
        type="recipeType"
      />
    </aside>
  );
};

export default RecipeSidebar;
