"use client";

import { ArrowRight, Clock3, Leaf, Sparkles, SunMedium } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import Container from "@/components/container";
import HomeMealPlanAction from "@/components/sections/home-meal-plan-action";
import { FoodPreferenceMarker } from "@/components/recipes/food-preference-marker";
import {
  RecipeSteam,
  shouldShowRecipeSteam,
} from "@/components/recipes/recipe-steam";
import { recipeCollectionHref } from "@/lib/recipe-collection-url";
import { recipeHref } from "@/lib/seo";

export type DiscoveryRecipe = {
  id: string;
  title: string;
  slug: string;
  metaSlug: string | null;
  imageUrl: string | null;
  views?: number;
  RecipeCategories: { name: string; slug?: string | null } | null;
  recipeCookingTime: {
    prepTime: number;
    cookTime: number;
    restTime: number;
  } | null;
  recipeNutrient: Array<{
    nutrient: { title: string };
  }>;
  recipeMealTime?: Array<{
    mealTime: { title?: string; slug: string };
  }>;
  recipeRecipeType?: Array<{
    recipeType: { title?: string; slug: string };
  }>;
};

type SeasonalSpotlightProps = {
  recipes: DiscoveryRecipe[];
  editorialImage: string;
};

type InterestSpotlightProps = {
  recipes: DiscoveryRecipe[];
  editorialImage: string;
};

export type MealPlanMoment = {
  label: string;
  recipe: DiscoveryRecipe;
};

export type MealPlanDay = {
  key: "today" | "tomorrow";
  tabLabel: string;
  dayLabel: string;
  meals: MealPlanMoment[];
};

function totalMinutes(recipe: DiscoveryRecipe) {
  if (!recipe.recipeCookingTime) return null;

  return (
    recipe.recipeCookingTime.prepTime +
    recipe.recipeCookingTime.cookTime +
    recipe.recipeCookingTime.restTime
  );
}

