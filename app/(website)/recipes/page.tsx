import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  buildRecipePageMetadata,
  renderRecipeListingPage,
  type RecipeSearchParams,
} from "@/app/(website)/recipes/recipe-listing-content";
import { recipeCollectionHref } from "@/lib/recipe-collection-url";

export const revalidate = 900;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<RecipeSearchParams>;
}): Promise<Metadata> {
  return buildRecipePageMetadata(await searchParams);
}

export default async function RecipePage({
  searchParams,
}: {
  searchParams: Promise<RecipeSearchParams>;
}) {
  const query = await searchParams;

  if (query.k && query.type) {
    const nextParams = new URLSearchParams();
    if (query.food) nextParams.set("food", query.food);
    redirect(
      `${recipeCollectionHref(query.k)}${nextParams.size ? `?${nextParams.toString()}` : ""}`,
    );
  }

  return renderRecipeListingPage({ searchParams: query });
}
