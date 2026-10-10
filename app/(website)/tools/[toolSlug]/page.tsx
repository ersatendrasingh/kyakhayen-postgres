import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import Container from "@/components/container";
import SmartBmiCta from "@/components/sections/bmi-tool/smart-bmi-cta";
import SingleToolExperience from "@/components/sections/situation-tools/single-tool-experience";
import {
  getInteractiveToolPage,
  interactiveToolPages,
} from "@/components/sections/situation-tools/tool-page-config";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  buildSeoMetadata,
  jsonLd,
} from "@/lib/seo";

type ToolPageParams = Promise<{ toolSlug: string }>;
type ToolPageSearchParams = Promise<Record<string, string | string[] | undefined>>;

export const revalidate = 900;

export function generateStaticParams() {
  return interactiveToolPages.map((tool) => ({ toolSlug: tool.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: ToolPageParams;
}): Promise<Metadata> {
  const { toolSlug } = await params;
  const tool = getInteractiveToolPage(toolSlug);

  if (!tool) return {};

  return buildSeoMetadata({
    title: `${tool.seoTitle} | Kya Khayen`,
    description: tool.description,
    path: tool.href,
    image: "/meta-images/home-og-2026.png",
    imageAlt: tool.title,
    keywords: tool.keywords,
  });
}

function webApplicationJsonLd(tool: NonNullable<ReturnType<typeof getInteractiveToolPage>>) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.title,
    url: absoluteUrl(tool.href),
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    description: tool.description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
  };
}

function faqJsonLd(tool: NonNullable<ReturnType<typeof getInteractiveToolPage>>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: tool.faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

function singleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function defaultToolState(
  tool: NonNullable<ReturnType<typeof getInteractiveToolPage>>,
  searchParams: Awaited<ToolPageSearchParams>,
) {
  const mealFocus = singleValue(searchParams.mealFocus);
  const guestPlan = singleValue(searchParams.guestPlan);
  const foodType = singleValue(searchParams.foodType);
  const budget = Number(singleValue(searchParams.budget));
  const guestCount = Number(singleValue(searchParams.guestCount));

  return {
    mealFocus:
      mealFocus && ["full-day", "breakfast", "lunch", "dinner"].includes(mealFocus)
        ? mealFocus
        : tool.defaultMealFocus,
    guestPlan:
      guestPlan && ["full-meal", "snacks", "quick"].includes(guestPlan)
        ? guestPlan
        : tool.defaultGuestPlan,
    guestCount:
      Number.isFinite(guestCount) && guestCount > 0 ? guestCount : tool.defaultGuestCount,
    budget:
      Number.isFinite(budget) && budget > 0 ? budget : tool.defaultBudget,
    foodType:
      foodType && ["veg", "non-veg", "any"].includes(foodType)
        ? foodType
        : tool.defaultFoodType,
  };
}

function toolStateHref(
  tool: NonNullable<ReturnType<typeof getInteractiveToolPage>>,
  params: Record<string, string | number>,
) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => search.set(key, String(value)));

  return `${tool.href}?${search.toString()}#tool`;
}

function heroActions(tool: NonNullable<ReturnType<typeof getInteractiveToolPage>>) {
  if (tool.mode === "daily") {
    return [
      { label: "Breakfast", href: toolStateHref(tool, { mealFocus: "breakfast" }) },
      { label: "Lunch", href: toolStateHref(tool, { mealFocus: "lunch" }) },
      { label: "Dinner", href: toolStateHref(tool, { mealFocus: "dinner" }) },
    ];
  }

  if (tool.mode === "guests") {
    return [
      { label: "Full meal", href: toolStateHref(tool, { guestPlan: "full-meal", guestCount: 5 }) },
      { label: "Tea snacks", href: toolStateHref(tool, { guestPlan: "snacks", guestCount: 5 }) },
      { label: "Quick serve", href: toolStateHref(tool, { guestPlan: "quick", guestCount: 5 }) },
    ];
  }

  if (tool.mode === "budget") {
    return [
      { label: "Rs 75", href: toolStateHref(tool, { budget: 75 }) },
      { label: "Rs 150", href: toolStateHref(tool, { budget: 150 }) },
      { label: "Rs 250", href: toolStateHref(tool, { budget: 250 }) },
    ];
  }

  return [
    { label: "Veg ideas", href: toolStateHref(tool, { foodType: "veg" }) },
    { label: "Non veg", href: toolStateHref(tool, { foodType: "non-veg" }) },
    { label: "Any food", href: toolStateHref(tool, { foodType: "any" }) },
  ];
}

