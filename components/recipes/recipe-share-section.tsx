"use client";

import { RecipeWithCategory } from "@/types/recipe";
import SocialShare from "@/components/social-share";
import { absoluteUrl, recipeHref, seoDescription } from "@/lib/seo";

interface RecipeShareSectionProps {
  recipe: RecipeWithCategory;
}

const RecipeShareSection = ({ recipe }: RecipeShareSectionProps) => {
  const recipeUrl = absoluteUrl(recipeHref(recipe));
  return (
    <div className="w-full flex flex-col items-start justify-start bg-white rounded-md p-4 shadow-sm transition mb-10">
      <h2 className="text-2xl font-bold">Share this recipe</h2>
      <SocialShare
        url={recipeUrl}
        title={recipe.title}
        description={seoDescription(recipe.metaDescription, recipe.description)}
        imageUrl={recipe.imageUrl || ""}
      />
    </div>
  );
};

export default RecipeShareSection;
