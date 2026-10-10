import type { Metadata } from "next";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Heart,
  HeartPulse,
  IndianRupee,
  Refrigerator,
  Scale,
  Search,
  Sparkles,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import Container from "@/components/container";
import { toolPages, type ToolPageConfig } from "@/components/sections/situation-tools/tool-page-config";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  buildSeoMetadata,
  itemListJsonLd,
  jsonLd,
} from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Smart Indian Cooking Tools: Recipe Finder, Food Compare & Meal Planner",
  description:
    "Open Smart Recipe Finder, Smart Food Compare, Smart Daily Menu, Smart Budget Meals, Smart Guest Menu, and Smart Kids Meals for Indian food decisions.",
  path: "/tools",
  image: "/meta-images/home-og-2026.png",
  imageAlt: "Kya Khayen cooking tools",
  keywords: [
    "smart cooking tools",
    "smart recipe finder",
    "smart food compare",
    "Indian cooking tools",
    "recipe finder by ingredients",
    "what to cook today",
    "Indian meal planner",
    "food comparison tool",
    "compare foods",
    "budget meal planner India",
    "guest menu ideas",
    "kids meal ideas",
    "recipes with ingredients at home",
  ],
});

const iconMap = {
  ingredients: Refrigerator,
  daily: CalendarDays,
  guests: UsersRound,
  budget: IndianRupee,
  moms: Heart,
} satisfies Record<ToolPageConfig["mode"], typeof Refrigerator>;

const visualMap = {
  ingredients: {
    image: "/assets/images/tools/ingredient-finder-hero.png",
    accent: "from-[#21382e]/92 via-[#21382e]/30",
    label: "Cook with what you have",
  },
  daily: {
    image: "/assets/images/tools/daily-menu-hero.png",
    accent: "from-[#43261a]/92 via-[#43261a]/24",
    label: "Breakfast, lunch, dinner",
  },
  budget: {
    image: "/assets/images/tools/budget-meal-hero.png",
    accent: "from-[#173629]/92 via-[#173629]/24",
    label: "Simple meals under budget",
  },
  guests: {
    image: "/assets/images/tools/guest-menu-hero.png",
    accent: "from-[#3b241d]/92 via-[#3b241d]/20",
    label: "Plan for visitors",
  },
  moms: {
    image: "/assets/images/tools/kids-meal-hero.png",
    accent: "from-[#4a2634]/92 via-[#4a2634]/22",
    label: "Family-friendly food",
  },
} satisfies Record<
  ToolPageConfig["mode"],
  { image: string; accent: string; label: string }
>;

const compareTool = {
  href: "/tools/smart-food-compare",
  title: "Smart Food Compare",
  shortTitle: "Food Compare",
  eyebrow: "Smart comparison",
  description:
    "Compare two dishes by calories, protein, fiber, cooking time, and clear reasons for the better choice.",
  highlights: ["Calories", "Protein", "Time"],
};

const compareVisual = {
  image: "/assets/images/tools/food-compare-hero.png",
  accent: "from-[#173629]/92 via-[#173629]/24",
  label: "Compare before choosing",
};

const bmiTool = {
  href: "/tools/smart-bmi-food-guide",
  title: "Smart BMI & Food Guide",
  shortTitle: "BMI Food Guide",
  eyebrow: "Wellness tool",
  description:
    "Calculate BMI, switch Indian/South Asian range, get healthy weight range, roti/rice portions, weekly check-ins, and recipe ideas.",
  highlights: ["BMI", "Roti/rice", "Recipes"],
};

const bmiVisual = {
  image: "/assets/images/auth-fruit-prep-hero.webp",
  accent: "from-[#3c231d]/90 via-[#3c231d]/24",
  label: "BMI plus food action",
};

const searchIntents = [
  {
    title: "BMI calculator with Indian food guide",
    href: "/tools/smart-bmi-food-guide#tool",
  },
  {
    title: "What can I cook with potato and onion?",
    href: "/tools/smart-recipe-finder?ingredients=potato%2Conion#fridge-tool",
  },
  {
    title: "What should I cook for dinner today?",
    href: "/tools/smart-daily-menu?mealFocus=dinner#tool",
  },
  {
    title: "Recipes under Rs 150",
    href: "/tools/smart-budget-meals?budget=150#tool",
  },
  {
    title: "Compare two foods",
    href: "/tools/smart-food-compare#tool",
  },
  {
    title: "Quick snacks for guests at home",
    href: "/tools/smart-guest-menu?guestPlan=snacks&guestCount=5#tool",
  },
  {
    title: "Kids lunch box ideas",
    href: "/tools/smart-kids-meals?foodType=veg#tool",
  },
  {
    title: "Bottle gourd dinner ideas",
    href: "/tools/smart-recipe-finder?ingredients=bottle%20gourd#fridge-tool",
  },
];