const toolHeroImages = {
  daily: {
    src: "/assets/images/tools/daily-menu-hero.png",
    alt: "Indian woman planning daily meals with dal, rice, sabzi, roti, and chutney.",
  },
  guests: {
    src: "/assets/images/tools/guest-menu-hero.png",
    alt: "Indian woman arranging a guest menu with snacks, paneer, pulao, salad, and sweets.",
  },
  budget: {
    src: "/assets/images/tools/budget-meal-hero.png",
    alt: "Indian woman preparing simple family meals with dal, rice, roti, vegetables, and lentils.",
  },
  moms: {
    src: "/assets/images/tools/kids-meal-hero.png",
    alt: "Indian mother preparing a colorful kids lunchbox with rolls, fruit, sandwiches, and chutney.",
  },
} satisfies Record<
  NonNullable<ReturnType<typeof getInteractiveToolPage>>["mode"],
  { src: string; alt: string }
>;

function ToolHeroVisual({
  tool,
}: {
  tool: NonNullable<ReturnType<typeof getInteractiveToolPage>>;
}) {
  const image = toolHeroImages[tool.mode];

  return (
    <div className="relative h-full min-h-[25rem] overflow-hidden rounded-[1.35rem] border border-[#ead9c3] bg-[#f3e4ce] shadow-[0_24px_70px_-52px_rgba(63,38,21,0.72)] dark:border-white/10">
      <Image
        src={image.src}
        alt={image.alt}
        fill
        priority
        sizes="(min-width: 1280px) 42vw, (min-width: 1024px) 48vw, 100vw"
        className="object-cover"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#201713]/35 to-transparent" />
    </div>
  );
}

