"use client";

import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Refrigerator,
  Share2,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { emptyPagination, recipePageSize } from "@/components/sections/situation-tools/constants";
import { IngredientPicker } from "@/components/sections/situation-tools/controls";
import {
  formatLabel,
  listLabels,
  readableList,
  recipeToSuggestion,
} from "@/components/sections/situation-tools/recipe-formatters";
import {
  RecipeResultCard,
  RecipeResultSkeleton,
} from "@/components/sections/situation-tools/recipe-result-card";
import type {
  IngredientSuggestion,
  InitialRecipePage,
  RecipePagination,
  RecipeSuggestion,
  SituationRecipe,
} from "@/components/sections/situation-tools/types";
import { shouldServeDirectMediaImage } from "@/lib/direct-media-image";
import {
  canonicalPrimaryIngredientValue,
  filterPrimaryIngredientValues,
  isPrimaryIngredientValue,
  PRIMARY_INGREDIENT_HELP,
} from "@/lib/primary-ingredients";
import { cn } from "@/lib/utils";

type FridgeToolExperienceProps = {
  initialIngredients: string[];
  initialIngredientLabels: Record<string, string>;
  initialRecipePage?: InitialRecipePage;
  initialMealFocus?: string;
  syncUrl?: boolean;
  leftPanelVisual?: {
    src: string;
    alt: string;
    label: string;
  };
};

const foodTypes = [
  { id: "veg", label: "Veg" },
  { id: "non-veg", label: "Non veg" },
  { id: "any", label: "Any" },
];

const mealFocusOptions = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "full-day", label: "Any" },
];

const quickAdditions = [
  { value: "potato", label: "Potato" },
  { value: "bottle gourd", label: "Bottle gourd" },
  { value: "ridge gourd", label: "Ridge gourd" },
  { value: "colocasia", label: "Arbi" },
  { value: "brinjal", label: "Brinjal" },
  { value: "cauliflower", label: "Cauliflower" },
];

const ingredientToolPath = "/tools/smart-recipe-finder";
const fridgeRecipeFetchSize = recipePageSize + 1;

function defaultMealFocus() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 16) return "lunch";
  if (hour >= 16 && hour < 23) return "dinner";

  return "dinner";
}

function buildToolUrl(ingredients: string[], mealFocus?: string) {
  const params = new URLSearchParams();

  if (ingredients.length > 0) params.set("ingredients", ingredients.join(","));
  if (mealFocus) params.set("mealFocus", mealFocus);

  return `${ingredientToolPath}${params.size ? `?${params}` : ""}`;
}

function areSameIngredients(left: string[], right: string[]) {
  if (left.length !== right.length) return false;

  return left.every((item, index) => item === right[index]);
}

function currentUrlIngredients() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("ingredients") ?? "";

  return filterPrimaryIngredientValues(raw.split(","), 10);
}

function currentUrlMealFocus() {
  const params = new URLSearchParams(window.location.search);
  const focus = params.get("mealFocus") ?? "";

  return mealFocusOptions.some((item) => item.id === focus) ? focus : "";
}

function mapInitialRecipes(
  initialRecipePage: InitialRecipePage | undefined,
  selectedIngredients: string[],
  ingredientLabels: Record<string, string>,
  mealFocus: string,
) {
  return (
    initialRecipePage?.recipes
      .map((recipe) =>
        recipeToSuggestion(recipe, {
          activeKey: "ingredients",
          selectedIngredients,
          ingredientLabels,
          mealFocus,
          guestCount: 5,
          guestPlan: "full-meal",
          budget: 150,
        }),
      )
      .filter((recipe): recipe is RecipeSuggestion => Boolean(recipe)) ?? []
  );
}

