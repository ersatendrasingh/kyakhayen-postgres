export function recipeCollectionHref(slug?: string | null) {
  return slug ? `/recipes/${slug}` : "/recipes";
}
