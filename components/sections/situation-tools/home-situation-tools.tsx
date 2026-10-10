"use client";

import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Copy,
  Search,
  Share2,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import Container from "@/components/container";
import {
  emptyPagination,
  fridgeHeadlines,
  recipePageSize,
  situations,
} from "@/components/sections/situation-tools/constants";
import {
  buildResultCopy,
  guestPlanLabel,
  listLabels,
  mealFocusLabel,
  readableList,
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
  InitialRecipePage,
  RecipePagination,
  RecipeSuggestion,
  SituationKey,
  SituationRecipe,
} from "@/components/sections/situation-tools/types";
import { cn } from "@/lib/utils";

const situationImageMap = {
  ingredients: {
    src: "/assets/images/tools/ingredient-finder-hero.png",
    alt: "Indian kitchen ingredient finder with fresh vegetables",
    label: "Cook from what is already at home",
  },
  daily: {
    src: "/assets/images/tools/daily-menu-hero.png",
    alt: "Indian meal planning with breakfast lunch and dinner",
    label: "Plan today's meals faster",
  },
  guests: {
    src: "/assets/images/tools/guest-menu-hero.png",
    alt: "Indian guest menu with food served at home",
    label: "Make hosting feel easier",
  },
  budget: {
    src: "/assets/images/tools/budget-meal-hero.png",
    alt: "Budget Indian meal ideas with home ingredients",
    label: "Find ideas around your budget",
  },
  moms: {
    src: "/assets/images/tools/kids-meal-hero.png",
    alt: "Family-friendly Indian food ideas for kids",
    label: "Simple food ideas for kids",
  },
} satisfies Record<SituationKey, { src: string; alt: string; label: string }>;

const homeInitialIngredients = ["paneer"];
const homeInitialIngredientLabels = { paneer: "Paneer" };
const HomeFridgeToolExperience = dynamic(
  () => import("@/components/sections/situation-tools/fridge-tool-experience"),
  {
    loading: () => (
      <div className="rounded-[1.35rem] border border-[#ead9c3] bg-[#fffaf1] p-6 text-sm font-semibold text-[#6d5847] shadow-[0_28px_80px_-44px_rgba(63,38,21,0.58)] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70">
        Loading fridge finder...
      </div>
    ),
  },
);

