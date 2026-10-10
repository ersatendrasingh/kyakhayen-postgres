"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, PlayCircle } from "lucide-react";

type HomeMealPlanActionProps = {
  variant: "hero" | "story" | "rail" | "article";
};

export default function HomeMealPlanAction({
  variant,
}: HomeMealPlanActionProps) {
  const label = "Build my meal plan";
  const href = "/meal-plan/create";

  if (variant === "hero") {
    return (
      <Link
        href={href}
        className="home-hero-secondary-action inline-flex items-center gap-2 text-sm font-medium text-white transition hover:text-[#f8d18a]"
      >
        <PlayCircle className="size-6" />
        {label}
      </Link>
    );
  }

  if (variant === "rail") {
    return (
      <Link
        href={href}
        className="mt-5 block rounded-[1.45rem] bg-[#17382d] p-5 text-white transition hover:bg-[#112d24] dark:bg-[#18352c]"
      >
        <CalendarDays className="size-5 text-[#e0b66b]" />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#d9ad63]">
          Your weekly table
        </p>
        <p className="mt-2 text-base font-semibold leading-6">
          Build a meal plan from food you enjoy.
        </p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#f2deaf]">
          {label} <ArrowRight className="size-3.5" />
        </span>
      </Link>
    );
  }

  if (variant === "article") {
    return (
      <Link
        href={href}
        className="inline-flex items-center gap-2 rounded-full bg-[#b83c2e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9f3124]"
      >
        {label} <ArrowRight className="size-4" />
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold transition hover:bg-websecondary-400"
    >
      {label} <ArrowRight className="size-4" />
    </Link>
  );
}