const hubFaqs = [
  {
    question: "What are Kya Khayen cooking tools?",
    answer:
      "Kya Khayen cooking tools help you start from a real kitchen situation, such as ingredients at home, today's meal, budget, guests, or family-friendly food ideas.",
  },
  {
    question: "Can I find recipes from ingredients I already have?",
    answer:
      "Yes. Open Smart Recipe Finder, add one or more ingredients from your kitchen, and browse matching recipe cards.",
  },
  {
    question: "Do these tools open full recipes?",
    answer:
      "Yes. Tool results link to full recipe pages where images, cooking time, ingredients, and steps are available.",
  },
  {
    question: "Are these tools free to use?",
    answer:
      "The public cooking tools on this page are available to browse and use on Kya Khayen.",
  },
];

const schema = [
  breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Tools", path: "/tools" },
  ]),
  itemListJsonLd(
    "Kya Khayen smart Indian cooking tools",
    [
      ...toolPages.map((tool) => ({
        name: tool.title,
        path: tool.href,
        image: visualMap[tool.mode].image,
      })),
      {
        name: compareTool.title,
        path: compareTool.href,
        image: compareVisual.image,
      },
      {
        name: bmiTool.title,
        path: bmiTool.href,
        image: bmiVisual.image,
      },
    ],
  ),
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Smart Indian Cooking Tools",
    url: absoluteUrl("/tools"),
    description:
      "Smart Indian cooking tools for recipe ideas by ingredients, daily meals, budget meals, food comparison, guests, and family-friendly food.",
    hasPart: [
      ...toolPages.map((tool) => ({
        "@type": "WebApplication",
        name: tool.title,
        url: absoluteUrl(tool.href),
        applicationCategory: "LifestyleApplication",
        operatingSystem: "Web",
        description: tool.description,
      })),
      {
        "@type": "WebApplication",
        name: compareTool.title,
        url: absoluteUrl(compareTool.href),
        applicationCategory: "LifestyleApplication",
        operatingSystem: "Web",
        description: compareTool.description,
      },
      {
        "@type": "WebApplication",
        name: bmiTool.title,
        url: absoluteUrl(bmiTool.href),
        applicationCategory: "LifestyleApplication",
        operatingSystem: "Web",
        description: bmiTool.description,
      },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: hubFaqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  },
];

