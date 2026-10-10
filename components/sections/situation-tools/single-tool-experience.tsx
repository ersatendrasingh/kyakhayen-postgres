"use client";

import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Share2,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";

import { emptyPagination, recipePageSize } from "@/components/sections/situation-tools/constants";
import {
  buildResultCopy,
  recipeToSuggestion,
} from "@/components/sections/situation-tools/recipe-formatters";
import {
  RecipeResultCard,
  RecipeResultSkeleton,
} from "@/components/sections/situation-tools/recipe-result-card";
import {
  BudgetControls,
  DailyMenuControls,
  FoodTypeControls,
  GuestPlannerControls,
  MomsModeControls,
} from "@/components/sections/situation-tools/tool-control-panels";
import type {
  RecipePagination,
  RecipeSuggestion,
  SituationKey,
  SituationRecipe,
} from "@/components/sections/situation-tools/types";

type SingleToolExperienceProps = {
  activeKey: Exclude<SituationKey, "ingredients">;
  kicker: string;
  intro: string;
  defaultMealFocus?: string;
  defaultGuestCount?: number;
  defaultGuestPlan?: string;
  defaultBudget?: number;
  defaultFoodType?: string;
};

export default function SingleToolExperience({
  activeKey,
  kicker,
  intro,
  defaultMealFocus = "full-day",
  defaultGuestCount = 5,
  defaultGuestPlan = "full-meal",
  defaultBudget = 150,
  defaultFoodType = "veg",
}: SingleToolExperienceProps) {
  const [mealFocus, setMealFocus] = useState(defaultMealFocus);
  const [guestCount, setGuestCount] = useState(defaultGuestCount);
  const [guestPlan, setGuestPlan] = useState(defaultGuestPlan);
  const [budget, setBudget] = useState(defaultBudget);
  const [foodType, setFoodType] = useState(defaultFoodType);
  const [recipePage, setRecipePage] = useState(0);
  const [recipeSuggestions, setRecipeSuggestions] = useState<RecipeSuggestion[]>([]);
  const [recipePagination, setRecipePagination] =
    useState<RecipePagination>(emptyPagination);
  const [isRecipeLoading, setIsRecipeLoading] = useState(false);
  const [recipeError, setRecipeError] = useState(false);
  const [shareStatus, setShareStatus] = useState("Share");

  const resetRecipePage = () => setRecipePage(0);
  const result = useMemo(
    () =>
      buildResultCopy({
        activeKey,
        selectedIngredients: [],
        ingredientLabels: {},
        mealFocus,
        guestCount,
        guestPlan,
        budget,
        foodType,
      }),
    [activeKey, budget, foodType, guestCount, guestPlan, mealFocus],
  );
  const totalRecipePages = Math.max(
    Math.ceil(recipePagination.total / recipePagination.pageSize),
    1,
  );
  const pageLabel =
    recipePagination.total > 0
      ? `Page ${recipePagination.page + 1} of ${totalRecipePages}`
      : "Finding recipes";
  const canGoPrevious = recipePagination.hasPrevious && !isRecipeLoading;
  const canGoNext = recipePagination.hasNext && !isRecipeLoading;
  const shareText = `${result.heading}\n${recipeSuggestions
    .slice(0, 5)
    .map((item) => `- ${item.title}`)
    .join("\n")}\n\nExplore more tools on Kya Khayen.`;

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();

    params.set("mode", activeKey);
    params.set("pageSize", String(recipePageSize));
    params.set("page", String(recipePage));
    params.set("foodType", foodType);
    params.set("_r", String(Date.now()));
    if (activeKey === "daily") params.set("mealFocus", mealFocus);
    if (activeKey === "guests") {
      params.set("guestCount", String(guestCount));
      params.set("guestPlan", guestPlan);
    }
    if (activeKey === "budget") params.set("budget", String(budget));

    const fetchRecipes = async () => {
      setIsRecipeLoading(true);
      setRecipeError(false);

      try {
        const response = await fetch(`/api/recipes/situation-matches?${params}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
          signal: controller.signal,
        });

        if (!response.ok) throw new Error("Failed to load recipes");

        const payload = (await response.json()) as {
          recipes?: SituationRecipe[];
          total?: number;
          page?: number;
          pageSize?: number;
          hasNext?: boolean;
          hasPrevious?: boolean;
        };
        const mappedSuggestions = (payload.recipes ?? [])
          .map((recipe) =>
            recipeToSuggestion(recipe, {
              activeKey,
              selectedIngredients: [],
              ingredientLabels: {},
              mealFocus,
              guestCount,
              guestPlan,
              budget,
            }),
          )
          .filter((recipe): recipe is RecipeSuggestion => Boolean(recipe));

        setRecipeSuggestions(mappedSuggestions);
        setRecipePagination({
          total: payload.total ?? 0,
          page: payload.page ?? recipePage,
          pageSize: payload.pageSize ?? recipePageSize,
          hasNext: Boolean(payload.hasNext),
          hasPrevious: Boolean(payload.hasPrevious),
        });
      } catch {
        if (!controller.signal.aborted) {
          setRecipeSuggestions([]);
          setRecipePagination(emptyPagination);
          setRecipeError(true);
        }
      } finally {
        if (!controller.signal.aborted) setIsRecipeLoading(false);
      }
    };

    void fetchRecipes();

    return () => controller.abort();
  }, [
    activeKey,
    budget,
    foodType,
    guestCount,
    guestPlan,
    mealFocus,
    recipePage,
  ]);

  const handleShare = async () => {
    setShareStatus("Sharing");

    try {
      if (navigator.share) {
        await navigator.share({
          title: result.heading,
          text: shareText,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
      }

      setShareStatus("Copied");
      window.setTimeout(() => setShareStatus("Share"), 1400);
    } catch {
      setShareStatus("Share");
    }
  };

  return (
    <div className="overflow-hidden rounded-[1.35rem] border border-[#ead9c3] bg-[#fffaf1] shadow-[0_28px_80px_-44px_rgba(63,38,21,0.58)] dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex flex-col gap-4 border-b border-[#ead9c3] bg-[#fffdf8]/88 p-4 dark:border-white/10 dark:bg-white/[0.035] sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#b63a29] text-white shadow-lg shadow-[#b63a29]/20">
            <SlidersHorizontal className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a17135] dark:text-[#efcb83]">
              {kicker}
            </p>
            <p className="mt-1 line-clamp-1 text-lg font-semibold text-[#2f241d] dark:text-white">
              {result.heading}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:min-w-[260px]">
          <div className="rounded-xl border border-[#ead9c3] bg-white px-3 py-2 dark:border-white/10 dark:bg-white/[0.05]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9a6b38]">
              Matches
            </p>
            <p className="text-xl font-semibold text-[#2f241d] dark:text-white">
              {recipePagination.total}
            </p>
          </div>
          <div className="rounded-xl border border-[#ead9c3] bg-white px-3 py-2 dark:border-white/10 dark:bg-white/[0.05]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9a6b38]">
              Page
            </p>
            <p className="text-xl font-semibold text-[#2f241d] dark:text-white">
              {recipePagination.total > 0 ? recipePagination.page + 1 : 0}
            </p>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-0 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="relative z-30 min-w-0 border-b border-[#ead9c3] bg-[#fffdf8]/74 p-4 dark:border-white/10 dark:bg-white/[0.03] sm:p-5 lg:border-b-0 lg:border-r">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a17135] dark:text-[#efcb83]">
              Controls
            </p>
            <h2 className="mt-2 text-xl font-semibold leading-tight text-[#2f241d] dark:text-white sm:text-2xl">
              {result.heading}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#786859] dark:text-white/66">
              {intro}
            </p>
          </div>

          <div className="space-y-4 rounded-lg border border-[#ead9c3] bg-white p-3 dark:border-white/10 dark:bg-white/[0.045] sm:p-4">
            {activeKey === "daily" && (
              <DailyMenuControls
                mealFocus={mealFocus}
                setMealFocus={setMealFocus}
                resetPage={resetRecipePage}
              />
            )}

            {activeKey === "guests" && (
              <GuestPlannerControls
                guestCount={guestCount}
                setGuestCount={setGuestCount}
                guestPlan={guestPlan}
                setGuestPlan={setGuestPlan}
                resetPage={resetRecipePage}
              />
            )}

            {activeKey === "budget" && (
              <BudgetControls
                budget={budget}
                setBudget={setBudget}
                resetPage={resetRecipePage}
              />
            )}

            {activeKey === "moms" && <MomsModeControls />}

            <FoodTypeControls
              foodType={foodType}
              setFoodType={setFoodType}
              resetPage={resetRecipePage}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {result.highlights.map((highlight) => (
              <span
                key={highlight}
                className="rounded-md bg-[#f1e4cf] px-3 py-2 text-xs font-semibold text-[#6c513d] dark:bg-white/10 dark:text-white/72"
              >
                {highlight}
              </span>
            ))}
          </div>
        </div>

        <div className="min-w-0 p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a17135] dark:text-[#efcb83]">
                Recipe picks
              </p>
              <h2 className="mt-1 text-lg font-semibold text-[#2f241d] dark:text-white">
                Open any recipe and start cooking.
              </h2>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="hidden text-xs font-semibold text-[#7d6a5c] dark:text-white/62 sm:inline">
                {pageLabel}
              </span>
              <button
                type="button"
                disabled={!canGoPrevious}
                onClick={() => setRecipePage((current) => Math.max(0, current - 1))}
                className="flex size-10 items-center justify-center rounded-full border border-[#ead9c3] bg-white text-[#8a6d53] transition enabled:hover:border-[#d09b51] enabled:hover:text-primary disabled:cursor-not-allowed disabled:opacity-42 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70"
                aria-label="Previous recipes"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                disabled={!canGoNext}
                onClick={() => setRecipePage((current) => current + 1)}
                className="flex size-10 items-center justify-center rounded-full border border-[#ead9c3] bg-white text-[#8a6d53] transition enabled:hover:border-[#d09b51] enabled:hover:text-primary disabled:cursor-not-allowed disabled:opacity-42 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70"
                aria-label="Next recipes"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          {recipeError ? (
            <div className="rounded-lg border border-[#ead9c3] bg-white px-4 py-8 text-center dark:border-white/10 dark:bg-white/[0.04]">
              <p className="font-semibold text-[#2f241d] dark:text-white">
                Recipes could not load right now.
              </p>
              <p className="mt-2 text-sm text-[#806c5d] dark:text-white/64">
                Try another option once.
              </p>
            </div>
          ) : isRecipeLoading && recipeSuggestions.length === 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: recipePageSize }).map((_, index) => (
                <RecipeResultSkeleton key={index} />
              ))}
            </div>
          ) : recipeSuggestions.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {isRecipeLoading
                ? Array.from({ length: recipePageSize }).map((_, index) => (
                    <RecipeResultSkeleton key={index} />
                  ))
                : recipeSuggestions.map((suggestion) => (
                    <RecipeResultCard key={suggestion.key} suggestion={suggestion} />
                  ))}
            </div>
          ) : (
            <div className="rounded-lg border border-[#ead9c3] bg-white px-4 py-10 text-center dark:border-white/10 dark:bg-white/[0.04]">
              <p className="font-semibold text-[#2f241d] dark:text-white">
                {result.emptyTitle}
              </p>
              <p className="mt-2 text-sm text-[#806c5d] dark:text-white/64">
                {result.emptyBody}
              </p>
            </div>
          )}

          <div className="mt-4 grid gap-3 rounded-lg border border-[#ead9c3] bg-[#f5ead8] p-3 dark:border-white/10 dark:bg-white/[0.06] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <p className="min-w-0 text-sm font-semibold leading-6 text-[#4b3a2e] dark:text-white/78">
              {result.quickTip}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-[#dfc6a8] bg-white px-4 py-2 text-sm font-semibold text-[#604b3c] transition hover:border-[#d09b51] hover:text-primary dark:border-white/10 dark:bg-white/[0.08] dark:text-white"
              >
                <Share2 className="size-4" /> {shareStatus}
              </button>
              <Link
                href="/recipes"
                className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
              >
                All recipes
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
