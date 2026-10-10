"use client";

import { ArrowRight, Clock3, Salad } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

import Container from "@/components/container";
import { FoodPreferenceMarker } from "@/components/recipes/food-preference-marker";
import {
  RecipeSteam,
  shouldShowRecipeSteam,
} from "@/components/recipes/recipe-steam";
import { useHomePreference } from "@/components/sections/home-preference-context";
import { recipeCollectionHref } from "@/lib/recipe-collection-url";
import { recipeHref } from "@/lib/seo";

import type { DiscoveryRecipe } from "./home-discovery";

export type FoodPreferenceStory = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  recipes: DiscoveryRecipe[];
};

type HomeFoodPreferenceProps = {
  preferences: FoodPreferenceStory[];
};

function totalMinutes(recipe: DiscoveryRecipe) {
  if (!recipe.recipeCookingTime) return null;

  return (
    recipe.recipeCookingTime.prepTime +
    recipe.recipeCookingTime.cookTime +
    recipe.recipeCookingTime.restTime
  );
}

function categoryBadgeClass(slug: string) {
  if (slug === "non-veg") return "bg-red-500 text-white";
  if (slug === "vegan") return "bg-pink-500 text-white";
  if (slug === "eggetarian") return "bg-amber-400 text-[#332311]";
  if (slug === "pescetarian") return "bg-sky-500 text-white";
  return "bg-green-600 text-white";
}

function preferenceRingClass(slug: string) {
  if (slug === "non-veg") return "border-red-400 shadow-red-950/50";
  if (slug === "vegan") return "border-pink-400 shadow-pink-950/45";
  if (slug === "eggetarian") return "border-amber-300 shadow-amber-950/45";
  if (slug === "pescetarian") return "border-sky-400 shadow-sky-950/45";
  return "border-green-400 shadow-green-950/45";
}

function uniqueRecipes(recipes: DiscoveryRecipe[]) {
  const visibleTitles = new Set<string>();

  return recipes.filter((recipe) => {
    const title = recipe.title.trim().toLowerCase();

    if (visibleTitles.has(title)) return false;
    visibleTitles.add(title);
    return true;
  });
}

export default function HomeFoodPreference({
  preferences,
}: HomeFoodPreferenceProps) {
  const { preference, setPreference } = useHomePreference();
  const selectedPreference = useMemo(
    () =>
      preferences.find((item) => item.slug === preference) || preferences[0],
    [preference, preferences],
  );
  const selectedRecipes = useMemo(
    () => (selectedPreference ? uniqueRecipes(selectedPreference.recipes) : []),
    [selectedPreference],
  );

  if (!selectedPreference) return null;

  return (
    <section className="home-surface home-food-preference py-16 sm:py-20">
      <Container>
        <div className="home-food-preference-panel overflow-hidden rounded-[2rem] p-5 sm:p-8 lg:p-10">
          <div className="mx-auto max-w-3xl text-center">
              <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#dfeecb]">
                <Salad className="size-4" /> Your food comfort
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                What do you prefer on your plate?
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/72 sm:text-base">
                Choose once and recommendation shelves respect your choice.
                Selecting veg includes vegetarian and vegan-safe picks.
              </p>
          </div>

          <div className="home-hide-scrollbar mt-9 flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 pb-4 sm:justify-center sm:gap-7">
            {preferences.map((item) => {
              const selected = item.slug === selectedPreference.slug;

              return (
                <button
                  type="button"
                  key={item.id}
                  aria-label={`Show ${item.name} recipes`}
                  aria-pressed={selected}
                  onClick={() => setPreference(item.slug)}
                  className="group flex min-w-[112px] snap-start flex-col items-center gap-3 sm:min-w-[126px]"
                >
                  <span
                    className={`home-food-choice relative block size-[104px] overflow-hidden rounded-full border-[3px] bg-white/9 p-1.5 transition duration-300 sm:size-[116px] ${
                      selected
                        ? `${preferenceRingClass(item.slug)} shadow-lg`
                        : "border-white/28 group-hover:border-white/62"
                    }`}
                  >
                    <span className="relative block size-full overflow-hidden rounded-full">
                      <Image
                        src={item.imageUrl || "/meta-images/recipe-page.jpg"}
                        alt=""
                        fill
                        quality={58}
                        sizes="116px"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    </span>
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition sm:text-sm ${
                      selected
                        ? categoryBadgeClass(item.slug)
                        : "bg-white/8 text-white/78"
                    }`}
                  >
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-8 border-t border-white/12 pt-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#dfeecb]">
                  Showing for
                </p>
                <h3 className="mt-1 text-xl font-semibold text-white">
                  {selectedPreference.name} preference
                </h3>
              </div>
              <Link
                href={recipeCollectionHref(selectedPreference.slug)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#f5d28c] transition hover:gap-3"
              >
                Explore all <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {selectedRecipes.slice(0, 4).map((recipe) => {
                const minutes = totalMinutes(recipe);
                const nutrient = recipe.recipeNutrient[0]?.nutrient.title;

                return (
                  <Link
                    key={recipe.id}
                    href={recipeHref(recipe)}
                    className="home-food-card group overflow-hidden rounded-[1.35rem] bg-white"
                  >
                    <div className="relative aspect-[1.38] overflow-hidden">
                      <Image
                        src={recipe.imageUrl || "/meta-images/recipe-page.jpg"}
                        alt={recipe.title}
                        fill
                        quality={64}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 22vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                      {shouldShowRecipeSteam(recipe.title) && (
                        <RecipeSteam className="bottom-[14%] left-1/2" />
                      )}
                      {nutrient && (
                        <span className="absolute left-3 top-3 rounded-full bg-white/92 px-3 py-1.5 text-xs font-semibold text-[#203628] shadow-sm backdrop-blur">
                          {nutrient}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <FoodPreferenceMarker name={selectedPreference.name} />
                        {minutes !== null && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock3 className="size-3.5" /> {minutes} min
                          </span>
                        )}
                      </div>
                      <h4 className="line-clamp-2 text-sm font-semibold leading-6 text-foreground transition group-hover:text-primary">
                        {recipe.title}
                      </h4>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
