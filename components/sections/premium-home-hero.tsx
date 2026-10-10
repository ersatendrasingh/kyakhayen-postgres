"use client";

import { ArrowRight, ChefHat, Flame, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import Container from "@/components/container";
import HomeMealPlanAction from "@/components/sections/home-meal-plan-action";
import { recipeCollectionHref } from "@/lib/recipe-collection-url";

type PremiumHomeHeroProps = {
  catalogRecipeCount: number;
  videoUrls: string[];
};

const discoveryLinks = [
  { label: "Comfort food", href: recipeCollectionHref("meal") },
  { label: "Healthy & tasty", href: recipeCollectionHref("healthy") },
  { label: "Quick dinner", href: recipeCollectionHref("dinner") },
  { label: "Protein rich", href: recipeCollectionHref("protein") },
];

const inspirationCards = [
  {
    label: "Ready in 20 mins",
    href: recipeCollectionHref("dinner"),
    icon: Flame,
  },
  {
    label: "Cook from your pantry",
    href: "/recipes",
    icon: ChefHat,
  },
];

const rotatingHighlights = [
  "Find your perfect plate.",
  "Cook like a pro chef.",
  "Find daily meal plans.",
];

const rotatingEyebrows = [
  "Comfort food for every mood",
  "Thoughtfully chosen for your table",
  "Fresh ideas from your kitchen",
];

export default function PremiumHomeHero({
  videoUrls,
}: PremiumHomeHeroProps) {
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [activeHighlightIndex, setActiveHighlightIndex] = useState(0);
  const activeVideo = videoUrls[activeVideoIndex];
  const activeHighlight = rotatingHighlights[activeHighlightIndex];
  const activeEyebrow = rotatingEyebrows[activeHighlightIndex];
  const growingRecipeCount = "50,000+";

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveHighlightIndex(
        (index) => (index + 1) % rotatingHighlights.length,
      );
    }, 4600);

    return () => window.clearInterval(interval);
  }, []);

  const nextVideo = () => {
    setActiveVideoIndex((index) => (index + 1) % videoUrls.length);
  };

  return (
    <section className="home-hero relative isolate min-h-[calc(100svh-70px)] overflow-hidden lg:h-[clamp(600px,calc(100svh-86px),700px)] lg:min-h-0 xl:h-[clamp(620px,calc(100svh-86px),720px)]">
      {activeVideo && (
        <video
          key={activeVideo}
          className="home-hero-video absolute inset-0 -z-20 h-full w-full object-cover object-[62%_center] lg:object-center"
          autoPlay
          muted
          playsInline
          preload="metadata"
          poster="/assets/images/auth-kitchen-hero.webp"
          onEnded={nextVideo}
          aria-hidden="true"
        >
          <source src={activeVideo} type="video/mp4" />
        </video>
      )}
      <div className="home-hero-overlay absolute inset-0 -z-10" />
      <div className="home-hero-bottom-fade absolute inset-x-0 bottom-0 -z-10 h-16 bg-gradient-to-t from-background/65 to-transparent" />

      <div className="home-hero-container">
        <Container>
          <div className="home-hero-stage flex min-h-[calc(100svh-70px)] items-center py-8 sm:py-10 lg:h-full lg:min-h-0 lg:py-0">
            <div className="home-hero-copy max-w-[620px] rounded-[2rem] p-5 text-white sm:p-8 lg:max-w-[520px] lg:p-6">
              <div className="home-hero-eyebrow mb-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/12 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.2em] backdrop-blur lg:mb-3">
                <Sparkles className="size-4 text-brand-saffron" />
                <span
                  key={activeEyebrow}
                  className="home-hero-eyebrow-line inline-block min-w-[226px] sm:min-w-[302px]"
                >
                  {activeEyebrow}
                </span>
              </div>
              <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.15rem] xl:text-[3.35rem]">
                <span className="block">Aaj kya khayen?</span>
                <span
                  className="home-hero-highlight home-hero-tagline-window relative mt-2 grid text-[#f8d18a]"
                  aria-live="polite"
                >
                  <span
                    key={activeHighlight}
                    className="home-hero-tagline col-start-1 row-start-1 block"
                  >
                    {activeHighlight}
                  </span>
                </span>
              </h1>
              <p className="home-hero-subtitle mt-4 max-w-[470px] text-sm leading-6 text-white/84 sm:text-base lg:mt-3">
                Discover recipes based on your mood, time and ingredients.
              </p>

              <div className="mt-6 grid max-w-xl gap-2 sm:grid-cols-2 lg:mt-5 lg:max-w-[470px]">
                {inspirationCards.map(({ label, href, icon: Icon }) => (
                  <Link
                    key={label}
                    href={href}
                    className="group flex items-center gap-3 rounded-2xl border border-white/20 bg-black/16 px-4 py-3.5 text-sm font-medium text-white backdrop-blur-sm transition hover:border-[#f8d18a]/65 hover:bg-black/24"
                  >
                    <span className="flex size-9 items-center justify-center rounded-full bg-[#f8d18a]/18 text-[#f8d18a]">
                      <Icon className="size-4" />
                    </span>
                    <span className="flex-1">{label}</span>
                    <ArrowRight className="size-4 opacity-55 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </Link>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-2 lg:mt-4">
                {discoveryLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="home-hero-chip rounded-full border border-white/20 bg-white/[0.08] px-4 py-2 text-sm text-white/85 transition hover:border-white/50 hover:bg-white/15"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-6 lg:mt-5">
                <Link
                  href="/recipes"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-primary/30 transition hover:-translate-y-0.5 hover:bg-websecondary-400"
                >
                  Explore recipes
                  <ArrowRight className="size-4" />
                </Link>
                <HomeMealPlanAction variant="hero" />
              </div>

              {videoUrls.length > 1 && (
                <div className="mt-5 flex items-center gap-3 lg:mt-4">
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-white/62">
                    Food stories
                  </span>
                  <div
                    className="flex gap-2"
                    aria-label="Select hero food video"
                  >
                    {videoUrls.map((videoUrl, index) => (
                      <button
                        key={videoUrl}
                        type="button"
                        onClick={() => setActiveVideoIndex(index)}
                        aria-label={`Play food story ${index + 1}`}
                        aria-current={index === activeVideoIndex}
                        className={`h-1.5 rounded-full transition-all ${
                          index === activeVideoIndex
                            ? "w-8 bg-[#f8d18a]"
                            : "w-4 bg-white/38 hover:bg-white/62"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="home-proof-card absolute bottom-10 right-8 hidden w-[278px] rounded-[1.5rem] border border-[#f8d18a]/32 bg-[#17120e]/72 p-5 text-white shadow-2xl shadow-black/25 backdrop-blur-md lg:block xl:bottom-12 xl:right-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.23em] text-white/65">
              Future-ready kitchen
            </p>
            <div className="mt-2 text-[2.65rem] font-semibold leading-none text-[#f8d18a]">
              2 Million+
            </div>
            <p className="mt-2 text-base font-medium text-white">
              Recipe Collection Vision
            </p>
            <p className="mt-2 text-sm leading-6 text-white/72">
              {growingRecipeCount} curated recipes already live, with more food
              stories arriving regularly.
            </p>
          </div>
        </Container>
      </div>
    </section>
  );
}
