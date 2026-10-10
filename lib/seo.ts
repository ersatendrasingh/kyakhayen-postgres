import type { Metadata } from "next";

import { socialSameAs } from "@/lib/social-links";

export const SITE_NAME = "Kya Khayen";
export const SITE_TAGLINE = "Easy recipes, meal ideas, and weekly meal plans";
export const DEFAULT_SITE_URL = "https://www.kyakhayen.com";
export const DEFAULT_OG_IMAGE = "/meta-images/home-og-2026.png";

const INTERNAL_SEO_COPY_PATTERNS = [
  /\bseo\s*[- ]?\s*friendly\b/i,
  /\bseo\s+optimized\b/i,
  /\bsearch\s+engine\s+optimized\b/i,
  /\bsearch\s+engine\s+friendly\b/i,
  /\busers?\s+searching\b/i,
  /\bpeople\s+search(?:ing)?\b/i,
  /\bsearch\s+terms?\b/i,
  /\brank(?:s|ing)?\s+for\b/i,
  /\bpage\s+(?:rank|stronger|strong)\b/i,
  /\bdatabase\s+entry\b/i,
  /\bkeyword\s+stuffing\b/i,
];

type SeoMetadataInput = {
  title: string;
  description: string;
  path?: string;
  image?: string | null;
  imageAlt?: string;
  type?: "website" | "article";
  noIndex?: boolean;
  keywords?: string[];
  authors?: NonNullable<Metadata["authors"]>;
  publishedTime?: Date | string | null;
  modifiedTime?: Date | string | null;
};

type BreadcrumbItem = {
  name: string;
  path: string;
};

type ItemListEntry = {
  name: string;
  path: string;
  image?: string | null;
};

function isLocalhost(url: URL) {
  return ["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(url.hostname);
}

export function getSiteUrl() {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || DEFAULT_SITE_URL;

  try {
    const parsed = new URL(configured);
    return isLocalhost(parsed) ? DEFAULT_SITE_URL : parsed.origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath === "/" ? "" : normalizedPath}`;
}

export function normalizePathSegment(value?: string | null) {
  return (value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function contentHref(content: { slug: string; metaSlug?: string | null }) {
  const slug = normalizePathSegment(content.slug);
  const metaSlug = normalizePathSegment(content.metaSlug);

  if (!metaSlug || metaSlug === slug) return `/${slug}`;

  const suffix = metaSlug.startsWith(`${slug}-`)
    ? metaSlug.slice(slug.length + 1)
    : metaSlug;

  return suffix ? `/${slug}-${suffix}` : `/${slug}`;
}

export function stripHtml(value?: string | null) {
  return (value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncateText(value: string, maxLength = 158) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;

  const truncated = clean.slice(0, maxLength + 1);
  const lastSpace = truncated.lastIndexOf(" ");
  return `${truncated.slice(0, lastSpace > 70 ? lastSpace : maxLength).trim()}...`;
}

export function hasInternalSeoCopy(value?: string | null) {
  const clean = stripHtml(value);
  return Boolean(clean && INTERNAL_SEO_COPY_PATTERNS.some((pattern) => pattern.test(clean)));
}

function publicSeoText(value?: string | null) {
  const clean = stripHtml(value);
  return clean && !hasInternalSeoCopy(clean) ? clean : "";
}

export function seoTitle(
  preferred?: string | null,
  fallback?: string | null,
  maxLength = 62,
) {
  const title = publicSeoText(preferred) || publicSeoText(fallback) || SITE_NAME;
  return truncateText(title, maxLength).replace(/\.\.\.$/, "").trim();
}

export function seoDescription(
  preferred?: string | null,
  fallback?: string | null,
  maxLength = 158,
) {
  return truncateText(publicSeoText(preferred) || publicSeoText(fallback) || SITE_TAGLINE, maxLength);
}

export function recipeHref(recipe: { slug: string; metaSlug?: string | null }) {
  return contentHref(recipe);
}

export function articleHref(article: { slug: string; metaSlug?: string | null }) {
  return contentHref(article);
}

export function indexRobots(): Metadata["robots"] {
  return {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  };
}

export function noIndexRobots(): Metadata["robots"] {
  return {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  };
}

export function buildSeoMetadata({
  title,
  description,
  path = "/",
  image = DEFAULT_OG_IMAGE,
  imageAlt = title,
  type = "website",
  noIndex = false,
  keywords,
  authors,
  publishedTime,
  modifiedTime,
}: SeoMetadataInput): Metadata {
  const canonical = absoluteUrl(path);
  const imageUrl = absoluteUrl(image || DEFAULT_OG_IMAGE);
  const cleanDescription = seoDescription(description);
  const openGraph: NonNullable<Metadata["openGraph"]> = {
    title,
    description: cleanDescription,
    url: canonical,
    siteName: SITE_NAME,
    locale: "en_US",
    type,
    images: [{ url: imageUrl, width: 1200, height: 630, alt: imageAlt }],
    ...(type === "article" && publishedTime
      ? { publishedTime: new Date(publishedTime).toISOString() }
      : {}),
    ...(type === "article" && modifiedTime
      ? { modifiedTime: new Date(modifiedTime).toISOString() }
      : {}),
    ...(type === "article" && authors
      ? {
          authors: Array.isArray(authors)
            ? authors.map((author) => author.name)
            : [authors.name],
        }
      : {}),
  };

  return {
    metadataBase: new URL(getSiteUrl()),
    title,
    description: cleanDescription,
    keywords,
    applicationName: SITE_NAME,
    authors,
    creator: Array.isArray(authors) ? authors[0]?.name || SITE_NAME : authors?.name || SITE_NAME,
    publisher: SITE_NAME,
    robots: noIndex ? noIndexRobots() : indexRobots(),
    alternates: { canonical },
    openGraph,
    twitter: {
      card: "summary_large_image",
      title,
      description: cleanDescription,
      images: [imageUrl],
    },
  };
}

export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: getSiteUrl(),
    logo: absoluteUrl("/pwa/icon-512.png"),
    sameAs: socialSameAs,
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: getSiteUrl(),
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/search")}?k={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function itemListJsonLd(name: string, items: ItemListEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(item.path),
      name: item.name,
      ...(item.image ? { image: absoluteUrl(item.image) } : {}),
    })),
  };
}