export function SeasonalSpotlight({
  recipes,
  editorialImage,
}: SeasonalSpotlightProps) {
  if (recipes.length === 0) return null;

  return (
    <section className="home-surface home-seasonal py-16 sm:py-20">
      <Container>
        <div className="home-seasonal-panel relative overflow-hidden rounded-[2rem] p-4 sm:p-6 lg:p-8">
          <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#d8edc4]">
                <SunMedium className="size-4" /> Summer sips
              </p>
              <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Fresh, cooling drinks for warmer days
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-white/70 sm:text-base">
                Smoothies, juices, sharbat and chilled sips selected for the
                season you are in right now.
              </p>
            </div>
            <Link
              href={recipeCollectionHref("beveragesmoothie")}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white/12 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              See cooling drinks <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.12fr_1fr]">
            <div className="group relative min-h-[370px] overflow-hidden rounded-[1.65rem] sm:min-h-[440px]">
              <Image
                src={editorialImage}
                alt="Fresh green smoothie with leafy summer ingredients"
                fill
                quality={68}
                sizes="(max-width: 1024px) 100vw, 52vw"
                className="object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#102a21]/90 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-7">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#edf7d7]/14 px-3 py-1.5 text-xs font-medium text-[#e5f3ca] backdrop-blur">
                  <Leaf className="size-3.5" /> Seasonal inspiration
                </span>
                <p className="mt-4 max-w-sm text-2xl font-semibold leading-tight">
                  Sip fresh. Stay cool. Feel refreshed.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {recipes.slice(0, 4).map((recipe) => {
                const minutes = totalMinutes(recipe);
                const nutrient = recipe.recipeNutrient[0]?.nutrient.title;

                return (
                  <Link
                    key={recipe.id}
                    href={recipeHref(recipe)}
                    className="home-seasonal-card group overflow-hidden rounded-[1.35rem] bg-white/8 p-2.5 transition hover:bg-white/14"
                  >
                    <div className="relative aspect-[1.42] overflow-hidden rounded-[1rem]">
                      <Image
                        src={recipe.imageUrl || "/meta-images/recipe-page.jpg"}
                        alt={recipe.title}
                        fill
                        quality={64}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 22vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                      {nutrient && (
                        <span className="absolute left-2.5 top-2.5 rounded-full bg-white/92 px-2.5 py-1 text-[11px] font-semibold text-[#183325]">
                          {nutrient}
                        </span>
                      )}
                    </div>
                    <div className="px-2 pb-2 pt-3 text-white">
                      <div className="mb-1 flex items-center justify-between gap-2 text-[11px] text-white/58">
                        <FoodPreferenceMarker
                          name={recipe.RecipeCategories?.name || "Veg"}
                          className="bg-white"
                        />
                        {minutes !== null && (
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="size-3" /> {minutes} min
                          </span>
                        )}
                      </div>
                      <h3 className="line-clamp-2 text-sm font-medium leading-5">
                        {recipe.title}
                      </h3>
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

export function InterestSpotlight({
  recipes,
  editorialImage,
}: InterestSpotlightProps) {
  if (recipes.length === 0) return null;

  return (
    <section className="home-surface home-interest py-16 sm:py-20">
      <Container>
        <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              <Sparkles className="size-4" /> Made for your taste
            </p>
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Liked paneer? Keep exploring.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              A preview of smarter discovery: show interest in an ingredient
              and your next plates start feeling more personal.
            </p>
          </div>
          <Link
            href={recipeCollectionHref("paneer")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:gap-3"
          >
            All paneer recipes <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.74fr_1.26fr]">
          <div className="home-interest-story relative min-h-[370px] overflow-hidden rounded-[2rem]">
            <Image
              src={editorialImage}
              alt="Paneer stuffed cheela served with fresh green chutney"
              fill
              quality={68}
              sizes="(max-width: 1024px) 100vw, 38vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#24180f]/88 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f8d18a]">
                Your ingredient trail
              </p>
              <p className="mt-3 text-2xl font-semibold">
                Paneer, in every mood
              </p>
              <p className="mt-2 text-sm leading-6 text-white/72">
                Grilled, creamy, spicy or tucked into a quick breakfast.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.slice(0, 6).map((recipe) => {
              const minutes = totalMinutes(recipe);
              const nutrient = recipe.recipeNutrient[0]?.nutrient.title;

              return (
                <Link
                  key={recipe.id}
                  href={recipeHref(recipe)}
                  className="home-interest-card group overflow-hidden rounded-[1.45rem] border border-[#ecdfd0] bg-[#fffdf8] shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative aspect-[1.4] overflow-hidden">
                    <Image
                      src={recipe.imageUrl || "/meta-images/recipe-page.jpg"}
                      alt={recipe.title}
                      fill
                      quality={64}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                    {shouldShowRecipeSteam(recipe.title) && (
                      <RecipeSteam className="bottom-[14%] left-1/2" />
                    )}
                    {nutrient && (
                      <span className="absolute left-3 top-3 rounded-full bg-white/92 px-3 py-1.5 text-xs font-semibold text-[#312015] shadow-sm">
                        {nutrient}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <FoodPreferenceMarker name={recipe.RecipeCategories?.name || "Veg"} />
                      {minutes !== null && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock3 className="size-3.5" /> {minutes} min
                        </span>
                      )}
                    </div>
                    <h3 className="line-clamp-2 text-sm font-semibold leading-6 transition group-hover:text-primary">
                      {recipe.title}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}

type MealPlanStoryProps = {
  recipes: DiscoveryRecipe[];
  plannedDays?: MealPlanDay[];
  fallbackDayLabel: string;
  fallbackTomorrowLabel: string;
};

export function MealPlanStory({
  recipes,
  plannedDays = [],
  fallbackDayLabel,
  fallbackTomorrowLabel,
}: MealPlanStoryProps) {
  const availableDays = plannedDays.filter((day) => day.meals.length > 0);
  const fallbackMoments = ["Breakfast", "Lunch", "Dinner"];
  const buildPreviewMeals = (offset: number) =>
    fallbackMoments.map((label, index) => ({
      recipe: recipes[(offset + index) % recipes.length],
      label,
    })).filter((meal) => Boolean(meal.recipe));
  const guestPreviewDays: MealPlanDay[] = [
    {
      key: "today",
      tabLabel: "Today",
      dayLabel: fallbackDayLabel,
      meals: buildPreviewMeals(0),
    },
    {
      key: "tomorrow",
      tabLabel: "Tomorrow",
      dayLabel: fallbackTomorrowLabel,
      meals: buildPreviewMeals(3),
    },
  ];
  const displayDays = availableDays.length > 0 ? availableDays : guestPreviewDays;
  const preferredDay =
    displayDays.find((day) => day.key === "today") ?? displayDays[0];
  const [selectedDayKey, setSelectedDayKey] = useState(
    preferredDay?.key ?? "today",
  );
  const selectedDay =
    displayDays.find((day) => day.key === selectedDayKey) ?? preferredDay;
  const hasPersonalizedDay = availableDays.length > 0;
  const plannedMeals = selectedDay?.meals.slice(0, 3) ?? [];
  const signals = hasPersonalizedDay
    ? ["Your saved plan", `${selectedDay.dayLabel}'s meals`, "Personalized"]
    : ["Vegetarian", "Quick dinner", "Under 30 min"];

  return (
    <section className="home-surface home-meal-story py-16 sm:py-24">
      <Container>
        <div className="home-meal-plan-panel relative overflow-hidden rounded-[2rem] px-6 py-10 text-white sm:px-10 sm:py-12 lg:px-14">
          <div className="absolute -right-28 -top-32 size-96 rounded-full bg-[#deb358]/18 blur-3xl" />
          <div className="absolute -bottom-40 left-1/4 size-96 rounded-full bg-[#b83324]/20 blur-3xl" />
          <div className="relative grid items-center gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:gap-14">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#f8d18a]">
                <Sparkles className="size-4" /> Your table, in rhythm
              </p>
              <h2 className="max-w-xl text-3xl font-semibold leading-tight sm:text-5xl">
                {hasPersonalizedDay
                  ? "Your table is ready whenever you are."
                  : "A menu that learns your mood."}
              </h2>
              <p className="mt-5 max-w-lg text-sm leading-7 text-white/72 sm:text-base">
                {hasPersonalizedDay
                  ? "See today's meals at a glance, then switch to tomorrow whenever you want to plan ahead."
                  : "Explore today's ideas now, or switch to tomorrow for a preview of how meal planning can feel."}
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                {signals.map((filter) => (
                  <span
                    key={filter}
                    className="rounded-full border border-white/13 bg-white/[0.07] px-3.5 py-2 text-xs text-white/74"
                  >
                    {filter}
                  </span>
                ))}
              </div>
              <div className="mt-9 flex flex-wrap gap-3">
                <HomeMealPlanAction variant="story" />
                <Link
                  href="/recipes"
                  className="rounded-full border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition hover:border-white/55"
                >
                  Explore dishes
                </Link>
              </div>
            </div>

            <div className="home-personal-board rounded-[1.7rem] border border-white/10 bg-white/[0.065] p-4 backdrop-blur-sm sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#f4cb83]">
                    {selectedDay ? `${selectedDay.tabLabel} for you` : "Today for you"}
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    {selectedDay?.dayLabel ?? fallbackDayLabel} table
                  </p>
                </div>
                {displayDays.length > 0 ? (
                  <div className="flex rounded-full border border-white/10 bg-black/10 p-1">
                    {displayDays.map((day) => (
                        <button
                          key={day.key}
                          type="button"
                          onClick={() => setSelectedDayKey(day.key)}
                          aria-pressed={day.key === selectedDay?.key}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                            day.key === selectedDay?.key
                              ? "bg-[#ecd198] text-[#2d231a]"
                              : "text-white/68 hover:text-white"
                          }`}
                        >
                          {day.tabLabel}
                        </button>
                      ))}
                  </div>
                ) : (
                  <span className="rounded-full bg-[#ddeebd]/15 px-3 py-2 text-xs font-medium text-[#dceec2]">
                    Fresh ideas
                  </span>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {plannedMeals.map(({ recipe, label }) => (
                  <Link
                    href={recipeHref(recipe)}
                    key={`${label}-${recipe.id}`}
                    className="group overflow-hidden rounded-[1.15rem] bg-white/[0.075] p-2 transition hover:bg-white/[0.13]"
                  >
                    <div className="relative aspect-[1.08] overflow-hidden rounded-[0.9rem]">
                      <Image
                        src={recipe.imageUrl || "/meta-images/recipe-page.jpg"}
                        alt={recipe.title}
                        fill
                        quality={60}
                        sizes="(max-width: 640px) 33vw, 180px"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                      {shouldShowRecipeSteam(recipe.title) && (
                        <RecipeSteam className="bottom-[14%] left-1/2" />
                      )}
                    </div>
                    <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#efcb83]">
                      {label}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-white/92">
                      {recipe.title}
                    </p>
                  </Link>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#ebcc83]/10 px-4 py-3 text-xs text-white/70">
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e9bf68]/16 text-[#f4d08a]">
                  <Sparkles className="size-4" />
                </span>
                {hasPersonalizedDay
                  ? `Showing Breakfast, Lunch and Dinner saved in your ${selectedDay.dayLabel} plan.`
                  : `${selectedDay?.tabLabel ?? "Today"} preview: build your plan to turn these ideas into your own table.`}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
