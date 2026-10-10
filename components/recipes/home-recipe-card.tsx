import { Clock3 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { FoodPreferenceMarker } from "@/components/recipes/food-preference-marker";
import {
  RecipeSteam,
  shouldShowRecipeSteam,
} from "@/components/recipes/recipe-steam";
import { shouldServeDirectMediaImage } from "@/lib/direct-media-image";
import { recipeHref } from "@/lib/seo";

export type HomeRecipeCardRecipe = {
  id: string;
  title: string;
  slug: string;
  metaSlug: string | null;
  imageUrl: string | null;
  RecipeCategories: { name: string } | null;
  recipeCookingTime: {
    prepTime: number;
    cookTime: number;
    restTime: number;
  } | null;
  recipeNutrient?: Array<{ nutrient: { title: string } }> | null;
};

function getTotalMinutes(recipe: HomeRecipeCardRecipe) {
  if (!recipe.recipeCookingTime) return null;
  return (
    recipe.recipeCookingTime.prepTime +
    recipe.recipeCookingTime.cookTime +
    recipe.recipeCookingTime.restTime
  );
}

export default function HomeRecipeCard({
  recipe,
}: {
  recipe: HomeRecipeCardRecipe;
}) {
  const minutes = getTotalMinutes(recipe);
  const imageSrc = recipe.imageUrl || "/meta-images/recipe-page.jpg";

  return (
    <Link
      href={recipeHref(recipe)}
      className="home-recipe-card group block overflow-hidden rounded-3xl border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[1.45] overflow-hidden">
        <Image
          src={imageSrc}
          alt={recipe.title}
          fill
          quality={64}
          unoptimized={shouldServeDirectMediaImage(imageSrc)}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 24vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        {shouldShowRecipeSteam(recipe.title) && (
          <RecipeSteam className="bottom-[14%] left-1/2" />
        )}
        {recipe.recipeNutrient?.[0]?.nutrient.title && (
          <span className="absolute left-3 top-3 rounded-full bg-[#fffdf8]/95 px-3 py-1.5 text-[11px] font-semibold text-[#25483b] shadow-sm">
            {recipe.recipeNutrient[0].nutrient.title}
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <FoodPreferenceMarker name={recipe.RecipeCategories?.name || "Veg"} />
          {minutes !== null && (
            <span className="flex items-center gap-1">
              <Clock3 className="size-3.5" />
              {minutes} min
            </span>
          )}
        </div>
        <h3 className="line-clamp-2 text-base font-semibold leading-6 transition group-hover:text-primary">
          {recipe.title}
        </h3>
      </div>
    </Link>
  );
}
