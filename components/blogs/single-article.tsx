import {
  ArrowLeft,
  ArrowRight,
  BookMarked,
  Clock3,
  Newspaper,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import ArticleComments from "@/components/blogs/article-comments";
import ArticleNotFound from "@/components/blogs/article-not-found";
import { EditorialStoryRow } from "@/components/blogs/editorial-story-card";
import ArticleSharing from "@/components/blogs/article-sharing";
import {
  articleHref,
  articleReadMinutes,
  formatArticleDate,
  prepareArticleBody,
  stripArticleHtml,
} from "@/components/blogs/editorial-utils";
import Container from "@/components/container";
import HomeMealPlanAction from "@/components/sections/home-meal-plan-action";
import { db } from "@/lib/db";
import { recipeCollectionHref } from "@/lib/recipe-collection-url";
import { publishedRecipeWhere } from "@/lib/recipe-publication";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  jsonLd,
  recipeHref,
  seoDescription,
} from "@/lib/seo";
import type { PostWithCategory } from "@/types/article";
import SmartBmiCta from "../sections/bmi-tool/smart-bmi-cta";

export default async function SingleArticle({
  article,
}: {
  article: PostWithCategory;
}) {
  if (!article) {
    return <ArticleNotFound />;
  }

  const categoryIds = article.PostCategory.map(({ categoryId }) => categoryId);
  const tagIds = article.PostTag.map(({ tagId }) => tagId);
  const related = await db.post.findMany({
    where: {
      id: { not: article.id },
      isPublished: true,
      OR: [
        { PostCategory: { some: { categoryId: { in: categoryIds } } } },
        { PostTag: { some: { tagId: { in: tagIds } } } },
      ],
    },
    include: {
      PostCategory: { include: { category: true } },
      PostTag: { include: { tag: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 3,
  });
  const recipeIdeas = await db.recipes.findMany({
    where: {
      ...publishedRecipeWhere(),
      imageUrl: { not: null },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      metaSlug: true,
      imageUrl: true,
    },
    orderBy: [
      { views: "desc" },
      { contentUpdatedAt: "desc" },
      { updatedAt: "desc" },
    ],
    take: 2,
  });
  const { html, headings } = prepareArticleBody(article.content);
  const category = article.PostCategory[0]?.category;
  const articleUrl = absoluteUrl(articleHref(article));
  const articleTags = new Set(article.PostTag.map(({ tag }) => tag.title));
  const editorialLinks = [
    articleTags.has("Summer")
      ? { href: recipeCollectionHref("summer"), label: "Summer recipes" }
      : null,
    articleTags.has("Breakfast")
      ? { href: recipeCollectionHref("breakfast"), label: "Breakfast ideas" }
      : null,
    articleTags.has("Plant-Based")
      ? { href: recipeCollectionHref("vegan"), label: "Plant-based dishes" }
      : null,
    articleTags.has("Weeknight Meals")
      ? { href: recipeCollectionHref("dinner"), label: "Weeknight dinners" }
      : null,
    { href: "/recipes", label: "All recipes" },
  ]
    .filter(
      (
        link,
      ): link is {
        href: string;
        label: string;
      } => Boolean(link),
    )
    .filter(
      (link, index, links) =>
        links.findIndex((entry) => entry.href === link.href) === index,
    )
    .slice(0, 3);

  const jsonLdData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${articleUrl}#article`,
    headline: article.title,
    description: seoDescription(article.metaDescription, article.content),
    image: article.imageUrl ? [absoluteUrl(article.imageUrl)] : undefined,
    datePublished: article.createdAt,
    dateModified: article.updatedAt,
    author: { "@type": "Organization", name: "Kya Khayen" },
    publisher: {
      "@type": "Organization",
      name: "Kya Khayen",
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/pwa/icon-512.png"),
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    articleSection: category?.title,
    keywords: [
      article.title,
      "cooking tips",
      "food guide",
      ...(category ? [category.title] : []),
      ...article.PostTag.map(({ tag }) => tag.title),
    ]
      .filter(Boolean)
      .join(", "),
    wordCount: stripArticleHtml(article.content).split(/\s+/).filter(Boolean)
      .length,
    timeRequired: `PT${articleReadMinutes(article.content)}M`,
  };
  const breadcrumbSchema = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Food Stories", path: "/blog" },
    ...(category
      ? [
          {
            name: category.title,
            path: `/blog?k=${category.slug}&type=category`,
          },
        ]
      : []),
    { name: article.title, path: articleHref(article) },
  ]);

  return (
    <main className="relative min-h-screen overflow-x-clip bg-[#fbf6ed] pb-20 text-[#30251e] dark:bg-[#091712] dark:text-[#eef2ec]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd([jsonLdData, breadcrumbSchema]),
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[720px] bg-[radial-gradient(circle_at_16%_12%,rgba(210,160,79,0.16),transparent_35%),radial-gradient(circle_at_86%_9%,rgba(184,59,44,0.11),transparent_29%)] dark:bg-[radial-gradient(circle_at_16%_12%,rgba(210,160,79,0.13),transparent_34%),radial-gradient(circle_at_86%_9%,rgba(184,59,44,0.15),transparent_30%)]" />
      <Container>
        <article className="relative mx-auto max-w-[1420px] pt-8 sm:pt-12">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-full border border-[#e4d3ba] bg-white/55 px-4 py-2.5 text-sm font-medium text-[#615143] transition hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-[#dce4df] dark:hover:bg-white/[0.08]"
          >
            <ArrowLeft className="size-4" /> Back to stories
          </Link>

          <header className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#a77838] dark:text-[#d7ad63]">
                {category && <span>{category.title}</span>}
                <span className="size-1 rounded-full bg-current opacity-50" />
                <span>{articleReadMinutes(article.content)} min read</span>
              </div>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.85rem]">
                {article.title}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-[#756457] dark:text-[#afbbb4]">
                {article.metaDescription}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-5 text-sm text-[#756457] dark:text-[#a8b6af]">
                <span className="font-semibold text-[#3c3027] dark:text-[#edf1eb]">
                  Kya Khayen Editorial
                </span>
                <span>{formatArticleDate(article.updatedAt)}</span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="size-4" />
                  {articleReadMinutes(article.content)} minutes
                </span>
              </div>
            </div>
            <div className="relative aspect-[1.27] overflow-hidden rounded-[2rem] border border-[#eadcc7] bg-[#f0e3cd] shadow-[0_34px_72px_-48px_rgba(47,31,19,0.6)] dark:border-white/10 dark:bg-[#11251f]">
              {article.imageUrl ? (
                <Image
                  src={article.imageUrl}
                  alt={article.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 54vw"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#e6ce9f] to-[#d9e3d2] dark:from-[#193a30] dark:to-[#12251f]" />
              )}
            </div>
          </header>

          <div className="mt-12 grid gap-8 lg:grid-cols-[235px_minmax(0,760px)_295px] lg:items-start">
            <aside className="hidden lg:sticky lg:top-28 lg:block">
              <div className="rounded-[1.45rem] border border-[#eadcc6] bg-[#fffdf9] p-5 dark:border-white/10 dark:bg-[#10241e]">
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#a77838] dark:text-[#d6aa60]">
                  <BookMarked className="size-4" /> In this article
                </p>
                <nav className="mt-5 space-y-1" aria-label="In this article">
                  {headings.map((heading, index) => (
                    <a
                      key={heading.id}
                      href={`#${heading.id}`}
                      className="block border-l border-[#e9dbc7] py-2 pl-4 text-sm leading-5 text-[#716053] transition hover:border-[#b83c2e] hover:text-[#b83c2e] dark:border-white/10 dark:text-[#afbbb4] dark:hover:border-[#d9ad63] dark:hover:text-[#e0b46c]"
                    >
                      <span className="mr-2 text-xs text-[#ad8a54]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {heading.label}
                    </a>
                  ))}
                </nav>
              </div>
              <div className="mt-5 rounded-[1.45rem] border border-[#eadcc6] bg-[#fffdf9] p-5 dark:border-white/10 dark:bg-[#10241e]">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a77838] dark:text-[#d6aa60]">
                  Story details
                </p>
                <dl className="mt-4 space-y-3 text-sm text-[#706053] dark:text-[#afbbb4]">
                  <div className="flex justify-between gap-3">
                    <dt>Reading time</dt>
                    <dd className="font-semibold">
                      {articleReadMinutes(article.content)} min
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>Published</dt>
                    <dd className="text-right font-semibold">
                      {formatArticleDate(article.updatedAt)}
                    </dd>
                  </div>
                </dl>
              </div>
              <HomeMealPlanAction variant="rail" />
            </aside>

            <div className="min-w-0">
              {headings.length > 0 && (
                <details className="mb-6 rounded-[1.35rem] border border-[#eadbc6] bg-[#fffdf9] p-5 dark:border-white/10 dark:bg-[#10241e] lg:hidden">
                  <summary className="cursor-pointer text-sm font-semibold text-[#44362c] dark:text-[#edf2ec]">
                    In this article
                  </summary>
                  <nav className="mt-4 space-y-2">
                    {headings.map((heading) => (
                      <a
                        key={heading.id}
                        href={`#${heading.id}`}
                        className="block text-sm text-[#716053] dark:text-[#b0beb7]"
                      >
                        {heading.label}
                      </a>
                    ))}
                  </nav>
                </details>
              )}

              <section className="overflow-hidden rounded-[1.7rem] border border-[#eadcc8] bg-[#fffdf9] px-5 py-7 shadow-sm dark:border-white/10 dark:bg-[#10241e] sm:px-9 sm:py-10">
                <div
                  className="editorial-body text-[16px] leading-8 text-[#57493e] dark:text-[#c3cec8] [&_a]:font-medium [&_a]:text-[#b83c2e] [&_a]:underline [&_a]:decoration-[#e1b47c] dark:[&_a]:text-[#dfb36c] [&_aside]:mb-9 [&_aside]:mt-9 [&_aside]:rounded-[1.25rem] [&_aside]:border [&_aside]:border-[#ead7b7] [&_aside]:bg-[#fcf3e2] [&_aside]:p-5 dark:[&_aside]:border-white/10 dark:[&_aside]:bg-[#173027] [&_aside_h3]:mb-2 [&_aside_h3]:font-semibold [&_aside_h3]:text-[#332820] dark:[&_aside_h3]:text-[#edf2ec] [&_em]:text-sm [&_em]:leading-7 [&_h2]:mb-4 [&_h2]:mt-11 [&_h2]:scroll-mt-32 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:leading-tight [&_h2]:text-[#30251e] dark:[&_h2]:text-[#edf2ec] [&_h2:first-child]:mt-0 [&_li]:mb-2 [&_p]:mb-6 [&_p:first-child]:text-lg [&_p:first-child]:leading-9 [&_ul]:mb-8 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6 [&_ul]:marker:text-[#b83c2e] dark:[&_ul]:marker:text-[#d8ac62]"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              </section>

              <section className="mt-6 overflow-hidden rounded-[1.55rem] border border-[#eadcc8] bg-[#17382d] p-6 text-white dark:border-white/10 sm:p-7">
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#e0b66c]">
                  <Sparkles className="size-4" /> Plan from this story
                </p>
                <h2 className="mt-4 max-w-lg text-2xl font-semibold leading-tight">
                  Turn today&apos;s inspiration into meals chosen for your
                  table.
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-white/68">
                  Pick the cuisines and everyday dishes you enjoy, then keep
                  your next meals organised in one place.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {editorialLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="rounded-full border border-white/12 bg-white/[0.07] px-3.5 py-2 text-xs text-white/78 transition hover:bg-white/[0.13] hover:text-white"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <HomeMealPlanAction variant="article" />
                  <Link
                    href="/recipes"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#f1d69d] transition hover:text-white"
                  >
                    Explore recipes <ArrowRight className="size-4" />
                  </Link>
                </div>
              </section>

              <section className="mt-6 rounded-[1.55rem] border border-[#eadcc8] bg-[#fffdf9] p-5 dark:border-white/10 dark:bg-[#10241e] sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a77838] dark:text-[#d6aa60]">
                  Share this story
                </p>
                <h2 className="mt-3 text-xl font-semibold">
                  Send a useful kitchen idea forward
                </h2>
                <div className="mt-5">
                  <ArticleSharing
                    url={articleUrl}
                    title={article.title}
                    description={stripArticleHtml(article.metaDescription)}
                  />
                </div>
              </section>
            </div>

            <aside className="space-y-5 lg:sticky lg:top-28">
              <div className="rounded-[1.45rem] border border-[#eadcc6] bg-[#fffdf9] p-5 dark:border-white/10 dark:bg-[#10241e]">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a77838] dark:text-[#d6aa60]">
                  Topics
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {article.PostTag.map(({ tag }) => (
                    <Link
                      key={tag.id}
                      href={`/blog?k=${tag.slug}&type=tag`}
                      className="rounded-full border border-[#e6d7c1] bg-[#fbf4e8] px-3 py-2 text-xs text-[#604f42] transition hover:border-[#d4b576] dark:border-white/10 dark:bg-[#153027] dark:text-[#d6ded9]"
                    >
                      {tag.title}
                    </Link>
                  ))}
                </div>
              </div>
              <SmartBmiCta variant="sidebar" />
              <div className="rounded-[1.45rem] bg-[#17382d] p-5 text-[#f2f1e8] dark:bg-[#152f27]">
                <ShieldCheck className="size-5 text-[#dcb267]" />
                <p className="mt-4 text-sm font-semibold">
                  Food inspiration only
                </p>
                <p className="mt-2 text-xs leading-6 text-white/68">
                  Kya Khayen shares everyday cooking ideas, not medical,
                  nutrition or allergy advice. Verify ingredients where safety
                  matters.
                </p>
              </div>
              {recipeIdeas.length > 0 && (
                <div className="rounded-[1.45rem] border border-[#eadcc6] bg-[#fffdf9] p-5 dark:border-white/10 dark:bg-[#10241e]">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a77838] dark:text-[#d6aa60]">
                    Cook next
                  </p>
                  <div className="mt-4 space-y-3">
                    {recipeIdeas.map((recipe) => (
                      <Link
                        key={recipe.id}
                        href={recipeHref(recipe)}
                        className="group flex items-center gap-3 rounded-xl border border-[#eee1cd] bg-[#fcf7ee] p-2 transition hover:border-[#dfc28f] dark:border-white/8 dark:bg-[#142e26]"
                      >
                        <div className="relative size-14 shrink-0 overflow-hidden rounded-lg">
                          <Image
                            src={recipe.imageUrl as string}
                            alt={recipe.title}
                            fill
                            sizes="56px"
                            className="object-cover transition duration-500 group-hover:scale-105"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-xs font-semibold leading-5 text-[#3b3028] dark:text-[#e7eee9]">
                            {recipe.title}
                          </p>
                          <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#a27439] dark:text-[#d5ab64]">
                            Open recipe <ArrowRight className="size-3" />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/recipes"
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#b83324] dark:text-[#dbaf67]"
                  >
                    Explore more recipes <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              )}
              {related.length > 0 && (
                <div className="rounded-[1.45rem] border border-[#eadcc6] bg-[#fffdf9] p-5 dark:border-white/10 dark:bg-[#10241e]">
                  <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#a77838] dark:text-[#d6aa60]">
                    <Newspaper className="size-4" /> Read next
                  </p>
                  <div className="mt-4 space-y-4">
                    {related.slice(0, 2).map((story) => (
                      <Link
                        key={story.id}
                        href={articleHref(story)}
                        className="group block border-b border-[#eadcc6] pb-4 last:border-0 last:pb-0 dark:border-white/10"
                      >
                        <p className="line-clamp-2 text-sm font-semibold leading-6 transition group-hover:text-[#b83c2e] dark:group-hover:text-[#deb16b]">
                          {story.title}
                        </p>
                        <p className="mt-2 text-xs text-[#817060] dark:text-[#99aaa2]">
                          {articleReadMinutes(story.content)} min read
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>

          <section className="mx-auto mt-10 max-w-[1120px] rounded-[1.8rem] border border-[#eadcc8] bg-[#fffdf9] p-5 shadow-sm dark:border-white/10 dark:bg-[#10241e] sm:p-8">
            <div className="mb-7 flex flex-col gap-3 border-b border-[#eadcc8] pb-6 dark:border-white/10 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a77838] dark:text-[#d6aa60]">
                  Conversation
                </p>
                <h2 className="mt-3 text-2xl font-semibold">
                  What did you try at home?
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-6 text-[#756457] dark:text-[#afbbb4]">
                Ask a cooking question or share a practical tip with fellow home
                cooks.
              </p>
            </div>
            <ArticleComments
              comments={article.articleComments}
              articleId={article.id}
            />
          </section>

          {related.length > 0 && (
            <section className="mt-16 border-t border-[#e8d9c3] pt-10 dark:border-white/10">
              <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#a77838] dark:text-[#d6aa60]">
                    Continue reading
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold">
                    Related food stories
                  </h2>
                </div>
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#b83c2e] dark:text-[#dfb269]"
                >
                  Explore the journal <ArrowRight className="size-4" />
                </Link>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                {related.map((story) => (
                  <EditorialStoryRow key={story.id} story={story} compact />
                ))}
              </div>
            </section>
          )}
        </article>
      </Container>
    </main>
  );
}
