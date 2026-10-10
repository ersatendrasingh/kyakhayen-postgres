import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  buildRecipePageMetadata,
  renderRecipeListingPage,
} from "@/app/(website)/recipes/recipe-listing-content";
import { resolveRecipeCollectionRoute } from "@/lib/recipe-collection-resolver";

type RecipeCollectionPageProps = {
  params: Promise<{ collectionSlug: string }>;
  searchParams?: Promise<{ food?: string }>;
};

export const revalidate = 900;

export async function generateMetadata({
  params,
}: RecipeCollectionPageProps): Promise<Metadata> {
  const { collectionSlug } = await params;
  const collection = await resolveRecipeCollectionRoute(collectionSlug);

  if (!collection) {
    return buildRecipePageMetadata({});
  }

  return buildRecipePageMetadata(
    { k: collection.slug, type: collection.type },
    collection.href,
  );
}

export default async function RecipeCollectionPage({
  params,
  searchParams,
}: RecipeCollectionPageProps) {
  const { collectionSlug } = await params;
  const query = searchParams ? await searchParams : {};
  const collection = await resolveRecipeCollectionRoute(collectionSlug);

  if (!collection) notFound();

  return renderRecipeListingPage({
    searchParams: { k: collection.slug, type: collection.type, food: query.food },
    canonicalPath: collection.href,
  });
}
