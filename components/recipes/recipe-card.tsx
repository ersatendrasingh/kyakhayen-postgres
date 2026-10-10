"use client";

import { Clock3, Flame, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import FavoriteButton from "@/components/favorite-button";
import { FoodPreferenceMarker } from "@/components/recipes/food-preference-marker";
import {
  RecipeSteam,
  shouldShowRecipeSteam,
} from "@/components/recipes/recipe-steam";
import { shouldServeDirectMediaImage } from "@/lib/direct-media-image";
import { handleRecipeClick } from "@/lib/handle-recipe-click";
import { recipeHref } from "@/lib/seo";
import { cn } from "@/lib/utils";

export type RecipeCardRecipe = {
  id: string;
  title: string;
  slug: string;
  metaSlug: string | null;
  imageUrl: string | null;
  views?: number | null;
  contentUpdatedAt?: Date | string | null;
  updatedAt?: Date | string | null;
  RecipeCategories: { id?: string; name: string } | null;
  recipeCookingTime?: {
    prepTime: number;
    cookTime: number;
    restTime: number;
  } | null;
  recipeNutrient?: Array<{ nutrient: { title: string } }> | null;
  recipeCuisine?: Array<{ cuisine: { title: string } }> | null;
  recipeIngredients?: Array<{ ingredient: { name: string } }> | null;
  Review?: Array<{ rating: number }> | null;
  fastingFriendly?: boolean;
};

interface RecipeCardProps {
  recipe: RecipeCardRecipe;
  layout?: "grid" | "list";
  imageLoad?: "priority" | "eager" | "lazy";
}

const RecipeCard = ({
  recipe,
  layout = "grid",
  imageLoad = "lazy",
}: RecipeCardProps) => {
  const href = recipeHref(recipe);
  const imageSrc = recipe.imageUrl || "/meta-images/recipe-page.jpg";
  const imageLoadingProps =
    imageLoad === "priority"
      ? { priority: true, fetchPriority: "high" as const }
      : {
          loading: imageLoad === "eager" ? ("eager" as const) : ("lazy" as const),
          fetchPriority: imageLoad === "eager" ? ("high" as const) : ("auto" as const),
        };
  const totalMinutes = recipe.recipeCookingTime
    ? recipe.recipeCookingTime.prepTime +
      recipe.recipeCookingTime.cookTime +
      recipe.recipeCookingTime.restTime
    : null;
  const nutritionBenefit = recipe.recipeNutrient?.[0]?.nutrient.title;
  const fastingFriendly = recipe.fastingFriendly === true;
  const cuisine = recipe.recipeCuisine?.[0]?.cuisine.title;
  const reviews = recipe.Review || [];
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((total, review) => total + review.rating, 0) /
        reviews.length
      : null;

  const rememberDiscovery = () => {
    if (!recipe.RecipeCategories?.id) return;
    handleRecipeClick(recipe.id, recipe.RecipeCategories.id);
  };

  return (
    <article
      className={cn(
        "home-recipe-card group relative overflow-hidden rounded-[1.55rem] border border-[#eadcc8] bg-[#fffdf8] shadow-[0_18px_38px_-32px_rgba(51,31,18,0.56)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_25px_52px_-32px_rgba(51,31,18,0.68)] dark:border-white/10 dark:bg-[#142e27]",
        layout === "list" ? "flex min-h-[180px]" : "flex h-full flex-col",
      )}
    >
      <div className="absolute right-3 top-3 z-20">
        <FavoriteButton
          recipeId={recipe.id}
          variant="card"
        />
      </div>

      <Link
        href={href}
        onClick={rememberDiscovery}
        className={cn("block", layout === "list" && "w-[38%] shrink-0 sm:w-[280px]")}
      >
        <div
          className={cn(
            "relative overflow-hidden",
            layout === "grid" ? "aspect-[1.42]" : "h-full min-h-[180px]",
          )}
        >
          <Image
            src={imageSrc}
            alt={recipe.title || "Recipe"}
            fill
            unoptimized={shouldServeDirectMediaImage(imageSrc)}
            sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 25vw"
            {...imageLoadingProps}
            className="object-cover transition duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#11130f]/38 via-transparent to-transparent" />
          {shouldShowRecipeSteam(recipe.title) && (
            <RecipeSteam className="bottom-[14%] left-1/2" />
          )}
          {(fastingFriendly || nutritionBenefit) && (
            <div className="absolute left-3 top-3 flex max-w-[calc(100%-4.5rem)] flex-col items-start gap-1.5">
              {fastingFriendly && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f0c46a] bg-[#fff7df]/95 px-3 py-1.5 text-[11px] font-bold text-[#8a4d13] shadow-sm dark:border-[#d9a24b]/45 dark:bg-[#2e2415]/95 dark:text-[#f4d58f]">
                  <Flame className="size-3.5" />
                  Vrat friendly
                </span>
              )}
              {nutritionBenefit && (
                <span className="rounded-full bg-[#fffdf8]/95 px-3 py-1.5 text-[11px] font-semibold text-[#25483b] shadow-sm dark:bg-[#122921]/95 dark:text-[#e9f0ea]">
                  {nutritionBenefit}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>

      <div className={cn("flex flex-1 flex-col p-4", layout === "list" && "justify-center pr-14 sm:p-6 sm:pr-16")}>
        <div className="mb-3 flex items-center justify-between gap-3 text-xs text-[#847265] dark:text-[#a7b6ae]">
          <FoodPreferenceMarker name={recipe.RecipeCategories?.name || "Veg"} />
          {totalMinutes !== null && (
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <Clock3 className="size-3.5" />
              {totalMinutes} min
            </span>
          )}
        </div>

        <Link href={href} onClick={rememberDiscovery} className="block">
          <h3 className="line-clamp-2 text-[1.06rem] font-semibold leading-7 text-[#30251d] transition group-hover:text-[#b53325] dark:text-[#edf2ec] dark:group-hover:text-[#e0b66a]">
            {recipe.title}
          </h3>
        </Link>

        <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-xs">
          {cuisine ? (
            <span className="line-clamp-1 rounded-full bg-[#f4eadb] px-3 py-1.5 font-medium text-[#72583d] dark:bg-[#19352c] dark:text-[#d9c090]">
              Cuisine · {cuisine}
            </span>
          ) : (
            <span />
          )}
          {averageRating !== null && (
            <span className="inline-flex items-center gap-1 text-[#806c5c] dark:text-[#c2d0c8]">
              <Star className="size-3.5 fill-[#d6a452] text-[#d6a452]" />
              {averageRating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

export default RecipeCard;
