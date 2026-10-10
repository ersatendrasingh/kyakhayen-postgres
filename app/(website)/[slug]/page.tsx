import { notFound, permanentRedirect } from "next/navigation";
import { Metadata } from "next";
import SingleRecipe from "@/components/recipes/single-recipe";
import SingleArticle from "@/components/blogs/single-article";
import { articleHref, buildSeoMetadata, recipeHref, seoDescription, seoTitle } from "@/lib/seo";
import { recipeAuthorProfile } from "@/lib/recipe-author-profile";
import { recipeContentUpdatedAt, recipePublishedAt } from "@/lib/recipe-publication";
import {
  getPublicArticleByRouteSlug,
  getPublicArticleMetadataByRouteSlug,
  getPublicRecipeByRouteSlug,
  getPublicRecipeMetadataByRouteSlug,
} from "@/lib/public-content";

export const revalidate = 900;

function recipeDescriptionFallback(recipe: NonNullable<Awaited<ReturnType<typeof getPublicRecipeMetadataByRouteSlug>>>) {
  const cuisine = recipe.recipeCuisine[0]?.cuisine.title;
  const category = recipe.RecipeCategories?.name;
  const recipeType = recipe.recipeRecipeType[0]?.recipeType.title;
  const context = [cuisine, category, recipeType].filter(Boolean).join(", ");

  return `${recipe.title} recipe with ingredients and step-by-step cooking instructions${context ? ` for ${context.toLowerCase()} cooking` : ""}. Make it at home with Kya Khayen.`;
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const { slug } = params;

  const recipe = await getPublicRecipeMetadataByRouteSlug(slug);

  if (recipe) {
    const description = seoDescription(
      recipe.metaDescription,
      recipeDescriptionFallback(recipe),
    );
    const recipeKeywords = [
      recipe.title,
      `${recipe.title} recipe`,
      "easy recipe",
      "homemade recipe",
      recipe.RecipeCategories?.name,
      ...(recipe.recipeCuisine ?? []).map(({ cuisine }) => cuisine.title),
      ...(recipe.recipeDietType ?? []).map(({ dietType }) => dietType.title),
      ...(recipe.recipeRecipeType ?? []).map(({ recipeType }) => recipeType.title),
    ].filter((value): value is string => Boolean(value));

    return buildSeoMetadata({
      title: seoTitle(recipe.metaTitle, `${recipe.title} Recipe | Kya Khayen`),
      description,
      path: recipeHref(recipe),
      image: recipe.imageUrl,
      imageAlt: `${recipe.title} recipe`,
      type: "article",
      publishedTime: recipePublishedAt(recipe),
      modifiedTime: recipeContentUpdatedAt(recipe),
      keywords: recipeKeywords,
      authors: [{ name: recipeAuthorProfile.name, url: "/about-us" }],
    });
  }

  const blog = await getPublicArticleMetadataByRouteSlug(slug);

  if (blog) {
    const description = seoDescription(
      blog.metaDescription,
      blog.content || `${blog.title} from Kya Khayen.`,
    );
    const articleKeywords = [
      blog.title,
      "cooking tips",
      "food guide",
      ...blog.PostCategory.map(({ category }) => category.title),
      ...blog.PostTag.map(({ tag }) => tag.title),
    ].filter((value): value is string => Boolean(value));

    return buildSeoMetadata({
      title: seoTitle(blog.metaTitle, `${blog.title} | Kya Khayen`),
      description,
      path: articleHref(blog),
      image: blog.imageUrl,
      imageAlt: blog.title,
      type: "article",
      publishedTime: blog.createdAt,
      modifiedTime: blog.updatedAt,
      keywords: articleKeywords,
    });
  }

  return buildSeoMetadata({
    title: "Page Not Found | Kya Khayen",
    description: "The Kya Khayen page you are looking for does not exist.",
    path: "/404",
    noIndex: true,
  });
}

export default async function SlugPage(
  props: {
    params: Promise<{ slug: string }>;
  }
) {
  const params = await props.params;
  const { slug } = params;

  const recipe = await getPublicRecipeByRouteSlug(slug);

  if (recipe) {
    const canonicalPath = recipeHref(recipe);
    if (canonicalPath !== `/${slug}`) {
      permanentRedirect(canonicalPath);
    }

    return <SingleRecipe recipe={recipe} />;
  }

  const blog = await getPublicArticleByRouteSlug(slug);

  if (blog) {
    const canonicalPath = articleHref(blog);
    if (canonicalPath !== `/${slug}`) {
      permanentRedirect(canonicalPath);
    }

    return <SingleArticle article={blog} />;
  }

  return notFound();
}