export default function FridgeToolExperience({
  initialIngredients,
  initialIngredientLabels,
  initialRecipePage,
  initialMealFocus,
  syncUrl = true,
  leftPanelVisual,
}: FridgeToolExperienceProps) {
  const router = useRouter();
  const [initialResolvedMealFocus] = useState(
    () => initialMealFocus || defaultMealFocus(),
  );
  const skippedInitialRecipeFetchRef = useRef(false);
  const [selectedIngredients, setSelectedIngredients] = useState(initialIngredients);
  const [ingredientLabels, setIngredientLabels] = useState(initialIngredientLabels);
  const [ingredientInput, setIngredientInput] = useState("");
  const [ingredientSuggestions, setIngredientSuggestions] = useState<
    IngredientSuggestion[]
  >([]);
  const [isIngredientSuggestionLoading, setIsIngredientSuggestionLoading] =
    useState(false);
  const [isIngredientPickerOpen, setIsIngredientPickerOpen] = useState(false);
  const [foodType, setFoodType] = useState("veg");
  const [mealFocus, setMealFocus] = useState(initialResolvedMealFocus);
  const [recipePage, setRecipePage] = useState(0);
  const [recipeSuggestions, setRecipeSuggestions] = useState<RecipeSuggestion[]>(
    () =>
      mapInitialRecipes(
        initialRecipePage,
        initialIngredients,
        initialIngredientLabels,
        initialResolvedMealFocus,
      ),
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
  const [ingredientNotice, setIngredientNotice] = useState<string | null>(null);

  const selectedIngredientText = readableList(
    listLabels(selectedIngredients, ingredientLabels),
    "your ingredients",
  );
  const recipeWord = recipePagination.total === 1 ? "recipe" : "recipes";
  const bestSuggestion = recipeSuggestions[0] ?? null;
  const supportingSuggestions = recipeSuggestions.slice(1, 4);
  const listedSuggestions =
    bestSuggestion && !isRecipeLoading ? recipeSuggestions.slice(1) : recipeSuggestions;
  const foodTypeLabel = foodTypes.find((item) => item.id === foodType)?.label ?? "Veg";
  const mealFocusLabel =
    mealFocusOptions.find((item) => item.id === mealFocus)?.label ?? "Dinner";
  const hasSelectedIngredients = selectedIngredients.length > 0;
  const hasNoExactMatches =
    hasSelectedIngredients && !recipeError && recipePagination.total === 0;
  const resultQuestion =
    hasSelectedIngredients
      ? `What can you cook with ${selectedIngredientText}?`
      : "What can you cook with what is at home?";
  const resultHeading =
    hasNoExactMatches
      ? `No exact recipes found with only ${selectedIngredientText}.`
      : hasSelectedIngredients
      ? `You can cook ${recipePagination.total} ${recipeWord} with ${selectedIngredientText}.`
      : "Add ingredients from your kitchen.";
  const totalRecipePages = Math.max(
    Math.ceil(recipePagination.total / recipePagination.pageSize),
    1,
  );
  const pageLabel =
    recipePagination.total > 0
      ? `Page ${recipePagination.page + 1} of ${totalRecipePages}`
      : hasSelectedIngredients
        ? "No exact matches"
        : "Start searching";
  const canGoPrevious = recipePagination.hasPrevious && !isRecipeLoading;
  const canGoNext = recipePagination.hasNext && !isRecipeLoading;

  const shareText = useMemo(
    () => {
      const bestPick = bestSuggestion
        ? `Best pick: ${bestSuggestion.title}\n${bestSuggestion.tag} | ${bestSuggestion.context}\n${bestSuggestion.meta}`
        : "Add ingredients to get a best pick.";
      const moreIdeas = supportingSuggestions
        .map((item, index) => `${index + 1}. ${item.title}`)
        .join("\n");

      return `${resultQuestion}\n${resultHeading}\n\n${bestPick}${
        moreIdeas ? `\n\nMore ideas:\n${moreIdeas}` : ""
      }\n\nFind recipes with ingredients at home on Kya Khayen.`;
    },
    [bestSuggestion, resultHeading, resultQuestion, supportingSuggestions],
  );

  const resetRecipePage = () => setRecipePage(0);

  const addIngredientValue = (value: string, label?: string) => {
    const normalized = canonicalPrimaryIngredientValue(value);

    if (!normalized) return;
    if (!isPrimaryIngredientValue(normalized)) {
      setIngredientNotice(PRIMARY_INGREDIENT_HELP);
      setIngredientInput("");
      return;
    }

    setSelectedIngredients((current) =>
      current.includes(normalized) ? current : [...current, normalized],
    );
    setIngredientLabels((current) => ({
      ...current,
      [normalized]: label || formatLabel(normalized, current),
    }));
    setIngredientInput("");
    setIngredientNotice(null);
    resetRecipePage();
  };

  const removeIngredient = (value: string) => {
    setSelectedIngredients((current) => current.filter((item) => item !== value));
    setIngredientNotice(null);
    resetRecipePage();
  };

  useEffect(() => {
    if (!syncUrl) return;

    const currentIngredients = currentUrlIngredients();
    const currentMealFocus = currentUrlMealFocus();

    if (
      areSameIngredients(currentIngredients, selectedIngredients) &&
      currentMealFocus === mealFocus
    ) {
      return;
    }

    router.replace(buildToolUrl(selectedIngredients, mealFocus), { scroll: false });
  }, [mealFocus, router, selectedIngredients, syncUrl]);

  useEffect(() => {
    const query = ingredientInput.trim();

    if (!query && !isIngredientPickerOpen) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsIngredientSuggestionLoading(true);

      try {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        params.set("limit", "28");

        const response = await fetch(`/api/ingredients/suggestions?${params}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
          signal: controller.signal,
        });

        if (!response.ok) throw new Error("Failed to load ingredients");

        const payload = (await response.json()) as {
          suggestions?: IngredientSuggestion[];
        };

        setIngredientSuggestions(payload.suggestions ?? []);
      } catch {
        if (!controller.signal.aborted) setIngredientSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setIsIngredientSuggestionLoading(false);
      }
    }, query ? 160 : 0);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [ingredientInput, isIngredientPickerOpen]);

  useEffect(() => {
    const controller = new AbortController();

    const primarySelectedIngredients = filterPrimaryIngredientValues(
      selectedIngredients,
      10,
    );

    if (primarySelectedIngredients.length === 0) {
      const timeoutId = window.setTimeout(() => {
        setRecipeSuggestions([]);
        setRecipePagination(emptyPagination);
        setRecipeError(false);
        setIsRecipeLoading(false);
      }, 0);

      return () => {
        controller.abort();
        window.clearTimeout(timeoutId);
      };
    }

    const params = new URLSearchParams();
    params.set("mode", "ingredients");
    params.set("pageSize", String(fridgeRecipeFetchSize));
    params.set("page", String(recipePage));
    params.set("foodType", foodType);
    params.set("mealFocus", mealFocus);
    primarySelectedIngredients.forEach((ingredient) => {
      params.append("ingredient", ingredient);
    });

    const initialPrimaryIngredients = filterPrimaryIngredientValues(
      initialIngredients,
      10,
    );
    const canUseInitialRecipePage =
      initialRecipePage &&
      !skippedInitialRecipeFetchRef.current &&
      recipePage === initialRecipePage.page &&
      foodType === "veg" &&
      mealFocus === initialResolvedMealFocus &&
      areSameIngredients(primarySelectedIngredients, initialPrimaryIngredients);

    if (canUseInitialRecipePage) {
      skippedInitialRecipeFetchRef.current = true;
      setRecipeError(false);
      setIsRecipeLoading(false);
      return;
    }

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
              activeKey: "ingredients",
              selectedIngredients,
              ingredientLabels,
              mealFocus,
              guestCount: 5,
              guestPlan: "full-meal",
              budget: 150,
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
    foodType,
    ingredientLabels,
    initialIngredients,
    initialRecipePage,
    initialResolvedMealFocus,
    mealFocus,
    recipePage,
    selectedIngredients,
  ]);

  const handleShare = async () => {
    setShareStatus("Sharing");

    try {
      const url = `${window.location.origin}${buildToolUrl(
        selectedIngredients,
        mealFocus,
      )}`;

      if (navigator.share) {
        await navigator.share({
          title: "Smart Recipe Finder",
          text: shareText,
          url,
        });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${url}`);
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
            <Refrigerator className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a17135] dark:text-[#efcb83]">
              Fridge finder
            </p>
            <p className="mt-1 truncate text-lg font-semibold text-[#2f241d] dark:text-white">
              {selectedIngredientText}
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
              Food type
            </p>
            <p className="text-xl font-semibold text-[#2f241d] dark:text-white">
              {foodTypes.find((item) => item.id === foodType)?.label ?? "Veg"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-0 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="relative z-30 min-w-0 border-b border-[#ead9c3] bg-[#fffdf8]/74 p-4 dark:border-white/10 dark:bg-white/[0.03] sm:p-5 lg:border-b-0 lg:border-r">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a17135] dark:text-[#efcb83]">
              Ingredient finder
            </p>
            <h2 className="mt-2 text-xl font-semibold leading-tight text-[#2f241d] dark:text-white sm:text-2xl">
              {resultHeading}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#786859] dark:text-white/66">
              Search the real fridge item first: lauki, turai, aloo, arbi,
              paneer, dal, rice, curd, or a fresh vegetable.
            </p>
          </div>

          <div className="space-y-4 rounded-lg border border-[#ead9c3] bg-white p-3 dark:border-white/10 dark:bg-white/[0.045] sm:p-4">
            <IngredientPicker
              title="Ingredients at home"
              input={ingredientInput}
              setInput={setIngredientInput}
              selected={selectedIngredients}
              labels={ingredientLabels}
              suggestions={ingredientSuggestions}
              isLoading={isIngredientSuggestionLoading}
              isOpen={isIngredientPickerOpen}
              setOpen={setIsIngredientPickerOpen}
              addValue={addIngredientValue}
              removeValue={removeIngredient}
              placeholder="Search lauki, turai, aloo, arbi..."
            />
            {ingredientNotice && (
              <p className="rounded-lg border border-[#f0c8a4] bg-[#fff5e6] px-3 py-2 text-xs font-semibold leading-5 text-[#8a4a20] dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">
                {ingredientNotice}
              </p>
            )}

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#9b6e37] dark:text-[#efcb83]">
                Food type
              </p>
              <div className="grid grid-cols-3 gap-2">
                {foodTypes.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setFoodType(item.id);
                      resetRecipePage();
                    }}
                    className={cn(
                      "rounded-lg border px-3 py-3 text-sm font-semibold transition",
                      foodType === item.id
                        ? "border-[#b63a29] bg-[#b63a29] text-white shadow-sm"
                        : "border-[#ead9c3] bg-white text-[#5b493d] hover:border-[#cc9448] hover:bg-[#fff7e9] dark:border-white/10 dark:bg-white/[0.04] dark:text-white",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#9b6e37] dark:text-[#efcb83]">
                Meal time
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {mealFocusOptions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setMealFocus(item.id);
                      resetRecipePage();
                    }}
                    className={cn(
                      "min-h-10 rounded-lg border px-2 text-xs font-semibold transition sm:text-sm",
                      mealFocus === item.id
                        ? "border-[#2f7d4f] bg-[#2f7d4f] text-white shadow-sm"
                        : "border-[#ead9c3] bg-white text-[#5b493d] hover:border-[#2f7d4f] hover:bg-[#f3f8ea] dark:border-white/10 dark:bg-white/[0.04] dark:text-white",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-[#ead9c3] bg-[#fffaf1] p-3 dark:border-white/10 dark:bg-white/[0.04]">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#9a6730] dark:text-[#efcb83]">
              <Sparkles className="size-3.5" />
              Popular additions
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {quickAdditions.map((item) => {
                const active = selectedIngredients.includes(item.value);

                return (
                  <button
                    key={item.value}
                    type="button"
                    disabled={active}
                    onClick={() => addIngredientValue(item.value, item.label)}
                    className={cn(
                      "min-h-10 rounded-lg border px-3 text-sm font-semibold transition",
                      active
                        ? "cursor-not-allowed border-[#d8bd9a] bg-[#f3e6d2] text-[#8a735f]"
                        : "border-[#ead9c3] bg-white text-[#5b493d] hover:border-[#cc9448] hover:bg-[#fff7e9] hover:text-primary dark:border-white/10 dark:bg-white/[0.04] dark:text-white",
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {leftPanelVisual && (
            <div className="mt-4 overflow-hidden rounded-[1rem] border border-[#ead9c3] bg-[#fff4df] shadow-sm dark:border-white/10 dark:bg-white/[0.045]">
              <div className="relative h-52 sm:h-60 lg:h-64">
                <Image
                  src={leftPanelVisual.src}
                  alt={leftPanelVisual.alt}
                  fill
                  sizes="(min-width: 1024px) 34vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#201713]/62 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-[#201713]/78 px-3 py-1.5 text-xs font-semibold text-[#f2cf8b] backdrop-blur">
                    {leftPanelVisual.label}
                  </span>
                  <span className="hidden rounded-full bg-white/88 px-3 py-1.5 text-xs font-semibold text-[#49362a] shadow-sm sm:inline-flex">
                    Ingredient finder
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-md bg-[#f1e4cf] px-3 py-2 text-xs font-semibold text-[#6c513d] dark:bg-white/10 dark:text-white/72">
              {selectedIngredients.length} selected
            </span>
            <span className="rounded-md bg-[#f1e4cf] px-3 py-2 text-xs font-semibold text-[#6c513d] dark:bg-white/10 dark:text-white/72">
              Primary items only
            </span>
            <span className="rounded-md bg-[#f1e4cf] px-3 py-2 text-xs font-semibold text-[#6c513d] dark:bg-white/10 dark:text-white/72">
              Spices skipped
            </span>
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
                className="flex size-10 items-center justify-center rounded-full border border-[#ead9c3] bg-white text-[#8a6d53] transition enabled:hover:border-[#2f7d4f] enabled:hover:text-[#2f7d4f] disabled:cursor-not-allowed disabled:opacity-42 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70"
                aria-label="Previous recipes"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                disabled={!canGoNext}
                onClick={() => setRecipePage((current) => current + 1)}
                className="flex size-10 items-center justify-center rounded-full border border-[#ead9c3] bg-white text-[#8a6d53] transition enabled:hover:border-[#2f7d4f] enabled:hover:text-[#2f7d4f] disabled:cursor-not-allowed disabled:opacity-42 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70"
                aria-label="Next recipes"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          {!recipeError && bestSuggestion && !isRecipeLoading && (
            <section className="mb-4 overflow-hidden rounded-[1.15rem] border border-[#e5d4ba] bg-[#fffdf7] shadow-[0_24px_70px_-46px_rgba(72,52,30,0.62)] dark:border-white/10 dark:bg-white/[0.05]">
              <div className="grid gap-0 md:grid-cols-[0.94fr_1.06fr]">
                <div className="relative min-h-[232px] overflow-hidden bg-[#e8f1df]">
                  <Image
                    src={bestSuggestion.imageUrl}
                    alt={bestSuggestion.title}
                    fill
                    quality={75}
                    unoptimized={shouldServeDirectMediaImage(
                      bestSuggestion.imageUrl,
                    )}
                    sizes="(max-width: 768px) 100vw, 36vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#102216]/82 via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <span className="inline-flex rounded-full bg-[#f7cf72] px-3 py-1.5 text-xs font-semibold text-[#2b2419] shadow-sm">
                      Best fridge match
                    </span>
                    <Link
                      href={bestSuggestion.href}
                      className="mt-2 block line-clamp-2 text-sm font-semibold leading-5 text-white transition hover:text-[#f7cf72]"
                    >
                      {bestSuggestion.title}
                    </Link>
                  </div>
                </div>

                <div className="relative flex min-w-0 flex-col justify-between bg-[#fff7e4] p-4 text-[#263326] dark:bg-[#17231b] dark:text-white sm:p-5">
                  <div className="absolute inset-y-0 right-0 w-1.5 bg-[#2f7d4f]" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2f7d4f] dark:text-emerald-200">
                      What can you cook?
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold leading-tight text-[#1f2e22] dark:text-white sm:text-3xl">
                      {resultQuestion}
                    </h2>
                    <div className="mt-4 border-l-4 border-[#2f7d4f] bg-white/72 px-3 py-3 dark:bg-white/8">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9b4c32] dark:text-[#f4c483]">
                        Best pick
                      </p>
                      <Link
                        href={bestSuggestion.href}
                        className="mt-1 block text-lg font-semibold leading-6 text-[#1f2e22] transition hover:text-[#2f7d4f] dark:text-white dark:hover:text-emerald-200"
                      >
                        {bestSuggestion.title}
                      </Link>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#263326] px-3 py-1.5 text-xs font-semibold text-white dark:bg-white/12">
                        <Clock3 className="size-3.5" />
                        {bestSuggestion.tag}
                      </span>
                      <span className="rounded-full bg-[#f7cf72] px-3 py-1.5 text-xs font-semibold text-[#2b2419]">
                        {bestSuggestion.context}
                      </span>
                      <span className="rounded-full border border-[#bdd7ad] bg-[#edf7e8] px-3 py-1.5 text-xs font-semibold text-[#446b34] dark:border-emerald-300/18 dark:bg-emerald-300/10 dark:text-emerald-100">
                        {foodTypeLabel}
                      </span>
                      <span className="rounded-full border border-[#d7c7a7] bg-white/74 px-3 py-1.5 text-xs font-semibold text-[#715536] dark:border-white/12 dark:bg-white/8 dark:text-white/78">
                        {mealFocusLabel}
                      </span>
                    </div>

                    <p className="mt-4 rounded-lg border border-[#dfe8c9] bg-[#f4f9ec] px-3 py-3 text-sm font-semibold leading-6 text-[#456038] dark:border-emerald-300/14 dark:bg-emerald-300/10 dark:text-emerald-100">
                      {bestSuggestion.meta}
                    </p>

                    {supportingSuggestions.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#8e6a3a] dark:text-white/56">
                          More quick ideas
                        </p>
                        <div className="grid gap-2 sm:grid-cols-3">
                          {supportingSuggestions.map((suggestion) => (
                            <Link
                              key={suggestion.key}
                              href={suggestion.href}
                              className="min-w-0 rounded-lg border border-[#ead7b8] bg-white/70 px-3 py-2 text-xs font-semibold leading-5 text-[#584636] transition hover:border-[#2f7d4f] hover:text-[#2f7d4f] dark:border-white/10 dark:bg-white/8 dark:text-white/78 dark:hover:border-emerald-200 dark:hover:text-emerald-100"
                            >
                              <span className="line-clamp-2">
                                {suggestion.title}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={handleShare}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#f2b84b] px-4 py-2 text-sm font-semibold text-[#231c12] transition hover:bg-[#ffd36f]"
                    >
                      <Share2 className="size-4" />
                      {shareStatus}
                    </button>
                    <Link
                      href={bestSuggestion.href}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#2f7d4f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#25683f]"
                    >
                      Open best recipe
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          )}

          {recipeError ? (
            <div className="rounded-lg border border-[#ead9c3] bg-white px-4 py-8 text-center dark:border-white/10 dark:bg-white/[0.04]">
              <p className="font-semibold text-[#2f241d] dark:text-white">
                Recipes could not load right now.
              </p>
              <p className="mt-2 text-sm text-[#806c5d] dark:text-white/64">
                Try again in a moment or search one ingredient at a time.
              </p>
            </div>
          ) : isRecipeLoading || listedSuggestions.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {isRecipeLoading
                ? Array.from({ length: recipePageSize }).map((_, index) => (
                    <RecipeResultSkeleton key={index} />
                  ))
                : listedSuggestions.map((suggestion) => (
                    <RecipeResultCard key={suggestion.key} suggestion={suggestion} />
                  ))}
            </div>
          ) : bestSuggestion ? null : (
            <div className="rounded-lg border border-[#ead9c3] bg-white px-4 py-10 text-center dark:border-white/10 dark:bg-white/[0.04]">
              <p className="font-semibold text-[#2f241d] dark:text-white">
                {hasSelectedIngredients
                  ? `No exact recipes found with only ${selectedIngredientText}.`
                  : "Add a main ingredient to see recipe ideas."}
              </p>
              <p className="mt-2 text-sm text-[#806c5d] dark:text-white/64">
                {hasSelectedIngredients
                  ? "Add one more fridge ingredient you actually have, then search again. Capsicum, cabbage, cauliflower, curd, rice, or dal can help only when they are really available."
                  : "Try lauki, turai, aloo, arbi, paneer, rice, dal, curd, spinach, or cauliflower."}
              </p>
            </div>
          )}

          <div className="mt-4 grid gap-3 rounded-lg border border-[#ead9c3] bg-[#f5ead8] p-3 dark:border-white/10 dark:bg-white/[0.06] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <p className="min-w-0 text-sm font-semibold leading-6 text-[#4b3a2e] dark:text-white/78">
              Add another ingredient only when it is really available at home.
              Recipes that need extra main vegetables stay hidden until you
              select them.
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
