import type { Metadata } from "next";
import { ArrowRight, BarChart3, CheckCircle2, CookingPot, ListChecks } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import Container from "@/components/container";
import SmartBmiCta from "@/components/sections/bmi-tool/smart-bmi-cta";
import FoodCompareTool from "@/components/sections/food-compare/food-compare-tool";
import {
  buildFoodComparison,
  fetchFoodCompareSuggestions,
  fetchPopularFoodComparePairs,
} from "@/lib/food-compare";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  buildSeoMetadata,
  jsonLd,
} from "@/lib/seo";

type FoodCompareSearchParams = Promise<Record<string, string | string[] | undefined>>;

const pagePath = "/tools/smart-food-compare";
const pageTitle = "Smart Food Compare";
const pageDescription =
  "Use Smart Food Compare to compare Indian foods and recipes by calories, protein, fiber, fat, sodium, cooking time, and clear reasons using Kya Khayen recipes.";

const faqs = [
  {
    question: "Can I compare Indian foods like poha vs upma?",
    answer:
      "Yes. You can compare available Kya Khayen recipes such as poha vs upma, roti vs rice, samosa vs dhokla, paneer vs tofu, and more.",
  },
  {
    question: "Does it compare calories and protein?",
    answer:
      "Yes. The result shows calories, protein, fiber, carbs, fat, sodium, and cooking time per eating portion.",
  },
  {
    question: "What does the result show?",
    answer:
      "It shows the better pick, simple reasons, food notes, and side-by-side numbers per eating portion.",
  },
  {
    question: "Are the numbers exact?",
    answer:
      "Numbers are approximate because ingredients, portions, and cooking methods can vary from kitchen to kitchen.",
  },
  {
    question: "Why do suggestions change after I pick the first food?",
    answer:
      "The second search gives closer alternatives based on recipe type, meal slot, cuisine, and common food choices.",
  },
  {
    question: "Can I open a ready-made comparison from a recipe page?",
    answer:
      "Yes. Some recipe pages show a matching food pair so you can open the comparison without searching again.",
  },
  {
    question: "What does the estimated price mean?",
    answer:
      "It is an approximate recipe cost based on ingredient price data. It is meant as a quick idea, not a fixed market price.",
  },
  {
    question: "Can I compare foods by cuisine?",
    answer:
      "Recipe cards can show cuisine when available, and suggestions try to keep comparisons close when cuisine and recipe type match.",
  },
];

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = buildSeoMetadata({
  title: `${pageTitle}: Calories, Protein, Fiber & Time | Kya Khayen`,
  description: pageDescription,
  path: pagePath,
  image: "/meta-images/home-og-2026.png",
  imageAlt: "Kya Khayen food comparison tool",
  keywords: [
    "smart food compare",
    "smart food comparison",
    "food comparison tool",
    "food compare tool India",
    "compare foods",
    "compare Indian foods",
    "food nutrition comparison",
    "Indian food calories comparison",
    "roti vs rice",
    "poha vs upma calories",
    "paneer vs tofu",
    "samosa vs dhokla",
    "chole bhature vs poori",
    "poha vs upma",
    "Indian food comparison",
    "compare calories protein fiber",
    "which food is better",
  ],
});

function singleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function pairHref(leftId: string, rightId: string) {
  const params = new URLSearchParams({ leftId, rightId });
  return `/tools/smart-food-compare?${params.toString()}#tool`;
}

function formatRecipeCost(value: number | null | undefined) {
  return value ? `Approx Rs ${value}` : null;
}

function foodMeta(food: { category: string | null; cuisine: string | null; estimatedCostInr: number | null }) {
  return [food.cuisine ?? food.category, formatRecipeCost(food.estimatedCostInr)]
    .filter(Boolean)
    .join(" · ");
}

function webApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: pageTitle,
    url: absoluteUrl(pagePath),
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    description: pageDescription,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
  };
}