function ToolCard({
  tool,
  variant = "compact",
}: {
  tool: ToolPageConfig;
  variant?: "featured" | "compact";
}) {
  const Icon = iconMap[tool.mode];
  const visual = visualMap[tool.mode];
  const isFeatured = variant === "featured";

  return (
    <Link
      href={tool.href}
      className={[
        "group flex flex-col overflow-hidden border border-[#ead9c3] bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#d09b51] hover:shadow-xl hover:shadow-[#5c3219]/10 dark:border-white/10 dark:bg-white/[0.05]",
        isFeatured ? "rounded-[1.45rem]" : "rounded-[1.2rem]",
      ].join(" ")}
    >
      <span
        className={[
          "relative block overflow-hidden",
          isFeatured ? "h-72 sm:h-80 lg:h-[22rem]" : "h-44 sm:h-48",
        ].join(" ")}
      >
        <Image
          src={visual.image}
          alt=""
          fill
          sizes={
            isFeatured
              ? "(min-width: 1024px) 42vw, 100vw"
              : "(min-width: 1024px) 28vw, (min-width: 768px) 50vw, 100vw"
          }
          className="object-cover transition duration-700 group-hover:scale-105"
        />
        <span className={`absolute inset-0 bg-gradient-to-t ${visual.accent} to-transparent`} />
        <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-[#f2cf8b]/24 bg-[#201713]/72 px-3 py-1.5 text-xs font-semibold text-[#f2cf8b] backdrop-blur">
          <Icon className="size-3.5" />
          {visual.label}
        </span>
      </span>
      <span className={["flex flex-1 flex-col", isFeatured ? "p-6 sm:p-7" : "p-5"].join(" ")}>
        <span className="inline-flex rounded-full bg-[#f1e4cf] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9b6b2f] dark:bg-[#f2cf8b]/12 dark:text-[#f2cf8b]">
          {tool.eyebrow}
        </span>
        <span
          className={[
            "mt-3 block font-semibold leading-tight text-[#2e241c] dark:text-white",
            isFeatured ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl",
          ].join(" ")}
        >
          {tool.title}
        </span>
        <span
          className={[
            "mt-3 block text-[#756354] dark:text-white/64",
            isFeatured ? "text-base leading-8" : "text-sm leading-6",
          ].join(" ")}
        >
          {tool.description}
        </span>
        <span className="mt-5 flex flex-wrap gap-2">
          {(isFeatured ? tool.highlights : tool.highlights.slice(0, 2)).map((item) => (
            <span
              key={item}
              className="rounded-full border border-[#ead9c3] bg-[#fffaf1] px-3 py-1.5 text-xs font-semibold text-[#6d4f2e] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/72"
            >
              {item}
            </span>
          ))}
        </span>
        <span className="mt-auto pt-5 inline-flex items-center justify-between gap-3 text-sm font-semibold text-primary">
          <span>Open tool</span>
          <span className="inline-flex size-9 items-center justify-center rounded-full bg-[#f1e4cf] text-primary transition group-hover:translate-x-1 dark:bg-[#f2cf8b]/12 dark:text-[#f2cf8b]">
            <ArrowRight className="size-4" />
          </span>
        </span>
      </span>
    </Link>
  );
}

function CompareToolCard({
  variant = "compact",
}: {
  variant?: "featured" | "compact";
}) {
  const isFeatured = variant === "featured";

  return (
    <Link
      href={compareTool.href}
      className={[
        "group flex flex-col overflow-hidden border border-[#d9e4d9] bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#8fcabb] hover:shadow-xl hover:shadow-[#173629]/10 dark:border-white/10 dark:bg-white/[0.05]",
        isFeatured ? "rounded-[1.45rem]" : "rounded-[1.2rem]",
      ].join(" ")}
    >
      <span
        className={[
          "relative block overflow-hidden",
          isFeatured ? "h-72 sm:h-80 lg:h-[22rem]" : "h-44 sm:h-48",
        ].join(" ")}
      >
        <Image
          src={compareVisual.image}
          alt=""
          fill
          sizes={
            isFeatured
              ? "(min-width: 1024px) 42vw, 100vw"
              : "(min-width: 1024px) 28vw, (min-width: 768px) 50vw, 100vw"
          }
          className="object-cover transition duration-700 group-hover:scale-105"
        />
        <span className={`absolute inset-0 bg-gradient-to-t ${compareVisual.accent} to-transparent`} />
        <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-[#d6f3e8]/24 bg-[#173629]/76 px-3 py-1.5 text-xs font-semibold text-[#d6f3e8] backdrop-blur">
          <Scale className="size-3.5" />
          {compareVisual.label}
        </span>
      </span>
      <span className={["flex flex-1 flex-col", isFeatured ? "p-6 sm:p-7" : "p-5"].join(" ")}>
        <span className="inline-flex rounded-full bg-[#e7f5ef] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0f766e] dark:bg-[#d6f3e8]/12 dark:text-[#d6f3e8]">
          {compareTool.eyebrow}
        </span>
        <span
          className={[
            "mt-3 block font-semibold leading-tight text-[#2e241c] dark:text-white",
            isFeatured ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl",
          ].join(" ")}
        >
          {compareTool.title}
        </span>
        <span
          className={[
            "mt-3 block text-[#756354] dark:text-white/64",
            isFeatured ? "text-base leading-8" : "text-sm leading-6",
          ].join(" ")}
        >
          {compareTool.description}
        </span>
        <span className="mt-5 flex flex-wrap gap-2">
          {compareTool.highlights.map((item) => (
            <span
              key={item}
              className="rounded-full border border-[#cce6dc] bg-[#f7fbf5] px-3 py-1.5 text-xs font-semibold text-[#0f5f59] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/72"
            >
              {item}
            </span>
          ))}
        </span>
        <span className="mt-auto pt-5 inline-flex items-center justify-between gap-3 text-sm font-semibold text-[#0f766e]">
          <span>Open tool</span>
          <span className="inline-flex size-9 items-center justify-center rounded-full bg-[#e7f5ef] text-[#0f766e] transition group-hover:translate-x-1 dark:bg-[#d6f3e8]/12 dark:text-[#d6f3e8]">
            <ArrowRight className="size-4" />
          </span>
        </span>
      </span>
    </Link>
  );
}

function BmiToolCard({
  variant = "compact",
}: {
  variant?: "featured" | "compact";
}) {
  const isFeatured = variant === "featured";

  return (
    <Link
      href={bmiTool.href}
      className={[
        "group flex flex-col overflow-hidden border border-[#ead9c3] bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#c84737] hover:shadow-xl hover:shadow-[#5c3219]/10 dark:border-white/10 dark:bg-white/[0.05]",
        isFeatured ? "rounded-[1.45rem]" : "rounded-[1.2rem]",
      ].join(" ")}
    >
      <span
        className={[
          "relative block overflow-hidden",
          isFeatured ? "h-72 sm:h-80 lg:h-[22rem]" : "h-44 sm:h-48",
        ].join(" ")}
      >
        <Image
          src={bmiVisual.image}
          alt=""
          fill
          sizes={
            isFeatured
              ? "(min-width: 1024px) 42vw, 100vw"
              : "(min-width: 1024px) 28vw, (min-width: 768px) 50vw, 100vw"
          }
          className="object-cover transition duration-700 group-hover:scale-105"
        />
        <span className={`absolute inset-0 bg-gradient-to-t ${bmiVisual.accent} to-transparent`} />
        <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-[#f2cf8b]/24 bg-[#201713]/72 px-3 py-1.5 text-xs font-semibold text-[#f2cf8b] backdrop-blur">
          <HeartPulse className="size-3.5" />
          {bmiVisual.label}
        </span>
      </span>
      <span className={["flex flex-1 flex-col", isFeatured ? "p-6 sm:p-7" : "p-5"].join(" ")}>
        <span className="inline-flex rounded-full bg-[#f7e8df] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a04735] dark:bg-[#f2cf8b]/12 dark:text-[#f2cf8b]">
          {bmiTool.eyebrow}
        </span>
        <span
          className={[
            "mt-3 block font-semibold leading-tight text-[#2e241c] dark:text-white",
            isFeatured ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl",
          ].join(" ")}
        >
          {bmiTool.title}
        </span>
        <span
          className={[
            "mt-3 block text-[#756354] dark:text-white/64",
            isFeatured ? "text-base leading-8" : "text-sm leading-6",
          ].join(" ")}
        >
          {bmiTool.description}
        </span>
        <span className="mt-5 flex flex-wrap gap-2">
          {bmiTool.highlights.map((item) => (
            <span
              key={item}
              className="rounded-full border border-[#ead9c3] bg-[#fffaf1] px-3 py-1.5 text-xs font-semibold text-[#6d4f2e] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/72"
            >
              {item}
            </span>
          ))}
        </span>
        <span className="mt-auto pt-5 inline-flex items-center justify-between gap-3 text-sm font-semibold text-[#a04735]">
          <span>Open tool</span>
          <span className="inline-flex size-9 items-center justify-center rounded-full bg-[#f7e8df] text-[#a04735] transition group-hover:translate-x-1 dark:bg-[#f2cf8b]/12 dark:text-[#f2cf8b]">
            <ArrowRight className="size-4" />
          </span>
        </span>
      </span>
    </Link>
  );
}

export default function ToolsPage() {
  const primaryTools = toolPages.slice(0, 3);

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
          <span className="text-primary">Tools</span>
        </nav>

        <section className="overflow-hidden rounded-[1.7rem] border border-[#ead9c3] bg-[#fffaf1] shadow-[0_28px_86px_-58px_rgba(63,38,21,0.72)] dark:border-white/10 dark:bg-white/[0.04]">
          <div className="grid gap-0 lg:grid-cols-[0.98fr_1.02fr]">
            <div className="p-6 sm:p-8 lg:p-10">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#ead9c3] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
                <Sparkles className="size-3.5" />
                Cooking tools
              </p>
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-[#2e241c] dark:text-white sm:text-6xl">
                Choose the kitchen problem first.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[#756354] dark:text-white/64 sm:text-lg">
                Find recipes from ingredients, plan today&apos;s meals, cook
                within a budget, prepare for guests, or open family-friendly food
                ideas from one place.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/tools/smart-recipe-finder"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
                >
                  Start with ingredients <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/tools/smart-daily-menu"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#dfc6a8] bg-white px-5 py-3 text-sm font-semibold text-[#3a2b20] transition hover:border-primary hover:text-primary dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                >
                  Plan today&apos;s food
                </Link>
              </div>
            </div>

            <div className="grid gap-3 border-t border-[#ead9c3] bg-white/50 p-4 dark:border-white/10 dark:bg-white/[0.03] sm:grid-cols-2 sm:p-5 lg:border-l lg:border-t-0">
              {primaryTools.map((tool, index) => {
                const visual = visualMap[tool.mode];
                return (
                  <Link
                    key={tool.slug}
                    href={tool.href}
                    className={[
                      "group relative min-h-[14rem] overflow-hidden rounded-[1.2rem] bg-[#201713] p-4 text-white",
                      index === 0 ? "sm:col-span-2" : "",
                    ].join(" ")}
                  >
                    <Image
                      src={visual.image}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 24vw, 100vw"
                      className="object-cover opacity-88 transition duration-700 group-hover:scale-105"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-[#201713]/92 via-[#201713]/30 to-transparent" />
                    <span className="relative z-10 flex h-full flex-col justify-end">
                      <span className="mb-2 inline-flex w-fit rounded-full bg-[#f2cf8b] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#201713]">
                        {tool.shortTitle}
                      </span>
                      <span className="block text-xl font-semibold leading-tight">
                        {tool.title}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary dark:text-[#f2cf8b]">
                All tools
              </p>
              <h2 className="mt-2 text-3xl font-semibold leading-tight text-[#2e241c] dark:text-white">
                Open the tool that matches today.
              </h2>
            </div>
          </div>

          <div className="grid items-start gap-5 lg:grid-cols-[0.95fr_1.35fr]">
            <div className="grid gap-5">
              <BmiToolCard variant="featured" />
              <CompareToolCard variant="featured" />
            </div>
            <div className="grid content-start items-start gap-5 sm:grid-cols-2">
              {toolPages.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </div>
        </section>

        <section className="mt-14 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[1.4rem] bg-[#201713] p-6 text-white sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f2cf8b]">
              Quick searches
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight">
              Start from what people actually need at home.
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/66">
              These shortcuts open the most useful tool with the intent already
              set, so the first result screen is closer to the real problem.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {searchIntents.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group flex min-h-[6.5rem] items-center justify-between gap-4 rounded-[1.1rem] border border-[#ead9c3] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#d09b51] hover:shadow-lg hover:shadow-[#5c3219]/10 dark:border-white/10 dark:bg-white/[0.05]"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f1e4cf] text-[#9b6b2f] dark:bg-[#f2cf8b]/12 dark:text-[#f2cf8b]">
                    <Search className="size-4" />
                  </span>
                  <span className="text-sm font-semibold leading-6 text-[#2e241c] dark:text-white">
                    {item.title}
                  </span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-[#9b6b2f] transition group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-[1.4rem] border border-[#ead9c3] bg-white p-6 dark:border-white/10 dark:bg-white/[0.04] sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary dark:text-[#f2cf8b]">
                Why it works
              </p>
              <h2 className="mt-2 text-3xl font-semibold leading-tight text-[#2e241c] dark:text-white">
                Recipes are easier when the situation is clear.
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                "Pick the situation",
                "Adjust the filters",
                "Open a recipe card",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-[#ead9c3] bg-[#fffaf1] p-4 dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <CheckCircle2 className="mb-3 size-5 text-[#9b6b2f] dark:text-[#f2cf8b]" />
                  <h2 className="text-base font-semibold text-[#2e241c] dark:text-white">
                    {item}
                  </h2>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-14">
          <div className="mb-5 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary dark:text-[#f2cf8b]">
              Questions
            </p>
            <h2 className="mt-2 text-3xl font-semibold leading-tight text-[#2e241c] dark:text-white">
              Helpful answers before you choose a tool.
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {hubFaqs.map((item) => (
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