export default function HomeSituationTools({
  initialRecipePage,
}: {
  initialRecipePage?: InitialRecipePage;
}) {
  const initialSuggestionContext = {
    activeKey: "ingredients" as SituationKey,
    selectedIngredients: homeInitialIngredients,
    ingredientLabels: homeInitialIngredientLabels,
    mealFocus: "full-day",
    guestCount: 5,
    guestPlan: "full-meal",
    budget: 150,
  };
  const [activeKey, setActiveKey] = useState<SituationKey>("ingredients");
  const selectedIngredients = homeInitialIngredients;
  const ingredientLabels = homeInitialIngredientLabels;
  const [mealFocus, setMealFocus] = useState("full-day");
  const [guestCount, setGuestCount] = useState(5);
  const [guestPlan, setGuestPlan] = useState("full-meal");
  const [budget, setBudget] = useState(150);
  const [foodType, setFoodType] = useState("veg");
  const [recipePage, setRecipePage] = useState(0);
  const [recipeSuggestions, setRecipeSuggestions] = useState<RecipeSuggestion[]>(
    () =>
      initialRecipePage?.recipes
        .map((recipe) => recipeToSuggestion(recipe, initialSuggestionContext))
        .filter((recipe): recipe is RecipeSuggestion => Boolean(recipe)) ?? [],
  );
  const [recipePagination, setRecipePagination] = useState<RecipePagination>(
    () =>
      initialRecipePage
        ? {
            total: initialRecipePage.total,
            page: initialRecipePage.page,
            pageSize: initialRecipePage.pageSize,
            hasNext: initialRecipePage.hasNext,
            hasPrevious: initialRecipePage.hasPrevious,
          }
        : emptyPagination,
  );
  const [isRecipeLoading, setIsRecipeLoading] = useState(false);
  const [recipeError, setRecipeError] = useState(false);
  const [shareStatus, setShareStatus] = useState("Share");
  const [headlineIndex, setHeadlineIndex] = useState(0);

  const activeSituation =
    situations.find((situation) => situation.key === activeKey) ?? situations[0];
  const situationImage = situationImageMap[activeKey];
  const resetRecipePage = () => setRecipePage(0);
  const result = useMemo(
    () =>
      buildResultCopy({
        activeKey,
        selectedIngredients,
        ingredientLabels,
        mealFocus,
        guestCount,
        guestPlan,
        budget,
        foodType,
      }),
    [
      activeKey,
      selectedIngredients,
      ingredientLabels,
      mealFocus,
      guestCount,
      guestPlan,
      budget,
      foodType,
    ],
  );

  const shareText = `${result.heading}\n${recipeSuggestions
    .slice(0, 5)
    .map((item) => `- ${item.title}`)
    .join("\n")}\n\nFind more meal ideas on KyaKhayen.`;

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setHeadlineIndex((current) => (current + 1) % fridgeHeadlines.length);
    }, 2600);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (activeKey === "ingredients") return;

    const controller = new AbortController();
    const params = new URLSearchParams();

    params.set("mode", activeKey);
    params.set("pageSize", String(recipePageSize));
    params.set("page", String(recipePage));
    params.set("foodType", foodType);

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
        const suggestionContext = {
          activeKey,
          selectedIngredients,
          ingredientLabels,
          mealFocus,
          guestCount,
          guestPlan,
          budget,
        };
        const mappedSuggestions = (payload.recipes ?? [])
          .map((recipe) => recipeToSuggestion(recipe, suggestionContext))
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
        if (!controller.signal.aborted) {
          setIsRecipeLoading(false);
        }
      }
    };

    const timeoutId = window.setTimeout(() => {
      void fetchRecipes();
    }, 0);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [
    activeKey,
    budget,
    foodType,
    guestCount,
    guestPlan,
    ingredientLabels,
    initialRecipePage,
    mealFocus,
    recipePage,
    selectedIngredients,
  ]);

  const handleShare = async () => {
    setShareStatus("Sharing");

    try {
      if (navigator.share) {
        await navigator.share({
          title: result.heading,
          text: shareText,
          url: window.location.origin,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
      }

      setShareStatus("Copied");
      window.setTimeout(() => setShareStatus("Share"), 1400);
    } catch {
      setShareStatus("Share");
    }
  };

  const totalRecipePages = Math.max(
    Math.ceil(recipePagination.total / recipePagination.pageSize),
    1,
  );
  const pageLabel =
    recipePagination.total > 0
      ? `Page ${recipePagination.page + 1} of ${totalRecipePages}`
      : "Add items";
  const canGoPrevious = recipePagination.hasPrevious && !isRecipeLoading;
  const canGoNext = recipePagination.hasNext && !isRecipeLoading;
  const recipeWord = recipePagination.total === 1 ? "recipe" : "recipes";
  const selectedIngredientText = readableList(
    listLabels(selectedIngredients, ingredientLabels),
    "these ingredients",
  );
  const recipeCountCopy =
    !isRecipeLoading && recipePagination.total > 0
      ? activeKey === "ingredients"
        ? `You can cook ${recipePagination.total} ${recipeWord} with ${selectedIngredientText}.`
        : activeKey === "daily"
          ? `${recipePagination.total} ${mealFocusLabel(mealFocus).toLowerCase()} ideas matched.`
          : activeKey === "guests"
            ? `${recipePagination.total} ${guestPlanLabel(guestPlan).toLowerCase()} ideas matched for ${guestCount} guests.`
            : activeKey === "budget"
              ? `${recipePagination.total} recipes estimated around Rs ${budget}.`
              : `${recipePagination.total} kids-friendly ideas matched.`
      : null;

  return (
    <section className="home-surface home-situation-engine relative z-20 border-y border-[#eadbc8]/72 py-8 sm:py-12 lg:py-16">
      <Container>
        <div className="mb-5 max-w-3xl sm:mb-8">
          <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            <Search className="size-4" /> Kitchen assistant
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-[#2e241c] dark:text-white sm:text-4xl">
            {fridgeHeadlines[headlineIndex]}
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
            Pick a real kitchen situation, add what you have, and find recipes
            faster.
          </p>
        </div>

        <div className="home-situation-panel overflow-visible rounded-[1.2rem] border border-[#ead9c3] bg-[#fffaf1] shadow-xl shadow-[#5c3219]/10 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="border-b border-[#ead9c3] bg-[#fffdf8]/88 p-3 dark:border-white/10 dark:bg-white/[0.035] sm:p-4">
            <div className="home-hide-scrollbar flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-5 sm:overflow-visible sm:pb-0">
              {situations.map((situation) => {
                const Icon = situation.icon;
                const active = situation.key === activeKey;

                return (
                  <button
                    key={situation.key}
                    type="button"
                    onClick={() => {
                      setActiveKey(situation.key);
                      resetRecipePage();
                      setShareStatus("Share");
                    }}
                    aria-pressed={active}
                    className={cn(
                      "min-w-[10.5rem] rounded-lg border px-3 py-3 text-left transition sm:min-w-0",
                      active
                        ? "border-[#b63a29] bg-[#b63a29] text-white shadow-sm"
                        : "border-[#ead9c3] bg-white text-[#342820] hover:border-[#cc9448] hover:bg-[#fff7e9] dark:border-white/10 dark:bg-white/[0.04] dark:text-white",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg",
                          active
                            ? "bg-white/16 text-white"
                            : "bg-[#f1e3cf] text-[#9a3c2e] dark:bg-white/10 dark:text-[#efcb83]",
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">
                          {situation.shortTitle}
                        </span>
                        <span
                          className={cn(
                            "home-situation-tab-copy mt-0.5 block overflow-hidden whitespace-nowrap text-[11px]",
                            active
                              ? "text-white/76"
                              : "text-[#7d6b5c] dark:text-white/62",
                          )}
                        >
                          <span className="home-situation-tab-copy-text">
                            {situation.prompt}
                          </span>
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {activeKey === "ingredients" ? (
            <div className="bg-[linear-gradient(145deg,#fff9ef,#fffdf8)] p-3 dark:bg-[linear-gradient(145deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] sm:p-4 lg:p-5">
              <HomeFridgeToolExperience
                initialIngredients={homeInitialIngredients}
                initialIngredientLabels={homeInitialIngredientLabels}
                initialRecipePage={initialRecipePage}
                initialMealFocus="full-day"
                syncUrl={false}
                leftPanelVisual={situationImageMap.ingredients}
              />
            </div>
          ) : (
          <div className="grid min-w-0 gap-0 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="relative z-30 min-w-0 border-b border-[#ead9c3] bg-[#fffdf8]/64 p-4 dark:border-white/10 dark:bg-white/[0.03] sm:p-5 lg:border-b-0 lg:border-r">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a17135] dark:text-[#efcb83]">
                  {activeSituation.title}
                </p>
                <h3 className="mt-2 text-xl font-semibold leading-tight text-[#2f241d] dark:text-white sm:text-2xl">
                  {result.heading}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#786859] dark:text-white/66">
                  {result.subheading}
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

              {recipeCountCopy && (
                <div className="mt-4 rounded-lg border border-[#ead9c3] bg-[#fff4df] px-3 py-3 text-sm font-semibold leading-6 text-[#49362a] dark:border-white/10 dark:bg-white/[0.055] dark:text-white/76">
                  {recipeCountCopy}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {result.highlights.map((highlight) => (
                  <span
                    key={highlight}
                    className="rounded-md border border-[#ead9c3] bg-[#f4e7d3] px-3 py-2 text-xs font-semibold text-[#624b37] dark:border-white/10 dark:bg-white/8 dark:text-white/72"
                  >
                    {highlight}
                  </span>
                ))}
              </div>

              <div className="mt-5 overflow-hidden rounded-[1rem] border border-[#ead9c3] bg-[#fff4df] shadow-sm dark:border-white/10 dark:bg-white/[0.045]">
                <div className="relative h-56 sm:h-64 lg:h-72">
                  <Image
                    src={situationImage.src}
                    alt={situationImage.alt}
                    fill
                    sizes="(min-width: 1024px) 34vw, 100vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#201713]/58 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-[#201713]/78 px-3 py-1.5 text-xs font-semibold text-[#f2cf8b] backdrop-blur">
                      {situationImage.label}
                    </span>
                    <span className="hidden rounded-full bg-white/88 px-3 py-1.5 text-xs font-semibold text-[#49362a] shadow-sm sm:inline-flex">
                      {activeSituation.shortTitle}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 min-w-0 bg-[linear-gradient(145deg,#fff9ef,#fffdf8)] p-4 dark:bg-[linear-gradient(145deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] sm:p-5 lg:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a17135] dark:text-[#efcb83]">
                    Recipe picks
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#33271f] dark:text-white">
                    {recipeCountCopy ?? "Open any recipe and start cooking."}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs font-semibold text-[#806c5d] dark:text-white/62">
                    {pageLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRecipePage((page) => Math.max(page - 1, 0))}
                    disabled={!canGoPrevious}
                    aria-label="Previous recipes"
                    className="inline-flex size-10 items-center justify-center rounded-full border border-[#dfc7a8] bg-white text-[#614638] transition hover:border-[#bd7e35] hover:text-primary disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/12 dark:bg-white/8 dark:text-white"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipePage((page) => page + 1)}
                    disabled={!canGoNext}
                    aria-label="Next recipes"
                    className="inline-flex size-10 items-center justify-center rounded-full border border-[#dfc7a8] bg-white text-[#614638] transition hover:border-[#bd7e35] hover:text-primary disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/12 dark:bg-white/8 dark:text-white"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>

              {isRecipeLoading ? (
                <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <RecipeResultSkeleton key={index} />
                  ))}
                </div>
              ) : recipeSuggestions.length > 0 ? (
                <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {recipeSuggestions.map((suggestion) => (
                    <RecipeResultCard
                      key={`${activeKey}-${suggestion.key}`}
                      suggestion={suggestion}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-[#ead9c3] bg-[#fffdf8] p-6 text-center dark:border-white/10 dark:bg-white/[0.055]">
                  <p className="text-sm font-semibold text-[#33271f] dark:text-white">
                    {recipeError
                      ? "Recipes could not be loaded right now."
                      : result.emptyTitle}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-[#806c5d] dark:text-white/60">
                    {recipeError ? "Please try again in a moment." : result.emptyBody}
                  </p>
                </div>
              )}

              <div className="mt-4 grid gap-3 rounded-lg border border-[#ead9c3] bg-[#f5ead8] p-3 dark:border-white/10 dark:bg-white/[0.055] sm:grid-cols-[1fr_auto_auto] sm:items-center sm:p-4">
                <p className="text-sm font-semibold leading-6 text-[#35281f] dark:text-white">
                  {result.quickTip}
                </p>
                {recipeSuggestions[0] && (
                  <Link
                    href={recipeSuggestions[0].href}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-websecondary-400"
                  >
                    Explore <ArrowRight className="size-4" />
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#d8bd9a] bg-white px-4 py-2 text-sm font-semibold text-[#594335] transition hover:border-[#bd7e35] hover:text-primary dark:border-white/12 dark:bg-white/8 dark:text-white"
                >
                  {shareStatus === "Copied" ? (
                    <Copy className="size-4" />
                  ) : (
                    <Share2 className="size-4" />
                  )}
                  {shareStatus}
                </button>
              </div>
            </div>
          </div>
          )}
        </div>
      </Container>
    </section>
  );
}
