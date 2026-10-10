import {
  ArrowRight,
  ChefHat,
  Coffee,
  CookingPot,
  CupSoda,
  HeartPulse,
  Leaf,
  Soup,
  Sparkles,
  Sun,
  UtensilsCrossed,
} from "lucide-react";
import type { Prisma } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { unstable_cache } from "next/cache";

import Container from "@/components/container";
import { db } from "@/lib/db";
import { shouldServeDirectMediaImage } from "@/lib/direct-media-image";
import { recipeCollectionHref } from "@/lib/recipe-collection-url";
import { publishedRecipeAnd } from "@/lib/recipe-publication";

type SeoHub = {
  label: string;
  href: string;
  description: string;
  fallbackImage: string;
  icon: typeof Coffee;
  where: Prisma.RecipesWhereInput;
};

const seoHubs: SeoHub[] = [
  {
    label: "Breakfast recipes",
    href: recipeCollectionHref("breakfast"),
    description: "Poha, cheela, oats, idli and fresh morning ideas.",
    fallbackImage: "/assets/images/auth-fruit-prep-hero.webp",
    icon: Coffee,
    where: { recipeMealTime: { some: { mealTime: { slug: "breakfast" } } } },
  },
  {
    label: "Dinner recipes",
    href: recipeCollectionHref("dinner"),
    description: "Comforting sabzi, dal, curry and family dinner plates.",
    fallbackImage: "/assets/images/our-mission.webp",
    icon: ChefHat,
    where: { recipeMealTime: { some: { mealTime: { slug: "dinner" } } } },
  },
  {
    label: "Healthy recipes",
    href: recipeCollectionHref("healthy"),
    description: "Lighter meals, protein-rich dishes and everyday balance.",
    fallbackImage: "/assets/images/membership-prompt/bell-peppers-beans.webp",
    icon: HeartPulse,
    where: {
      OR: [
        { RecipeCategories: { slug: "healthy" } },
        { recipeRecipeType: { some: { recipeType: { slug: "healthy" } } } },
        { recipeDietType: { some: { dietType: { slug: "healthy" } } } },
        { recipeNutrient: { some: { nutrient: { title: { contains: "healthy" } } } } },
      ],
    },
  },
  {
    label: "Vegetarian recipes",
    href: recipeCollectionHref("veg"),
    description: "Paneer, vegetables, lentils and homestyle veg meals.",
    fallbackImage: "/assets/images/membership-prompt/stir-fried-mix-vegetables.webp",
    icon: Leaf,
    where: { RecipeCategories: { slug: "veg" } },
  },
  {
    label: "Paneer recipes",
    href: recipeCollectionHref("paneer"),
    description: "Creamy curries, quick snacks and restaurant-style paneer.",
    fallbackImage: "/assets/images/default-recipe.png",
    icon: CookingPot,
    where: {
      OR: [
        { title: { contains: "paneer" } },
        {
          recipeIngredients: {
            some: {
              ingredient: {
                OR: [
                  { name: { contains: "paneer" } },
                  { slug: { contains: "paneer" } },
                ],
              },
            },
          },
        },
      ],
    },
  },
  {
    label: "North Indian recipes",
    href: recipeCollectionHref("north-indian"),
    description: "Rajma, chole, paratha, gravies and familiar classics.",
    fallbackImage: "/assets/images/about-story-hero.webp",
    icon: UtensilsCrossed,
    where: { recipeCuisine: { some: { cuisine: { slug: "north-indian" } } } },
  },
  {
    label: "Smoothie recipes",
    href: recipeCollectionHref("drink-smoothies"),
    description: "Fruit, oats and seed smoothies for refreshing sips.",
    fallbackImage: "/assets/images/smoothie.png",
    icon: CupSoda,
    where: {
      recipeRecipeType: { some: { recipeType: { slug: "drink-smoothies" } } },
    },
  },
  {
    label: "Summer recipes",
    href: recipeCollectionHref("summer"),
    description: "Cooling drinks, light plates and warm-weather ideas.",
    fallbackImage: "/assets/images/smoothie.png",
    icon: Sun,
    where: {
      seasonality: "SEASONAL",
      OR: [
        { recipeSeasons: { title: "Summer" } },
        { recipeSeasonTags: { some: { season: { title: "Summer" } } } },
      ],
    },
  },
  {
    label: "Lunch recipes",
    href: recipeCollectionHref("lunch"),
    description: "Simple midday meals, thali ideas and filling lunch plates.",
    fallbackImage: "/assets/images/our-mission.webp",
    icon: Soup,
    where: { recipeMealTime: { some: { mealTime: { slug: "lunch" } } } },
  },
  {
    label: "Snacks recipes",
    href: recipeCollectionHref("snacks"),
    description: "Evening bites, quick cravings and guest-friendly snacks.",
    fallbackImage: "/assets/images/membership-prompt/saute-cabbage-onions.webp",
    icon: Sparkles,
    where: {
      recipeRecipeType: { some: { recipeType: { slug: "snacks" } } },
    },
  },
];

