"use client";

import { LayoutGrid, List, Loader } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import {
  GetRecipeListingPage,
  type RecipeListingFilters,
} from "@/actions/get-recipe-listing";
import { GetSearchedRecipePage } from "@/actions/get-searched-recipes";
import { NoRecipesFound } from "@/components/recipes/no-recipe-found";
import RecipeCard, {
  type RecipeCardRecipe,
} from "@/components/recipes/recipe-card";
import { cn } from "@/lib/utils";

type RecipeResultsFeedProps = {
  initialRecipes: RecipeCardRecipe[];
  initialCursor: string | null;
  filters?: RecipeListingFilters;
  searchQuery?: string;
  heading: string;
  eyebrow?: string;
  emptyKey?: string;
};

export default function RecipeResultsFeed({
  initialRecipes,
  initialCursor,
  filters,
  searchQuery,
  heading,
  eyebrow = "Discover dishes",
  emptyKey,
}: RecipeResultsFeedProps) {
  const [recipes, setRecipes] = useState(initialRecipes);
  const [nextCursor, setNextCursor] = useState(initialCursor);
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setRecipes(initialRecipes);
      setNextCursor(initialCursor);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [initialCursor, initialRecipes]);

  const loadNextPage = useCallback(() => {
    if (!nextCursor || isPending) return;

    startTransition(async () => {
      const page = searchQuery
        ? await GetSearchedRecipePage({
            k: searchQuery,
            cursor: nextCursor,
          })
        : await GetRecipeListingPage({
            ...filters,
            cursor: nextCursor,
          });

      setRecipes((current) => [
        ...current,
        ...page.recipes.filter(
          (recipe) => !current.some((shownRecipe) => shownRecipe.id === recipe.id),
        ),
      ]);
      setNextCursor(page.nextCursor);
    });
  }, [filters, isPending, nextCursor, searchQuery]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !nextCursor) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadNextPage();
      },
      { rootMargin: "480px 0px" },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [loadNextPage, nextCursor]);

  return (
    <>
      <div className="mb-8 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.23em] text-[#a67636] dark:text-[#d8b068]">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[#30251d] sm:text-3xl dark:text-[#eef3ed]">
            {heading}
          </h2>
        </div>
        {recipes.length > 0 && (
          <div
            className="inline-flex shrink-0 rounded-full border border-[#e5d6c0] bg-[#fffdf8]/82 p-0.5 sm:p-1 dark:border-white/10 dark:bg-[#122921]"
            aria-label="Choose recipe view"
          >
            {[
              { id: "grid" as const, label: "Grid view", icon: LayoutGrid },
              { id: "list" as const, label: "List view", icon: List },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-label={label}
                aria-pressed={layout === id}
                onClick={() => setLayout(id)}
                className={cn(
                  "flex size-8 cursor-pointer items-center justify-center rounded-full transition sm:size-10",
                  layout === id
                    ? "bg-[#193a2f] text-white dark:bg-[#d7ae64] dark:text-[#12241d]"
                    : "text-[#766351] hover:bg-[#f3e8d8] dark:text-[#a8b7af] dark:hover:bg-white/7",
                )}
              >
                <Icon className="size-4 sm:size-[18px]" />
              </button>
            ))}
          </div>
        )}
      </div>

      {recipes.length === 0 ? (
        <NoRecipesFound keyparam={emptyKey} />
      ) : (
        <div
          className={cn(
            layout === "grid"
              ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
              : "grid gap-4 lg:grid-cols-2",
          )}
        >
          {recipes.map((recipe, index) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              layout={layout}
              imageLoad={
                index < 3
                  ? "priority"
                  : index < (layout === "grid" ? 8 : 4)
                    ? "eager"
                    : "lazy"
              }
            />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="flex min-h-24 items-center justify-center pt-8">
        {isPending && (
          <span className="inline-flex items-center gap-3 rounded-full border border-[#e7d8c2] bg-[#fffdf8]/82 px-5 py-3 text-sm font-medium text-[#685545] dark:border-white/10 dark:bg-[#132b23] dark:text-[#ccd8d1]">
            <Loader className="size-4 animate-spin text-[#b17b35]" />
            Serving more recipes
          </span>
        )}
      </div>
    </>
  );
}
