import type { Post } from "@prisma/client";
import { articleHref as canonicalArticleHref } from "@/lib/seo";

type LinkableArticle = Pick<Post, "slug" | "metaSlug">;

export type ArticleSectionLink = {
  id: string;
  label: string;
};

export function articleHref(article: LinkableArticle) {
  return canonicalArticleHref(article);
}

export function formatArticleDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "long",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export function stripArticleHtml(value?: string | null) {
  return (value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function articleReadMinutes(content?: string | null) {
  const words = stripArticleHtml(content).split(/\s+/).filter(Boolean).length;
  return Math.max(3, Math.ceil(words / 190));
}

function anchorId(label: string, index: number) {
  const base = label
    .toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return base || `section-${index + 1}`;
}

export function prepareArticleBody(content?: string | null) {
  const headings: ArticleSectionLink[] = [];
  let index = 0;
  const html = (content || "").replace(
    /<h2(?:\s[^>]*)?>(.*?)<\/h2>/gi,
    (_match, rawLabel: string) => {
      const label = stripArticleHtml(rawLabel);
      const id = anchorId(label, index);
      headings.push({ id, label });
      index += 1;
      return `<h2 id="${id}">${rawLabel}</h2>`;
    },
  );

  return { html, headings };
}