const seoHubCandidateLimit = 12;

const getSeoHubImages = unstable_cache(
  async () => {
    const candidateGroups = await Promise.all(
      seoHubs.map((hub) =>
        db.recipes.findMany({
          where: publishedRecipeAnd([{ imageUrl: { not: null } }, hub.where]),
          select: { id: true, title: true, imageUrl: true },
          orderBy: [
            { views: "desc" },
            { contentUpdatedAt: "desc" },
            { updatedAt: "desc" },
            { id: "desc" },
          ],
          take: seoHubCandidateLimit,
        }),
      ),
    );
    const usedRecipeIds = new Set<string>();
    const usedImageUrls = new Set<string>();

    return Object.fromEntries(
      seoHubs.map((hub, index) => {
        const uniqueRecipe =
          candidateGroups[index]?.find((recipe) => {
            if (!recipe.imageUrl) return false;
            return !usedRecipeIds.has(recipe.id) && !usedImageUrls.has(recipe.imageUrl);
          }) ||
          candidateGroups[index]?.find((recipe) => {
            if (!recipe.imageUrl) return false;
            return !usedImageUrls.has(recipe.imageUrl);
          });
        const imageUrl = uniqueRecipe?.imageUrl ?? hub.fallbackImage;

        if (uniqueRecipe) {
          usedRecipeIds.add(uniqueRecipe.id);
        }
        usedImageUrls.add(imageUrl);

        return [
          hub.href,
          {
            title: uniqueRecipe?.title ?? hub.label,
            imageUrl,
          },
        ];
      }),
    );
  },
  ["home-seo-hub-images-v4"],
  { revalidate: 900, tags: ["recipes"] },
);

export default async function HomeSeoHubs() {
  const hubImages = await getSeoHubImages();

  return (
    <section className="border-b border-[#eadbc7]/70 bg-[#fffaf1] py-10 sm:py-14 dark:border-white/8 dark:bg-[#091712]">
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#a67636] dark:text-[#ddb66e]">
              Popular recipe hubs
            </p>
            <h2 className="text-2xl font-semibold text-[#30251d] sm:text-3xl dark:text-[#eef3ed]">
              Start with the food paths people search most.
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#75675b] dark:text-[#aebbb4]">
              Jump into the strongest Kya Khayen recipe collections, backed by
              real dishes from the kitchen.
            </p>
          </div>
          <Link
            href="/recipes"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-[#dfc49b] bg-white px-5 py-3 text-sm font-semibold text-[#4e3d31] transition hover:border-[#cda66b] dark:border-white/14 dark:bg-white/6 dark:text-[#edf2ec]"
          >
            View all recipes <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {seoHubs.map(({ label, href, description, fallbackImage, icon: Icon }, index) => {
            const image = hubImages[href] ?? {
              title: label,
              imageUrl: fallbackImage,
            };
            const featured = index < 2;

            return (
              <Link
                key={href}
                href={href}
                className={`group relative isolate overflow-hidden rounded-[1.55rem] border border-white/70 bg-[#efe0c8] shadow-[0_20px_44px_-34px_rgba(51,31,18,0.62)] transition hover:-translate-y-1 hover:shadow-[0_30px_62px_-38px_rgba(51,31,18,0.72)] dark:border-white/10 ${
                  featured ? "min-h-[320px] lg:col-span-2" : "min-h-[250px]"
                }`}
              >
                <Image
                  src={image.imageUrl}
                  alt={`${label} collection`}
                  fill
                  sizes={
                    featured
                      ? "(max-width: 1024px) 100vw, 520px"
                      : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 260px"
                  }
                  unoptimized={shouldServeDirectMediaImage(image.imageUrl)}
                  className="object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#17110d]/88 via-[#17110d]/32 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-br from-black/22 via-transparent to-transparent" />

                <div className="relative flex h-full min-h-[inherit] flex-col justify-between p-5 text-white sm:p-6">
                  <span className="flex size-11 items-center justify-center rounded-full border border-white/22 bg-white/16 text-[#f8d18a] backdrop-blur-md">
                    <Icon className="size-5" />
                  </span>

                  <div>
                    <p className="mb-2 line-clamp-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f8d18a]/90">
                      Featured: {image.title}
                    </p>
                    <h3 className="flex items-center justify-between gap-3 text-xl font-semibold leading-tight sm:text-2xl">
                      {label}
                      <ArrowRight className="size-5 shrink-0 opacity-70 transition group-hover:translate-x-1 group-hover:opacity-100" />
                    </h3>
                    <p className="mt-2 max-w-md text-sm leading-6 text-white/78">
                      {description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
