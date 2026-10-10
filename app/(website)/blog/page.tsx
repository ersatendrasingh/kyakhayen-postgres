import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { ArrowRight, BookOpen, ChefHat, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import {
  EditorialMiniStory,
  EditorialStoryRow,
  StoryMeta,
} from "@/components/blogs/editorial-story-card";
import {
  articleHref,
  articleReadMinutes,
  formatArticleDate,
} from "@/components/blogs/editorial-utils";
import JournalDayBoard from "@/components/blogs/journal-day-board";
import Container from "@/components/container";
import HomeMealPlanAction from "@/components/sections/home-meal-plan-action";
import { db } from "@/lib/db";
import { publishedRecipeWhere } from "@/lib/recipe-publication";
import {
  breadcrumbJsonLd,
  buildSeoMetadata,
  itemListJsonLd,
  jsonLd,
} from "@/lib/seo";
import SmartBmiCta from "@/components/sections/bmi-tool/smart-bmi-cta";

type BlogPageProps = {
  searchParams: Promise<{ k?: string; type?: string }>;
};

export const revalidate = 900;

const getBlogPageData = unstable_cache(
  async (filterKey?: string, filterType?: string) =>
    Promise.all([
      db.post.findMany({
        where: {
          isPublished: true,
          ...(filterType === "category" && filterKey
            ? {
                PostCategory: {
                  some: { category: { slug: filterKey, isPublished: true } },
                },
              }
            : {}),
          ...(filterType === "tag" && filterKey
            ? {
                PostTag: {
                  some: { tag: { slug: filterKey, isPublished: true } },
                },
              }
            : {}),
        },
        select: {
          id: true,
          title: true,
          metaDescription: true,
          imageUrl: true,
          slug: true,
          metaSlug: true,
          updatedAt: true,
          PostCategory: {
            select: { category: { select: { title: true, slug: true } } },
          },
          PostTag: {
            select: { tag: { select: { title: true, slug: true } } },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 24,
      }),
      db.category.findMany({
        where: {
          isPublished: true,
          PostCategory: { some: { post: { isPublished: true } } },
        },
        include: { _count: { select: { PostCategory: true } } },
        orderBy: [{ position: "asc" }, { title: "asc" }],
      }),
      db.articleTag.findMany({
        where: {
          isPublished: true,
          PostTag: { some: { post: { isPublished: true } } },
        },
        include: { _count: { select: { PostTag: true } } },
        orderBy: [{ position: "asc" }, { title: "asc" }],
        take: 8,
      }),
      db.recipes.findMany({
        where: {
          ...publishedRecipeWhere(),
          imageUrl: { not: null },
          RecipeCategories: { slug: { in: ["veg", "vegan"] } },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          metaSlug: true,
          imageUrl: true,
          RecipeCategories: { select: { name: true } },
          recipeCookingTime: {
            select: { prepTime: true, cookTime: true, restTime: true },
          },
          recipeNutrient: {
            where: { nutrient: { isPublished: true } },
            select: { nutrient: { select: { title: true } } },
            take: 1,
          },
        },
        orderBy: [
          { views: "desc" },
          { contentUpdatedAt: "desc" },
          { updatedAt: "desc" },
        ],
        take: 6,
      }),
    ]),
  ["website-blog-page-v1"],
  {
    revalidate: 900,
    tags: ["articles", "recipes"],
  },
);

function collectionLabel(slug?: string) {
  if (!slug) return null;

  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({
  searchParams,
}: BlogPageProps): Promise<Metadata> {
  const filters = await searchParams;
  const label = collectionLabel(filters.k);
  const title = label
    ? `${label} Food Stories and Kitchen Guides | Kya Khayen`
    : "Food Stories, Kitchen Guides and Everyday Ideas | Kya Khayen";
  const description = label
    ? `Read ${label.toLowerCase()} food stories, kitchen guides and practical cooking ideas from Kya Khayen.`
    : "Read original food stories, kitchen guides, seasonal ideas and practical meal inspiration from Kya Khayen.";
  const queryString = new URLSearchParams();

  if (filters.k) queryString.set("k", filters.k);
  if (filters.type) queryString.set("type", filters.type);

  return buildSeoMetadata({
    title,
    description,
    path: `/blog${queryString.size ? `?${queryString.toString()}` : ""}`,
    image: "/meta-images/home-og-2026.png",
    imageAlt: "Kya Khayen food stories and kitchen guides",
    noIndex: Boolean(filters.k && !filters.type),
    keywords: [
      "food stories",
      "kitchen guides",
      "cooking tips",
      "healthy meal ideas",
      "recipe inspiration",
      "meal planning ideas",
      ...(label ? [label] : []),
    ],
  });
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const filters = await searchParams;
  const now = new Date();
  const dayLabel = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    timeZone: "Asia/Kolkata",
  }).format(now);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowLabel = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    timeZone: "Asia/Kolkata",
  }).format(tomorrow);
  const [articles, categories, tags, previewRecipes] = await getBlogPageData(
    filters.k,
    filters.type,
  );

  const lead = articles[0];
  const supporting = articles.slice(1, 3);
  const readingList = articles.slice(3);
  const filterLabel =
    filters.type === "category"
      ? categories.find((category) => category.slug === filters.k)?.title
      : tags.find((tag) => tag.slug === filters.k)?.title;
  const queryString = new URLSearchParams();
  if (filters.k) queryString.set("k", filters.k);
  if (filters.type) queryString.set("type", filters.type);
  const blogPath = `/blog${queryString.size ? `?${queryString.toString()}` : ""}`;
  const listingSchema = itemListJsonLd(
    filterLabel
      ? `${filterLabel} food stories`
      : "Food stories from Kya Khayen",
    articles.map((article) => ({
      name: article.title,
      path: articleHref(article),
      image: article.imageUrl,
    })),
  );
  const breadcrumbSchema = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Food Stories", path: "/blog" },
    ...(filterLabel ? [{ name: filterLabel, path: blogPath }] : []),
  ]);

  return (
    <main className="relative min-h-screen overflow-x-clip bg-[#fbf6ed] pb-20 text-[#30251e] dark:bg-[#091712] dark:text-[#eef2ec]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd([listingSchema, breadcrumbSchema]),
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[620px] bg-[radial-gradient(circle_at_10%_12%,rgba(210,157,76,0.18),transparent_37%),radial-gradient(circle_at_88%_8%,rgba(187,57,43,0.10),transparent_32%)] dark:bg-[radial-gradient(circle_at_12%_8%,rgba(208,166,88,0.13),transparent_33%),radial-gradient(circle_at_90%_4%,rgba(178,60,43,0.16),transparent_27%)]" />
      <Container>
        <div className="relative mx-auto max-w-[1420px] pt-12 sm:pt-16 lg:pt-20">
          <header className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.29em] text-[#ae7d3c] dark:text-[#ddb366]">
                <BookOpen className="size-4" /> Kya Khayen journal
              </p>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[4.25rem]">
                Stories for a more delicious everyday table.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-[#766557] dark:text-[#aab8b0]">
                Original food ideas, practical kitchen wisdom and seasonal
                inspiration, written to help you decide what to cook next.
              </p>
            </div>

            <div className="rounded-[1.7rem] border border-[#eadcc6] bg-white/68 p-4 shadow-[0_22px_58px_-46px_rgba(53,35,19,0.6)] backdrop-blur dark:border-white/10 dark:bg-[#10241e]/82 sm:p-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-[#a77838] dark:text-[#d6aa60]">
                Explore by collection
              </p>
              <nav
                className="flex flex-wrap gap-2"
                aria-label="Article categories"
              >
                <Link
                  href="/blog"
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    !filters.k
                      ? "border-[#b83c2e] bg-[#b83c2e] text-white"
                      : "border-[#e5d5be] text-[#625347] hover:bg-[#f4e9d8] dark:border-white/12 dark:text-[#d4ded8] dark:hover:bg-white/7"
                  }`}
                >
                  All stories
                </Link>
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/blog?k=${category.slug}&type=category`}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      filters.type === "category" && filters.k === category.slug
                        ? "border-[#b83c2e] bg-[#b83c2e] text-white"
                        : "border-[#e5d5be] text-[#625347] hover:bg-[#f4e9d8] dark:border-white/12 dark:text-[#d4ded8] dark:hover:bg-white/7"
                    }`}
                  >
                    {category.title}
                  </Link>
                ))}
              </nav>
            </div>
          </header>

          {filterLabel && (
            <div className="mt-10 flex items-center justify-between gap-4 border-y border-[#eadcc6] py-5 dark:border-white/10">
              <p className="text-sm text-[#786658] dark:text-[#a9b8b0]">
                Showing{" "}
                <span className="font-semibold text-current">
                  {filterLabel}
                </span>{" "}
                stories
              </p>
              <Link
                href="/blog"
                className="text-sm font-semibold text-[#b83c2e] dark:text-[#e2b469]"
              >
                Clear filter
              </Link>
            </div>
          )}

          {!lead ? (
            <section className="mt-14 rounded-[2rem] border border-dashed border-[#ddc9a9] bg-white/55 px-6 py-20 text-center dark:border-white/12 dark:bg-[#10241e]">
              <Sparkles className="mx-auto size-7 text-[#b78440] dark:text-[#dbad63]" />
              <h2 className="mt-5 text-2xl font-semibold">
                No stories found here yet.
              </h2>
              <p className="mt-3 text-sm text-[#756457] dark:text-[#acb9b2]">
                Browse every story or try a different collection.
              </p>
              <Link
                href="/blog"
                className="mt-7 inline-flex rounded-full bg-[#b83c2e] px-6 py-3 text-sm font-semibold text-white"
              >
                View all stories
              </Link>
            </section>
          ) : (
            <>
              <section className="mt-12 grid gap-5 lg:grid-cols-[1.18fr_0.82fr]">
                <Link
                  href={articleHref(lead)}
                  className="group relative min-h-[500px] overflow-hidden rounded-[2rem] lg:min-h-[620px]"
                >
                  {lead.imageUrl ? (
                    <Image
                      src={lead.imageUrl}
                      alt={lead.title}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 58vw"
                      className="object-cover transition duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#d4bc8b] to-[#27473b]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#17150f]/92 via-[#17150f]/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-9">
                    <StoryMeta story={lead} />
                    <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">
                      {lead.title}
                    </h2>
                    <p className="mt-4 max-w-xl text-sm leading-7 text-white/76 sm:text-base">
                      {lead.metaDescription}
                    </p>
                    <div className="mt-6 flex items-center gap-4 text-sm text-white/72">
                      <span>{formatArticleDate(lead.updatedAt)}</span>
                      <span>{articleReadMinutes()} min read</span>
                      <ArrowRight className="size-4 text-white transition group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>

                <div className="flex flex-col gap-5">
                  {supporting.map((story) => (
                    <div key={story.id} className="flex-1">
                      <EditorialStoryRow story={story} />
                    </div>
                  ))}
                  <aside className="rounded-[1.45rem] bg-[#17382d] p-6 text-[#f3f1e9] dark:bg-[#152f27]">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#deb56e]">
                      Popular themes
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Link
                          key={tag.id}
                          href={`/blog?k=${tag.slug}&type=tag`}
                          className="rounded-full border border-white/12 px-3 py-2 text-xs text-white/82 transition hover:bg-white/10"
                        >
                          {tag.title}
                        </Link>
                      ))}
                    </div>
                  </aside>
                </div>
              </section>

              {readingList.length > 0 && (
                <section className="mt-16 grid gap-9 lg:grid-cols-[0.74fr_1.26fr]">
                  <div className="space-y-6 lg:sticky lg:top-28 lg:self-start">
                    <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#a77838] dark:text-[#d6aa60]">
                      Read next
                    </p>
                    <h2 className="mt-4 text-3xl font-semibold leading-tight">
                      More ideas for your kitchen rhythm
                    </h2>
                    <p className="mt-4 text-sm leading-7 text-[#756457] dark:text-[#aab8b0]">
                      Save a useful method, discover a seasonal combination or
                      find one small change for tonight&apos;s table.
                    </p>
                    <SmartBmiCta variant="sidebar" />
                    <JournalDayBoard
                      recipes={previewRecipes}
                      fallbackDayLabel={dayLabel}
                      fallbackTomorrowLabel={tomorrowLabel}
                    />
                    <div className="rounded-[1.5rem] border border-[#eadcc6] bg-white/70 p-5 dark:border-white/10 dark:bg-[#10241e]">
                      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#a77838] dark:text-[#d6aa60]">
                        <ChefHat className="size-4" /> Browse your way
                      </p>
                      <div className="mt-4 space-y-2">
                        {categories.slice(0, 5).map((category) => (
                          <Link
                            key={category.id}
                            href={`/blog?k=${category.slug}&type=category`}
                            className="flex items-center justify-between rounded-xl border border-transparent px-3 py-3 text-sm text-[#665447] transition hover:border-[#ead5b5] hover:bg-[#faf0df] dark:text-[#d1dcd6] dark:hover:border-white/10 dark:hover:bg-white/[0.05]"
                          >
                            <span>{category.title}</span>
                            <span className="text-xs text-[#a88757]">
                              {category._count.PostCategory}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-[1.5rem] border border-[#eadcc6] bg-white/70 p-5 dark:border-white/10 dark:bg-[#10241e]">
                      <p className="text-lg font-semibold">
                        Make it your table.
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#756457] dark:text-[#aab8b0]">
                        Turn recipe inspiration into a meal plan built from your
                        everyday choices.
                      </p>
                      <div className="mt-5">
                        <HomeMealPlanAction variant="article" />
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-5 md:grid-cols-2">
                    {readingList.map((story) => (
                      <EditorialMiniStory key={story.id} story={story} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </Container>
    </main>
  );
}
