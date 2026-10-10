"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import type { DiscoveryRecipe, MealPlanDay } from "@/components/sections/home-discovery";
import { recipeHref } from "@/lib/seo";

type JournalDayBoardProps = {
  recipes: DiscoveryRecipe[];
  plannedDays?: MealPlanDay[];
  fallbackDayLabel: string;
  fallbackTomorrowLabel: string;
};

export default function JournalDayBoard({
  recipes,
  plannedDays = [],
  fallbackDayLabel,
  fallbackTomorrowLabel,
}: JournalDayBoardProps) {
  const moments = ["Breakfast", "Lunch", "Dinner"];
  const previewDays: MealPlanDay[] = [
    {
      key: "today",
      tabLabel: "Today",
      dayLabel: fallbackDayLabel,
      meals: moments
        .map((label, index) => ({ label, recipe: recipes[index] }))
        .filter((meal) => Boolean(meal.recipe)),
    },
    {
      key: "tomorrow",
      tabLabel: "Tomorrow",
      dayLabel: fallbackTomorrowLabel,
      meals: moments
        .map((label, index) => ({ label, recipe: recipes[index + 3] }))
        .filter((meal) => Boolean(meal.recipe)),
    },
  ];
  const personalizedDays = plannedDays.filter((day) => day.meals.length > 0);
  const displayDays = personalizedDays.length > 0 ? personalizedDays : previewDays;
  const [selected, setSelected] = useState<"today" | "tomorrow">("today");
  const day =
    displayDays.find((entry) => entry.key === selected) ?? displayDays[0];

  if (!day || day.meals.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-[1.5rem] bg-[#17382d] p-5 text-white dark:bg-[#152f27]">
      <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#e0b66c]">
        <Sparkles className="size-3.5" />
        {personalizedDays.length > 0 ? "Your planned table" : "Plan ahead"}
      </p>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-lg font-semibold">{day.dayLabel}&apos;s ideas</p>
          <p className="mt-1 text-xs text-white/60">
            {personalizedDays.length > 0 ? "From your meal plan" : "Kitchen inspiration"}
          </p>
        </div>
        <div className="flex rounded-full border border-white/12 bg-white/[0.05] p-1">
          {displayDays.map((entry) => (
            <button
              key={entry.key}
              type="button"
              onClick={() => setSelected(entry.key)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                selected === entry.key
                  ? "bg-[#bf3c2d] text-white"
                  : "text-white/66 hover:text-white"
              }`}
            >
              {entry.tabLabel}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5 space-y-2.5">
        {day.meals.slice(0, 3).map(({ label, recipe }) => (
          <Link
            key={`${day.key}-${label}-${recipe.id}`}
            href={recipeHref(recipe)}
            className="group flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.06] p-2 transition hover:bg-white/[0.11]"
          >
            <div className="relative size-12 shrink-0 overflow-hidden rounded-lg">
              <Image
                src={recipe.imageUrl || "/meta-images/recipe-page.jpg"}
                alt={recipe.title}
                fill
                sizes="48px"
                className="object-cover transition group-hover:scale-105"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d9ad63]">
                {label}
              </p>
              <p className="line-clamp-1 text-xs font-medium text-white/90">
                {recipe.title}
              </p>
            </div>
            <ArrowRight className="size-3.5 text-white/45 transition group-hover:translate-x-0.5 group-hover:text-white" />
          </Link>
        ))}
      </div>
    </section>
  );
}
