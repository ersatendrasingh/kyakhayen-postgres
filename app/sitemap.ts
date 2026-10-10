import { MetadataRoute } from "next";

import { toolPages } from "@/components/sections/situation-tools/tool-page-config";
import { db } from "@/lib/db";
import { getPublishedRecipeCollectionRoutes } from "@/lib/recipe-collection-resolver";
import { publishedRecipeWhere, recipeContentUpdatedAt } from "@/lib/recipe-publication";
import { absoluteUrl, articleHref, recipeHref } from "@/lib/seo";

type ChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const changeFrequency: ChangeFrequency = "daily";

  const [recipes, articles, recipeCollections] = await Promise.all([
    db.recipes.findMany({
      where: publishedRecipeWhere(),
      select: {
        slug: true,
        metaSlug: true,
        createdAt: true,
        updatedAt: true,
        publishedAt: true,
        contentUpdatedAt: true,
      },
      orderBy: [{ contentUpdatedAt: "desc" }, { updatedAt: "desc" }],
    }),
    db.post.findMany({
      where: { isPublished: true },
      select: { slug: true, metaSlug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    getPublishedRecipeCollectionRoutes(),
  ]);

  const staticRoutes = [
    { url: "/", lastModified: "2026-05-30", changeFrequency: "daily" },
    { url: "/recipes", lastModified: "2026-05-30", changeFrequency: "daily" },
    { url: "/tools", lastModified: "2026-06-04", changeFrequency: "daily" },
    {
      url: "/tools/smart-recipe-finder",
      lastModified: "2026-06-05",
      changeFrequency: "daily",
    },
    {
      url: "/tools/smart-food-compare",
      lastModified: "2026-06-05",
      changeFrequency: "daily",
    },
    {
      url: "/tools/smart-bmi-food-guide",
      lastModified: "2026-06-08",
      changeFrequency: "weekly",
    },
    { url: "/blog", lastModified: "2026-05-30", changeFrequency: "daily" },
    {
      url: "/about-us",
      lastModified: "2026-05-30",
      changeFrequency: "yearly",
    },
    {
      url: "/contact-us",
      lastModified: "2026-05-30",
      changeFrequency: "yearly",
    },
    { url: "/meal-plan", lastModified: "2026-05-30", changeFrequency: "daily" },
    {
      url: "/subscription-plans",
      lastModified: "2026-05-30",
      changeFrequency: "monthly",
    },
    {
      url: "/download-app",
      lastModified: "2026-05-30",
      changeFrequency: "yearly",
    },
    {
      url: "/privacy-policy",
      lastModified: "2026-05-30",
      changeFrequency: "yearly",
    },
    {
      url: "/terms-and-conditions",
      lastModified: "2026-05-30",
      changeFrequency: "yearly",
    },
  ].map((route) => ({
    url: absoluteUrl(route.url),
    lastModified: route.lastModified,
    changeFrequency: route.changeFrequency as ChangeFrequency,
  }));
  const toolRoutes = toolPages
    .filter((tool) => tool.href !== "/tools/smart-recipe-finder")
    .map((tool) => ({
      url: absoluteUrl(tool.href),
      lastModified: "2026-06-05",
      changeFrequency,
    }));

  const recipesRoutes = recipes.map((recipe) => {
    const lastModifiedDate = new Date(recipeContentUpdatedAt(recipe))
      .toISOString()
      .split("T")[0];

    return {
      url: absoluteUrl(recipeHref(recipe)),
      lastModified: lastModifiedDate,
      changeFrequency,
    };
  });

  const articlesRoutes = articles.map((article) => {
    const lastModifiedDate = new Date(article.updatedAt)
      .toISOString()
      .split("T")[0];

    return {
      url: absoluteUrl(articleHref(article)),
      lastModified: lastModifiedDate,
      changeFrequency,
    };
  });

  const collectionRoutes = Array.from(
    new Map(recipeCollections.map((collection) => [collection.href, collection])).values(),
  ).map((collection) => ({
    url: absoluteUrl(collection.href),
    lastModified: "2026-05-30",
    changeFrequency,
  }));

  return [
    ...staticRoutes,
    ...toolRoutes,
    ...collectionRoutes,
    ...recipesRoutes,
    ...articlesRoutes,
  ];
}