export default async function ToolDetailPage({
  params,
  searchParams,
}: {
  params: ToolPageParams;
  searchParams: ToolPageSearchParams;
}) {
  const { toolSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const tool = getInteractiveToolPage(toolSlug);

  if (!tool) notFound();

  const defaultState = defaultToolState(tool, resolvedSearchParams);
  const actions = heroActions(tool);

  const schema = [
    webApplicationJsonLd(tool),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Tools", path: "/tools" },
      { name: tool.title, path: tool.href },
    ]),
    faqJsonLd(tool),
  ];

  return (
    <main className="home-surface min-h-screen pb-16 pt-8 sm:pt-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(schema) }}
      />
      <Container>
        <nav className="mb-5 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#8b735f] dark:text-white/60">
          <Link href="/" className="hover:text-primary">
            Home
          </Link>
          <span>/</span>
          <Link href="/tools" className="hover:text-primary">
            Tools
          </Link>
          <span>/</span>
          <span className="text-primary">{tool.title}</span>
        </nav>

        <section className="mb-8 overflow-hidden rounded-[1.4rem] border border-[#ead9c3] bg-[#fffaf1] shadow-[0_28px_86px_-58px_rgba(63,38,21,0.72)] dark:border-white/10 dark:bg-white/[0.04]">
          <div className="grid gap-0 lg:grid-cols-[1.04fr_0.96fr]">
            <div className="p-6 sm:p-8 lg:p-10">
              <p className="mb-4 inline-flex rounded-full border border-[#ead9c3] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
                {tool.eyebrow}
              </p>
              <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-[#2e241c] dark:text-white sm:text-5xl">
                {tool.heroTitle}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[#756354] dark:text-white/64 sm:text-lg">
                {tool.heroLead}
              </p>

              <div className="mt-7">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#a17135] dark:text-[#efcb83]">
                  Choose a starting point
                </p>
                <div className="flex flex-wrap gap-2">
                  {actions.map((action) => (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#dfc6a8] bg-white px-4 py-2 text-sm font-semibold text-[#3a2b20] transition hover:border-primary hover:text-primary dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                    >
                      {action.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {tool.questionPrompts.slice(0, 3).map((prompt, index) => (
                  <Link
                    key={prompt}
                    href={actions[index % actions.length]?.href ?? `${tool.href}#tool`}
                    className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#efe4d2] px-3 py-2 text-xs font-semibold text-[#6d4f2e] transition hover:bg-[#e5d5bd] dark:bg-white/[0.08] dark:text-white/72"
                  >
                    <Search className="size-3.5 shrink-0" />
                    {prompt}
                  </Link>
                ))}
              </div>
            </div>
            <div className="bg-white/58 p-4 dark:bg-white/[0.03] sm:p-6 lg:p-8">
              <ToolHeroVisual tool={tool} />
            </div>
          </div>
        </section>

        <div id="tool" className="scroll-mt-28">
          <SingleToolExperience
            key={[
              tool.mode,
              defaultState.mealFocus,
              defaultState.guestPlan,
              defaultState.guestCount,
              defaultState.budget,
              defaultState.foodType,
            ].join("-")}
            activeKey={tool.mode}
            kicker={tool.eyebrow}
            intro={tool.intro}
            defaultMealFocus={defaultState.mealFocus}
            defaultGuestCount={defaultState.guestCount}
            defaultGuestPlan={defaultState.guestPlan}
            defaultBudget={defaultState.budget}
            defaultFoodType={defaultState.foodType}
          />
        </div>

        <SmartBmiCta className="mt-12" />

        <section className="mt-14 overflow-hidden rounded-[1.6rem] border border-[#ead9c3] bg-[#fffaf1] p-5 shadow-[0_24px_74px_-58px_rgba(63,38,21,0.64)] dark:border-white/10 dark:bg-white/[0.04] sm:p-7">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary dark:text-[#f2cf8b]">
                Useful starting points
              </p>
              <h2 className="mt-2 text-3xl font-semibold leading-tight text-[#2e241c] dark:text-white">
                Start from a real situation.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[#756354] dark:text-white/64">
              Open a ready intent, then change the filters inside the live tool.
              The cards below are shortcuts, not static content.
            </p>
          </div>

          <div className="grid gap-3 xl:grid-cols-[0.92fr_1.08fr]">
            <Link
              href={tool.featuredSearch.href}
              className="group relative min-h-[19rem] overflow-hidden rounded-[1.35rem] bg-[#201713] p-5 text-white shadow-[0_24px_64px_-48px_rgba(32,23,19,0.9)] sm:p-6"
            >
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_84%_16%,rgba(242,207,139,0.28),transparent_28%),radial-gradient(circle_at_10%_92%,rgba(217,168,88,0.2),transparent_30%)]" />
              <span className="relative z-10 flex min-h-full flex-col justify-between">
                <span>
                  <span className="inline-flex rounded-full border border-[#f2cf8b]/25 bg-[#f2cf8b]/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#f2cf8b]">
                    {tool.featuredSearch.eyebrow}
                  </span>
                  <span className="mt-5 block max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">
                    {tool.featuredSearch.title}
                  </span>
                  <span className="mt-4 block max-w-2xl text-sm leading-7 text-white/70">
                    {tool.featuredSearch.body}
                  </span>
                </span>

                <span className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <span className="flex flex-wrap gap-2">
                    {tool.featuredSearch.chips.slice(0, 3).map((chip) => (
                      <span
                        key={chip}
                        className="rounded-full border border-[#f2cf8b]/20 bg-white/8 px-3 py-2 text-xs font-semibold text-[#f7dfaa]"
                      >
                        {chip}
                      </span>
                    ))}
                  </span>
                  <span className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#f2cf8b] px-4 py-2 text-sm font-semibold text-[#201713] transition group-hover:bg-[#ffe2a2]">
                    {tool.featuredSearch.cta}
                    <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                  </span>
                </span>
              </span>
            </Link>

            <div className="grid gap-3 sm:grid-cols-2">
              {tool.readySearches.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group flex min-h-[9.5rem] flex-col justify-between rounded-[1.15rem] border border-[#ead9c3] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#d09b51] hover:shadow-lg hover:shadow-[#5c3219]/10 dark:border-white/10 dark:bg-white/[0.05]"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span>
                      <span className="inline-flex rounded-full bg-[#f1e4cf] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9b6b2f] dark:bg-[#f2cf8b]/12 dark:text-[#f2cf8b]">
                        {item.eyebrow}
                      </span>
                      <span className="mt-3 block text-xl font-semibold leading-7 text-[#2e241c] dark:text-white">
                        {item.title}
                      </span>
                    </span>
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#ead9c3] bg-white text-[#9b6b2f] transition group-hover:border-[#d09b51] dark:border-white/10 dark:bg-white/[0.06] dark:text-[#f2cf8b]">
                      <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </span>
                  <span className="mt-3 line-clamp-2 text-sm leading-7 text-[#756354] dark:text-white/64">
                    {item.body}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-16 rounded-[1.4rem] border border-[#ead9c3] bg-white p-5 dark:border-white/10 dark:bg-white/[0.04] sm:p-7">
          <div className="grid gap-7 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                Decision guide
              </p>
              <h2 className="mt-2 text-3xl font-semibold leading-tight text-[#2e241c] dark:text-white">
                {tool.howTo.title}
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#756354] dark:text-white/64">
                {tool.howTo.body}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {tool.howTo.chips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full bg-[#efe4d2] px-3 py-2 text-xs font-semibold text-[#6d4f2e] dark:bg-white/[0.08] dark:text-white/72"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              {tool.howTo.steps.map((item, index) => (
                <article
                  key={item.title}
                  className="grid gap-4 rounded-2xl bg-[#fffaf1] p-4 sm:grid-cols-[3.5rem_minmax(0,1fr)]"
                >
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-[#201713] text-base font-semibold text-white">
                    {index + 1}
                  </span>
                  <span>
                    <h2 className="text-base font-semibold leading-6 text-[#2e241c]">
                      {item.title}
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-[#756354]">
                      {item.body}
                    </p>
                  </span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-16">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                Search intent
              </p>
              <h2 className="mt-2 text-3xl font-semibold leading-tight text-[#2e241c] dark:text-white">
                Questions people actually search.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[#756354] dark:text-white/64">
              The page copy targets real user intent, while the live tool stays
              immediately usable above.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {tool.questionPrompts.map((prompt) => (
              <div
                key={prompt}
                className="flex min-h-[7rem] flex-col justify-between rounded-[1.1rem] border border-[#ead9c3] bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <Search className="size-5 text-primary" />
                <p className="mt-4 text-sm font-semibold leading-6 text-[#2e241c] dark:text-white">
                  {prompt}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-[1.4rem] bg-[#201713] p-5 text-white sm:p-7">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f2cf8b]">
                Best use cases
              </p>
              <h2 className="mt-2 text-3xl font-semibold leading-tight">
                Where this tool is genuinely useful.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-white/64">
              These points explain the product value without repeating the FAQ
              layout.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {tool.useCases.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/7 p-4"
              >
                <CheckCircle2 className="mb-3 size-5 text-[#f2cf8b]" />
                <h2 className="text-lg font-semibold text-white">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-7 text-white/64">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <div className="mb-5 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Questions
            </p>
            <h2 className="mt-2 text-3xl font-semibold leading-tight text-[#2e241c] dark:text-white">
              Helpful answers before the user starts cooking.
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {tool.faqs.map((item) => (
              <article
                key={item.question}
                className="rounded-[1.1rem] border border-[#ead9c3] bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <h2 className="text-base font-semibold leading-6 text-[#2e241c] dark:text-white">
                  {item.question}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#756354] dark:text-white/64">
                  {item.answer}
                </p>
              </article>
            ))}
          </div>
        </section>
      </Container>
    </main>
  );
}