function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export default async function FoodComparePage({
  searchParams,
}: {
  searchParams: FoodCompareSearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const leftId = singleParam(resolvedSearchParams.leftId);
  const rightId = singleParam(resolvedSearchParams.rightId);
  const leftValue = singleParam(resolvedSearchParams.left);
  const rightValue = singleParam(resolvedSearchParams.right);
  const hasFoodPair = Boolean((leftId || leftValue) && (rightId || rightValue));
  const initialResult = hasFoodPair
    ? await buildFoodComparison({
        leftId,
        rightId,
        leftValue,
        rightValue,
        goal: "balanced",
        grams: singleParam(resolvedSearchParams.grams),
      })
    : null;
  const initialSuggestions = await fetchFoodCompareSuggestions({ limit: 18 });
  const popularPairs = await fetchPopularFoodComparePairs();
  const toolKey = initialResult
    ? `${initialResult.left.id}-${initialResult.right.id}`
    : "empty";
  const schema = [
    webApplicationJsonLd(),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Tools", path: "/tools" },
      { name: pageTitle, path: pagePath },
    ]),
    faqJsonLd(),
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
          <span className="text-primary">{pageTitle}</span>
        </nav>

        <section className="mb-6 max-w-4xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#b9dacb] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#0f766e] shadow-sm dark:border-white/10 dark:bg-[#123b36] dark:text-[#5eead4]">
            <BarChart3 className="size-3.5" />
            Smart food decision
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-[#2e241c] dark:text-white sm:text-5xl">
            Smart Food Compare
          </h1>
        </section>

        <FoodCompareTool
          key={toolKey}
          initialResult={initialResult}
          initialSuggestions={initialSuggestions}
        />

        <SmartBmiCta className="mt-12" />

        {popularPairs.length > 0 && (
          <section className="mt-12">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0f766e] dark:text-[#5eead4]">
                  Popular food comparisons
                </p>
                <h2 className="mt-2 text-3xl font-semibold leading-tight text-[#2e241c] dark:text-white">
                  Compare recipes people usually choose between.
                </h2>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {popularPairs.map((pair) => (
                <Link
                  key={`${pair.left.id}-${pair.right.id}`}
                  href={pairHref(pair.left.id, pair.right.id)}
                  className="group rounded-lg border border-[#ead9c3] bg-white p-4 transition hover:border-[#0f766e]/50 hover:shadow-[0_22px_50px_-36px_rgba(15,37,29,0.45)] dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-[#5eead4]/45"
                >
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <div className="min-w-0">
                      <span className="relative mx-auto block size-16 overflow-hidden rounded-xl bg-[#eef1e8]">
                        {pair.left.imageUrl ? (
                          <Image
                            src={pair.left.imageUrl}
                            alt={pair.left.label}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        ) : null}
                      </span>
                      <span className="mt-2 block truncate text-center text-sm font-semibold text-[#2e241c] dark:text-white">
                        {pair.left.label}
                      </span>
                      {foodMeta(pair.left) && (
                        <span className="mt-1 block truncate text-center text-xs font-medium text-[#806c5d] dark:text-white/58">
                          {foodMeta(pair.left)}
                        </span>
                      )}
                    </div>
                    <span className="rounded-full bg-[#173629] px-2 py-1 text-xs font-semibold text-white dark:bg-[#f4b04d] dark:text-[#20150b]">
                      vs
                    </span>
                    <div className="min-w-0">
                      <span className="relative mx-auto block size-16 overflow-hidden rounded-xl bg-[#eef1e8]">
                        {pair.right.imageUrl ? (
                          <Image
                            src={pair.right.imageUrl}
                            alt={pair.right.label}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        ) : null}
                      </span>
                      <span className="mt-2 block truncate text-center text-sm font-semibold text-[#2e241c] dark:text-white">
                        {pair.right.label}
                      </span>
                      {foodMeta(pair.right) && (
                        <span className="mt-1 block truncate text-center text-xs font-medium text-[#806c5d] dark:text-white/58">
                          {foodMeta(pair.right)}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-1 text-center text-sm font-semibold text-[#0f766e] dark:text-[#5eead4]">
                    {pair.label}
                  </p>
                  <span className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold text-[#7b6757] transition group-hover:text-[#0f766e] dark:text-white/58 dark:group-hover:text-[#5eead4]">
                    Open comparison <ArrowRight className="size-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-12 grid gap-4 lg:grid-cols-3">
          {[
            {
              icon: CookingPot,
              title: "Real food choices",
              body: "Search actual recipes and dishes from Kya Khayen.",
            },
            {
              icon: CheckCircle2,
              title: "Clear better pick",
              body: "The result explains which food fits better with short, practical reasons.",
            },
            {
              icon: ListChecks,
              title: "Easy to scan",
              body: "Calories, protein, fiber, time, and food notes stay in one clean view.",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="rounded-lg border border-[#d9e4d9] bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <Icon className="mb-4 size-5 text-[#0f766e] dark:text-[#5eead4]" />
                <h2 className="text-base font-semibold text-[#2e241c] dark:text-white">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-7 text-[#756354] dark:text-white/64">
                  {item.body}
                </p>
              </article>
            );
          })}
        </section>

        <section className="mt-12">
          <div className="mb-5 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0f766e] dark:text-[#5eead4]">
              Questions
            </p>
            <h2 className="mt-2 text-3xl font-semibold leading-tight text-[#2e241c] dark:text-white">
              Simple answers before you choose.
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {faqs.map((item) => (
              <article
                key={item.question}
                className="rounded-lg border border-[#ead9c3] bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]"
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
