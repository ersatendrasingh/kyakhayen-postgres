import { ArrowRight, Clock3 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import Container from "@/components/container";
import HomeRecipeCard from "@/components/recipes/home-recipe-card";
import { FoodPreferenceMarker } from "@/components/recipes/food-preference-marker";
import {
  RecipeSteam,
  shouldShowRecipeSteam,
} from "@/components/recipes/recipe-steam";
import { recipeHref } from "@/lib/seo";

type FeaturedRecipe = {
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
  recipeCuisine: Array<{ cuisine: { title: string } }>;
};

type HomeFeaturedRecipesProps = {
  recipes: FeaturedRecipe[];
};

function totalMinutes(recipe: FeaturedRecipe) {
  if (!recipe.recipeCookingTime) return null;

  return (
    recipe.recipeCookingTime.prepTime +
    recipe.recipeCookingTime.cookTime +
    recipe.recipeCookingTime.restTime
  );
}

export default function HomeFeaturedRecipes({
  recipes,
}: HomeFeaturedRecipesProps) {
  if (recipes.length === 0) return null;

  const [leadRecipe, ...supportingRecipes] = recipes;
  const leadMinutes = totalMinutes(leadRecipe);

  return (
    <section className="home-surface home-featured py-16 sm:py-20">
      <Container>
        <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              Freshly curated
            </p>
            <h2 className="max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Recipes worth gathering around
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
              Handpicked dishes with real imagery, clear methods and flavours
              you can bring to the table today.
            </p>
          </div>
          <Link
            href="/recipes"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:gap-3"
          >
            Browse all recipes <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
          <Link
            href={recipeHref(leadRecipe)}
            className="group relative min-h-[430px] overflow-hidden rounded-[2rem] bg-card shadow-sm"
          >
            <Image
              src={leadRecipe.imageUrl || "/meta-images/recipe-page.jpg"}
              alt={leadRecipe.title}
              fill
              quality={68}
              sizes="(max-width: 1024px) 100vw, 54vw"
              className="object-cover transition duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
            {shouldShowRecipeSteam(leadRecipe.title) && (
              <RecipeSteam className="bottom-[44%] left-[50%]" />
            )}
            <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
              <div className="mb-4 flex flex-wrap gap-2 text-xs font-medium">
                {leadRecipe.RecipeCategories && (
                  <FoodPreferenceMarker name={leadRecipe.RecipeCategories.name} />
                )}
                {leadRecipe.recipeCuisine[0] && (
                  <span className="rounded-full bg-white/18 px-3 py-1.5 backdrop-blur">
                    {leadRecipe.recipeCuisine[0].cuisine.title}
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-semibold sm:text-3xl">
                {leadRecipe.title}
              </h3>
              {leadMinutes !== null && (
                <p className="mt-3 flex items-center gap-2 text-sm text-white/82">
                  <Clock3 className="size-4" />
                  {leadMinutes} min
                </p>
              )}
            </div>
          </Link>

          <div className="grid gap-4 sm:grid-cols-2">
            {supportingRecipes.slice(0, 4).map((recipe) => {
              return (
                <HomeRecipeCard key={recipe.id} recipe={recipe} />
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
