"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import HomeRecipeCard from "@/components/recipes/home-recipe-card";
import type { HomeRecipeCardRecipe } from "@/components/recipes/home-recipe-card";

interface RelatedCourseProps {
  recipes: HomeRecipeCardRecipe[];
}

const RelatedRecipeSlider = ({ recipes }: RelatedCourseProps) => {
  return (
    <section className="w-full">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#a67b40] dark:text-[#d5ad65]">
            Keep exploring
          </p>
          <h2 className="text-2xl font-semibold text-[#2e251f] dark:text-[#eef2ec]">
            You may also love
          </h2>
        </div>
      </div>

      {recipes.length > 0 ? (
        <div className="recipe-related-panel w-full rounded-[1.75rem] border border-[#eadcc8] bg-[#fffdf8]/70 p-3 shadow-sm sm:p-5 dark:border-white/10 dark:bg-[#10221d]/75">
            <Carousel
              opts={{
                align: "start",
              }}
              className="w-full"
            >
              <CarouselContent>
                {recipes.slice(0, 10).map((recipe) => {
                  return (
                    <CarouselItem
                      key={recipe.id}
                      className="pl-4 md:basis-1/2 lg:basis-1/4"
                    >
                      <HomeRecipeCard recipe={recipe} />
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <CarouselPrevious className="absolute top-1/2 transform -translate-y-1/2 left-2 cursor-pointer" />
              <CarouselNext className="absolute top-1/2 transform -translate-y-1/2 right-2 cursor-pointer" />
            </Carousel>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#faf3e7] p-6 text-center dark:bg-[#152e26]">
          <h2 className="text-sm font-medium text-[#75665b] dark:text-[#afbbb5]">
            More delicious recommendations are coming soon.
          </h2>
        </div>
      )}
    </section>
  );
};

export default RelatedRecipeSlider;
