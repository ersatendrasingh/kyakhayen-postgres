"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  Eye,
  Flame,
  Share2,
  BadgeCheck,
  ChefHat,
  Sparkles,
  Star,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import FavoriteButton from "@/components/favorite-button";
import { FoodPreferenceMarker } from "@/components/recipes/food-preference-marker";
import {
  RecipeSteam,
  shouldShowRecipeSteam,
} from "@/components/recipes/recipe-steam";
import SocialShare from "@/components/social-share";
import { useCurrentUser } from "@/hooks/use-current-user";
import { calculateRecipeNutrition } from "@/lib/calculate-recipe-nutrition";
import { formatDate } from "@/lib/formatDate";
import { formatTime } from "@/lib/formatTime";
import { recipeAuthorProfile } from "@/lib/recipe-author-profile";
import { absoluteUrl, recipeHref, seoDescription } from "@/lib/seo";
import { cn } from "@/lib/utils";
import type { RecipeWithCategory } from "@/types/recipe";

interface BannerCardProps {
  recipe: RecipeWithCategory;
  className?: string;
}

const BannerCard = ({ recipe, className }: BannerCardProps) => {
  const userId = useCurrentUser()?.id;
  const [isFavorited, setIsFavorited] = useState(false);
  const reviewsCount = recipe.Review?.length ?? 0;
  const averageRating =
    reviewsCount > 0
      ? recipe.Review!.reduce((total, review) => total + review.rating, 0) /
        reviewsCount
      : 0;
  const cookingTime = recipe.recipeCookingTime;
  const totalMinutes =
    (cookingTime?.prepTime || 0) +
    (cookingTime?.cookTime || 0) +
    (cookingTime?.restTime || 0);
  const summary = seoDescription(
    recipe.metaDescription,
    recipe.description?.replace(/<[^>]*>/g, " ") ||
      "Discover ingredients and easy steps to bring this recipe to your table.",
  );
  const recipeUrl = absoluteUrl(recipeHref(recipe));
  const lastReviewedDate = formatDate(recipe.contentUpdatedAt ?? recipe.updatedAt);
  const cuisineTags = (recipe.recipeCuisine || [])
    .map((entry) => entry.cuisine.title)
    .slice(0, 2);
  const cookingMethodTags = (recipe.recipeCookingMethods || [])
    .map((entry) => entry.cookingMethod.title)
    .slice(0, 2);
  const recipeTags = [...cuisineTags, ...cookingMethodTags];
  const { totals: nutritionTotals, missingConversions } =
    calculateRecipeNutrition(recipe.recipeIngredients);
  const printableNutrition =
    missingConversions.length === 0 &&
    recipe.recipeIngredients.every((item) => item.ingredient.isPublished)
      ? {
          calories: nutritionTotals.calories,
          protein: nutritionTotals.protein,
          carbohydrate: nutritionTotals.carbohydrate,
          totalFat: nutritionTotals.totalFat,
          dietaryFiber: nutritionTotals.dietaryFiber,
          vitaminA: nutritionTotals.vitaminA,
          vitaminD: nutritionTotals.vitaminD,
          vitaminK: nutritionTotals.vitaminK,
          ascorbicAcids: nutritionTotals.ascorbicAcids,
          calcium: nutritionTotals.calcium,
          iron: nutritionTotals.iron,
          potassium: nutritionTotals.potassium,
          sodium: nutritionTotals.sodium,
        }
      : undefined;

  useEffect(() => {
    const body = JSON.stringify({ recipeId: recipe.id });

    if (navigator.sendBeacon) {
      const payload = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/add-view", payload);
      return;
    }

    void fetch("/api/add-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch((error) => {
      console.error("Error tracking view:", error);
    });
  }, [recipe.id]);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await axios.get<Array<{ recipe: { id: string } }>>(
          `/api/user/${userId}/favorites`,
        );
        setIsFavorited(
          response.data.some((favorite) => favorite.recipe.id === recipe.id),
        );
      } catch (error) {
        console.error("Error fetching user favorites:", error);
      }
    };
    if (userId) void fetchFavorites();
  }, [recipe.id, userId]);

  return (
    <section
      className={cn(
        "recipe-detail-hero grid items-stretch gap-5 lg:grid-cols-[1.03fr_0.97fr]",
        className,
      )}
    >
      <div className="group relative min-h-[390px] overflow-hidden rounded-[1.9rem] border border-white/40 shadow-[0_30px_65px_-42px_rgba(50,32,18,0.56)] sm:min-h-[530px] lg:min-h-[610px]">
        <Image
          src={recipe.imageUrl || "/placeholder.jpg"}
          alt={recipe.title || "Recipe"}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 54vw"
          className="object-cover transition duration-700 group-hover:scale-[1.035]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#16130e]/75 via-transparent to-[#16130e]/12" />
        {shouldShowRecipeSteam(recipe.title) && (
          <RecipeSteam className="bottom-[19%] left-1/2 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        )}
        <FavoriteButton
          actionId="recipe-save-toggle"
          recipeId={recipe.id}
          classNames="absolute right-4 top-4 z-10 sm:right-5 sm:top-5"
          initialIsFavorited={isFavorited}
          variant="card"
        />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/22 bg-black/20 px-3 py-2 text-xs font-medium text-white backdrop-blur-md">
              <Sparkles className="size-3.5 text-[#efd086]" />
              Made for your table
            </span>
            {recipe.RecipeCategories && (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/22 bg-black/20 px-3 py-2 text-xs font-medium text-white backdrop-blur-md">
                <FoodPreferenceMarker name={recipe.RecipeCategories.name} />
                {recipe.RecipeCategories.name}
              </span>
            )}
          </div>
          <p className="max-w-md text-sm leading-6 text-white/78">
            Measured ingredients, clear steps and nutrition guidance in one
            beautiful cooking view.
          </p>
        </div>
      </div>

      <div className="recipe-hero-copy flex flex-col rounded-[1.9rem] border border-[#ead9c2] bg-[#fffdf8]/95 p-5 shadow-[0_30px_64px_-48px_rgba(54,33,20,0.55)] backdrop-blur sm:p-8 dark:border-white/10 dark:bg-[#11251f]/95">
        <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs font-medium text-[#887360] dark:text-[#a9b8b1]">
          <Link href="/" className="transition hover:text-primary">
            Home
          </Link>
          <ChevronRight className="size-3.5" />
          <Link href="/recipes" className="transition hover:text-primary">
            Recipes
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="line-clamp-1">{recipe.title}</span>
        </nav>

        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.27em] text-[#a37638] dark:text-[#d9b36b]">
          <Flame className="size-4" />
          Today&apos;s kitchen pick
        </p>
        <h1 className="text-3xl font-semibold leading-tight text-[#2d241e] sm:text-5xl dark:text-[#f2f2ea]">
          {recipe.title}
        </h1>
        <p className="mt-4 line-clamp-3 text-sm leading-7 text-[#706357] sm:text-base dark:text-[#aebbb4]">
          {summary}
        </p>

        <div className="mt-5 flex flex-col gap-4 border-y border-[#eadfce] py-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#18382d] text-sm font-semibold text-white shadow-sm dark:bg-[#d5ad61] dark:text-[#102019]">
              {recipeAuthorProfile.initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#2f261f] dark:text-[#eef3ed]">
                By {recipeAuthorProfile.name}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs leading-5 text-[#756657] dark:text-[#aebbb4]">
                <ChefHat className="size-3.5 text-[#a37638] dark:text-[#d9b36b]" />
                {recipeAuthorProfile.role}
                <span className="text-[#c6ad91]">·</span>
                {recipeAuthorProfile.kitchen}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-[#705c49] dark:text-[#d7e0da]">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e1d2bd] bg-white/70 px-3 py-1.5 dark:border-white/10 dark:bg-white/7">
              <BadgeCheck className="size-3.5 text-[#3f765f]" />
              Kitchen tested
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e1d2bd] bg-white/70 px-3 py-1.5 dark:border-white/10 dark:bg-white/7">
              <CalendarDays className="size-3.5 text-[#a37638]" />
              Updated {lastReviewedDate}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-[#eadfce] py-4 text-sm text-[#635548] dark:border-white/10 dark:text-[#b6c2bb]">
          <span className="flex items-center gap-1.5">
            <Star className="size-4 fill-[#dfb259] text-[#dfb259]" />
            {reviewsCount ? averageRating.toFixed(1) : "New"}{" "}
            <span className="text-[#9a8a7b]">
              ({reviewsCount} reviews)
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="size-4 text-[#ac864e]" />
            {recipe.views || 0} views
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-4 text-[#ac864e]" />
            {formatDate(recipe.updatedAt)}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {[
            ["Total", totalMinutes ? formatTime(totalMinutes) : "Quick"],
            [
              "Prep",
              cookingTime?.prepTime
                ? formatTime(cookingTime.prepTime)
                : "Easy prep",
            ],
            [
              "Cook",
              cookingTime?.cookTime
                ? formatTime(cookingTime.cookTime)
                : "Ready soon",
            ],
            ["Skill", recipe.recipeDifficulty?.title || "Everyday"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-[#eee2d1] bg-[#fbf4e7] px-4 py-3 dark:border-white/8 dark:bg-[#173028]"
            >
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a17d47] dark:text-[#cba761]">
                {label}
              </p>
              <p className="flex items-center gap-2 text-sm font-semibold text-[#332921] dark:text-[#ecf2eb]">
                {label === "Total" && <Clock3 className="size-4" />}
                {value}
              </p>
            </div>
          ))}
        </div>

        {recipeTags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {cuisineTags.map((tag) => (
              <span
                key={`cuisine-${tag}`}
                className="rounded-full border border-[#e8dcc9] px-3 py-2 text-xs font-medium text-[#635243] dark:border-white/12 dark:text-[#d3dcd6]"
              >
                Cuisine · {tag}
              </span>
            ))}
            {cookingMethodTags.map((tag) => (
              <span
                key={`method-${tag}`}
                className="rounded-full border border-[#e8dcc9] px-3 py-2 text-xs font-medium text-[#635243] dark:border-white/12 dark:text-[#d3dcd6]"
              >
                Style · {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-7">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#967042] dark:text-[#d7ad64]">
            <Share2 className="size-3.5" />
            Share this recipe
          </p>
          <SocialShare
            url={recipeUrl}
            title={recipe.title}
            description={summary}
            overview={recipe.description || summary}
            imageUrl={recipe.imageUrl || undefined}
            ingredients={recipe.recipeIngredients.map((item) =>
              `${item.quantity} ${item.unit?.shortName || item.unit?.title || ""} ${item.ingredient.name}`
                .replace(/\s+/g, " ")
                .trim(),
            )}
            steps={recipe.recipeMethods.map(
              (method) => `${method.title}: ${method.description || ""}`,
            )}
            totalMinutes={totalMinutes}
            prepMinutes={cookingTime?.prepTime}
            cookMinutes={cookingTime?.cookTime}
            restMinutes={cookingTime?.restTime}
            category={recipe.RecipeCategories?.name}
            cuisine={recipe.recipeCuisine?.[0]?.cuisine.title}
            difficulty={recipe.recipeDifficulty?.title}
            tags={recipeTags}
            nutrition={printableNutrition}
          />
        </div>
      </div>
    </section>
  );
};

export default BannerCard;
