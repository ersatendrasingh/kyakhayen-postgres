"use client";

import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock3,
  UtensilsCrossed,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

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

export type CuisineStory = {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  recipes: DiscoveryRecipe[];
};

type HomeCuisineExplorerProps = {
  cuisines: CuisineStory[];
};

function totalMinutes(recipe: DiscoveryRecipe) {
  if (!recipe.recipeCookingTime) return null;

  return (
    recipe.recipeCookingTime.prepTime +
    recipe.recipeCookingTime.cookTime +
    recipe.recipeCookingTime.restTime
  );
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

const famousRecipeKeywordsByCuisine: Record<string, string[]> = {
  "north-indian": [
    "rajma chawal",
    "chole bhature",
    "punjabi chole",
    "dal makhani",
    "paneer butter masala",
    "kadhi chawal",
    "chana masala",
    "palak paneer",
    "shahi paneer",
    "kadhai paneer",
    "paneer lababdar",
    "paneer do pyaza",
    "paneer angara",
    "matar paneer",
    "malai kofta",
    "dum aloo",
    "aloo gobi",
    "bhindi masala",
    "baingan bharta",
    "dal tadka",
    "dal fry",
    "lauki chana dal",
    "butter chicken",
    "chole kulche",
  ],
  punjabi: [
    "sarson da saag",
    "sarso saag",
    "chole bhature",
    "rajma chawal",
    "dal makhani",
    "paneer butter masala",
    "paneer lababdar",
    "paneer do pyaza",
    "matar paneer",
    "punjabi chole",
    "chole kulche",
    "amritsari chole",
    "kadhi pakora",
    "palak paneer",
    "aloo gobi",
  ],
  "south-indian": [
    "masala dosa",
    "plain dosa",
    "rava dosa",
    "idli sambar",
    "medu vada",
    "sambar rice",
    "lemon rice",
    "curd rice",
    "bisi bele bath",
    "pongal",
    "uttapam",
    "avial",
    "hyderabadi biryani",
    "kerala stew",
    "rasam rice",
  ],
  "east-indian": [
    "macher jhol",
    "shorshe ilish",
    "kosha mangsho",
    "dalma",
    "luchi alur dom",
    "cholar dal",
    "ghugni",
    "momo",
    "doi maach",
    "aloo posto",
  ],
  bengali: [
    "macher jhol",
    "shorshe ilish",
    "kosha mangsho",
    "cholar dal",
    "luchi alur dom",
    "doi maach",
    "aloo posto",
    "jhal muri",
  ],
  gujarati: [
    "undhiyu",
    "dal dhokli",
    "gujarati kadhi",
    "khichdi kadhi",
    "sev tameta",
    "ringan batata",
    "batata nu shaak",
    "handvo",
    "khandvi",
    "dhokla",
    "fafda jalebi",
    "patra",
  ],
  "west-indian": [
    "pav bhaji",
    "misal pav",
    "goan fish curry",
    "bharli vangi",
    "varan bhaat",
    "usal",
    "kolhapuri",
    "xacuti",
  ],
  maharashtrian: [
    "vada pav",
    "pav bhaji",
    "misal pav",
    "kanda poha",
    "sabudana khichdi",
    "thalipeeth",
    "pithla bhakri",
    "zunka bhakri",
    "varan bhaat",
    "bharli vangi",
    "sol kadhi",
    "modak",
  ],
  "international-mediterranean": [
    "shakshuka",
    "moussaka",
    "falafel bowl",
    "ratatouille",
    "paella",
    "risotto",
    "pasta",
    "lasagna",
  ],
  italian: [
    "pasta",
    "lasagna",
    "risotto",
    "pizza",
    "bruschetta",
    "ravioli",
    "gnocchi",
  ],
  american: [
    "mac and cheese",
    "burger",
    "chili",
    "bbq chicken",
    "fried chicken",
    "meatloaf",
    "jambalaya",
    "taco bowl",
  ],
  rajasthani: [
    "dal baati churma",
    "gatte ki sabzi",
    "gatta curry",
    "ker sangri",
    "laal maas",
    "safed maas",
    "papad ki sabzi",
    "mangodi ki sabzi",
    "sev tamatar",
    "rajasthani kadhi",
  ],
  bihari: [
    "litti chokha",
    "litti chokha thali",
    "bihari kadhi badi",
    "lauki chana dal",
    "parwal aloo sabzi",
    "sattu paratha",
    "bihari khichdi",
    "makhana curry",
  ],
  mughlai: [
    "biryani",
    "nihari",
    "korma",
    "kofta",
    "mughlai chicken",
    "mutton curry",
    "paneer pasanda",
  ],
  chinese: [
    "veg hakka noodles",
    "chilli paneer",
    "veg manchurian",
    "veg fried rice",
    "schezwan noodles",
    "schezwan fried rice",
    "veg momos",
    "paneer momos",
    "spring rolls",
    "chilli potato",
    "honey chilli potato",
    "manchow soup",
    "hot and sour soup",
    "sweet corn soup",
    "chilli chicken",
    "chicken manchurian",
    "chicken hakka noodles",
    "chicken fried rice",
    "chicken momos",
    "chicken lollipop",
  ],
};

const fallbackMainDishKeywords = [
  "thali",
  "biryani",
  "curry",
  "sabzi",
  "dal",
  "chole",
  "rajma",
  "khichdi",
  "pulao",
  "korma",
  "kofta",
  "paneer",
  "noodles",
  "fried rice",
  "manchurian",
  "momos",
  "chowmein",
  "spring roll",
  "chicken",
  "mutton",
  "fish",
];

const completePlateTitlePattern =
  /\b(chole bhature|chole kulche|rajma chawal|kadhi chawal|dal baati churma|litti chokha|bedmi poori with aloo sabzi|pav bhaji|misal pav|idli sambar|sambar rice|khichdi|biryani|thali|papad ki sabzi|hakka noodles|schezwan noodles|chowmein|fried rice|chilli paneer|manchurian|momos|spring rolls|chilli potato|honey chilli potato|chilli chicken|chicken lollipop)\b/i;
const sideOnlyTitlePattern =
  /\b(roti|chapati|phulka|naan|kulcha|paratha|bhature|poori|puri|thepla|bread)\b/i;
const nonMainTitlePattern =
  /\b(shake|smoothie|juice|lassi|sharbat|drink|salad|raita|chutney|pickle|soup|cutlet|pakora|samosa|kachori|halwa|kheer|laddu|ladoo|barfi|burfi|cake|cookie|muffin)\b/i;

const mainRecipeTypeSlugs = new Set([
  "meal",
  "protein",
  "cooked-vegetable",
  "grains",
]);

const mealTimeSlugs = new Set(["breakfast", "lunch", "dinner"]);

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replaceAll("&", "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function categorySlug(recipe: DiscoveryRecipe) {
  return normalizeText(
    recipe.RecipeCategories?.slug || recipe.RecipeCategories?.name || "",
  ).replaceAll(" ", "-");
}

function categoryMatchesPreference(recipe: DiscoveryRecipe, preference: string) {
  const slug = categorySlug(recipe);

  if (preference === "veg") return ["veg", "vegan"].includes(slug);
  if (preference === "egg" || preference === "eggetarian") {
    return ["eggetarian", "egg", "veg", "vegan"].includes(slug);
  }
  if (preference === "pescetarian") {
    return ["pescetarian", "veg", "vegan"].includes(slug);
  }
  if (preference === "non-veg" || preference === "non veg") {
    return [
      "non-veg",
      "pescetarian",
      "eggetarian",
      "egg",
      "veg",
      "vegan",
    ].includes(slug);
  }

  return slug === preference;
}

function isNonMainTypeSlug(slug: string) {
  return (
    slug.startsWith("drink-") ||
    slug.includes("smoothie") ||
    slug.includes("juice") ||
    slug.includes("shake") ||
    slug.includes("snack") ||
    slug.includes("dessert") ||
    slug.includes("raita") ||
    slug.includes("chutney") ||
    slug.includes("salad") ||
    slug.includes("soup")
  );
}

function isMainDishRecipe(recipe: DiscoveryRecipe) {
  const title = recipe.title.trim();
  const isCompletePlate = completePlateTitlePattern.test(title);

  if (!isCompletePlate && sideOnlyTitlePattern.test(title)) return false;
  if (!isCompletePlate && nonMainTitlePattern.test(title)) return false;

  const typeSlugs =
    recipe.recipeRecipeType?.map(({ recipeType }) => recipeType.slug) ?? [];
  const hasMainType = typeSlugs.some((slug) => mainRecipeTypeSlugs.has(slug));
  const hasNonMainType = typeSlugs.some(isNonMainTypeSlug);

  if (hasNonMainType && !hasMainType && !isCompletePlate) return false;
  if (hasMainType || isCompletePlate) return true;

  const visibleMealTime =
    recipe.recipeMealTime?.some(({ mealTime }) =>
      mealTimeSlugs.has(mealTime.slug),
    ) ?? false;

  return visibleMealTime || typeSlugs.length === 0;
}

function cuisineFameScore(recipe: DiscoveryRecipe, cuisineSlug: string) {
  const title = normalizeText(recipe.title);
  const famousKeywords = famousRecipeKeywordsByCuisine[cuisineSlug] ?? [];
  const famousIndex = famousKeywords.findIndex((keyword) =>
    title.includes(normalizeText(keyword)),
  );

  if (famousIndex >= 0) return 1_000 - famousIndex * 25;

  const fallbackIndex = fallbackMainDishKeywords.findIndex((keyword) =>
    title.includes(normalizeText(keyword)),
  );

  return fallbackIndex >= 0 ? 250 - fallbackIndex * 8 : 0;
}

function matchedFamousKeyword(recipe: DiscoveryRecipe, cuisineSlug: string) {
  const title = normalizeText(recipe.title);
  const famousKeywords = famousRecipeKeywordsByCuisine[cuisineSlug] ?? [];
  const matchedKeyword = famousKeywords.find((keyword) =>
    title.includes(normalizeText(keyword)),
  );

  return matchedKeyword ? normalizeText(matchedKeyword) : null;
}

function curateCuisineRecipes(
  recipes: DiscoveryRecipe[],
  cuisineSlug: string,
  preference: string,
) {
  const mainRecipes = uniqueRecipes(recipes).filter(
    (recipe) =>
      categoryMatchesPreference(recipe, preference) && isMainDishRecipe(recipe),
  );
  const picked = new Map<string, DiscoveryRecipe>();
  const rankedFamousRecipes = mainRecipes
    .map((recipe) => ({
      recipe,
      score: cuisineFameScore(recipe, cuisineSlug),
    }))
    .filter(({ score }) => score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        (right.recipe.views ?? 0) - (left.recipe.views ?? 0) ||
        left.recipe.title.localeCompare(right.recipe.title),
    );
  const deferredDuplicateFamousRecipes: DiscoveryRecipe[] = [];
  const usedFamousKeywords = new Set<string>();

  for (const { recipe } of rankedFamousRecipes) {
    const famousKeyword = matchedFamousKeyword(recipe, cuisineSlug);

    if (famousKeyword && usedFamousKeywords.has(famousKeyword)) {
      deferredDuplicateFamousRecipes.push(recipe);
      continue;
    }

    if (famousKeyword) usedFamousKeywords.add(famousKeyword);
    picked.set(recipe.id, recipe);
  }

  for (const recipe of deferredDuplicateFamousRecipes) {
    picked.set(recipe.id, recipe);
  }

  if (picked.size < 4) {
    [...mainRecipes]
      .sort(
        (left, right) =>
          (right.views ?? 0) - (left.views ?? 0) ||
          left.title.localeCompare(right.title),
      )
      .forEach((recipe) => picked.set(recipe.id, recipe));
  }

  return [...picked.values()];
}

export default function HomeCuisineExplorer({
  cuisines,
}: HomeCuisineExplorerProps) {
  const { preference } = useHomePreference();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [selectedSlug, setSelectedSlug] = useState(
    cuisines.find((cuisine) => cuisine.slug === "north-indian")?.slug ||
      cuisines[0]?.slug ||
      "",
  );
  const availableCuisines = useMemo(
    () =>
      cuisines
        .map((cuisine) => ({
          cuisine,
          recipeCount: curateCuisineRecipes(
            cuisine.recipes,
            cuisine.slug,
            preference,
          ).length,
        }))
        .filter(({ recipeCount }) => recipeCount > 0)
        .sort((left, right) => {
          if (left.cuisine.slug === "north-indian") return -1;
          if (right.cuisine.slug === "north-indian") return 1;

          return (
            right.recipeCount - left.recipeCount ||
            left.cuisine.title.localeCompare(right.cuisine.title)
          );
        })
        .map(({ cuisine }) => cuisine),
    [cuisines, preference],
  );
  const selectedCuisine = useMemo(
    () =>
      availableCuisines.find((cuisine) => cuisine.slug === selectedSlug) ||
      availableCuisines[0],
    [availableCuisines, selectedSlug],
  );
  const selectedRecipes = useMemo(
    () =>
      selectedCuisine
        ? curateCuisineRecipes(
            selectedCuisine.recipes,
            selectedCuisine.slug,
            preference,
          )
        : [],
    [preference, selectedCuisine],
  );

  function scrollCuisines(direction: "left" | "right") {
    carouselRef.current?.scrollBy({
      left: direction === "left" ? -420 : 420,
      behavior: "smooth",
    });
  }

  if (!selectedCuisine) return null;

  return (
    <section className="home-surface home-cuisine-explorer py-12 sm:py-14">
      <Container>
        <div className="home-cuisine-panel overflow-hidden rounded-[1.65rem] px-4 py-6 sm:px-7 sm:py-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              <UtensilsCrossed className="size-4" /> Make home yours
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              What is your favourite cuisine?
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Pick your taste and this shelf instantly changes with recipes
              inspired by your choice.
            </p>
          </div>

          <div className="relative mt-6">
            <button
              type="button"
              aria-label="Scroll cuisines left"
              onClick={() => scrollCuisines("left")}
              className="home-cuisine-arrow absolute -left-1 top-[32px] z-10 hidden size-10 items-center justify-center rounded-full bg-white text-foreground shadow-md transition hover:text-primary md:flex"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Scroll cuisines right"
              onClick={() => scrollCuisines("right")}
              className="home-cuisine-arrow absolute -right-1 top-[32px] z-10 hidden size-10 items-center justify-center rounded-full bg-white text-foreground shadow-md transition hover:text-primary md:flex"
            >
              <ChevronRight className="size-5" />
            </button>
            <div
              ref={carouselRef}
              className="home-cuisine-slider home-hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2 md:px-10"
            >
            {availableCuisines.map((cuisine) => {
              const isSelected = cuisine.slug === selectedCuisine.slug;

              return (
                <button
                  type="button"
                  key={cuisine.id}
                  aria-label={`Choose ${cuisine.title}`}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedSlug(cuisine.slug)}
                  className="group flex min-w-[104px] snap-start flex-col items-center gap-2 text-center sm:min-w-[112px]"
                >
                  <span
                    className={`relative block size-[94px] overflow-hidden rounded-full border-[3px] bg-white p-1.5 transition duration-300 sm:size-[104px] ${
                      isSelected
                        ? "border-primary shadow-[0_12px_28px_-12px_rgba(190,55,35,0.65)]"
                        : "border-white/90 shadow-sm group-hover:border-[#dba34f]"
                    }`}
                  >
                    <span className="relative block size-full overflow-hidden rounded-full">
                      <Image
                        src={cuisine.imageUrl || "/meta-images/recipe-page.jpg"}
                        alt=""
                        fill
                        quality={58}
                        sizes="104px"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    </span>
                  </span>
                  <span
                    className={`text-xs font-semibold transition sm:text-sm ${
                      isSelected ? "text-primary" : "text-foreground/72"
                    }`}
                  >
                    {cuisine.title}
                  </span>
                </button>
              );
            })}
            </div>
          </div>

          <div className="mt-5 border-t border-[#eddec9] pt-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-lg font-semibold sm:text-xl">
                Recipes inspired by {selectedCuisine.title}
              </h3>
              <Link
                href={`${recipeCollectionHref(selectedCuisine.slug)}?food=${preference}`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:gap-3"
              >
                Explore {selectedCuisine.title} <ArrowRight className="size-4" />
              </Link>
            </div>

            {selectedRecipes.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {selectedRecipes.slice(0, 4).map((recipe) => {
                  const minutes = totalMinutes(recipe);
                  const nutrient = recipe.recipeNutrient[0]?.nutrient.title;

                  return (
                    <Link
                      key={recipe.id}
                      href={recipeHref(recipe)}
                      className="home-cuisine-card group overflow-hidden rounded-[1.4rem] bg-white p-2.5 transition hover:-translate-y-1"
                    >
                      <div className="relative aspect-[1.32] overflow-hidden rounded-[1rem]">
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
                      <div className="px-2 pb-2 pt-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <FoodPreferenceMarker name={recipe.RecipeCategories?.name || "Veg"} />
                          {minutes !== null && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock3 className="size-3.5" /> {minutes} min
                            </span>
                          )}
                        </div>
                        <h4 className="line-clamp-2 text-sm font-semibold leading-6 group-hover:text-primary">
                          {recipe.title}
                        </h4>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[1.3rem] border border-dashed border-[#dfcba9] bg-white/55 px-6 py-9 text-center text-sm text-muted-foreground">
                No {preference.replaceAll("-", " ")} recipes are available for{" "}
                {selectedCuisine.title} yet. Try another cuisine or preference.
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
