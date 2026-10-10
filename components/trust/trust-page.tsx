import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, CircleAlert, ShieldCheck } from "lucide-react";

import Container from "@/components/container";
import { cn } from "@/lib/utils";

type HeroAction = {
  href: string;
  label: string;
  secondary?: boolean;
};

type TrustHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  imageSrc?: string;
  imageAlt?: string;
  actions?: HeroAction[];
  badge?: string;
  imageContent?: ReactNode;
};

export function TrustHero({
  eyebrow,
  title,
  description,
  imageSrc,
  imageAlt,
  actions = [],
  badge,
  imageContent,
}: TrustHeroProps) {
  return (
    <section className="relative overflow-hidden bg-[#fbf6ed] py-8 sm:py-12 lg:py-16 dark:bg-[#091712]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(210,160,79,0.16),transparent_34%),radial-gradient(circle_at_88%_12%,rgba(191,55,41,0.11),transparent_30%)] dark:bg-[radial-gradient(circle_at_15%_15%,rgba(209,167,91,0.12),transparent_33%),radial-gradient(circle_at_88%_12%,rgba(184,68,52,0.16),transparent_30%)]" />
      <Container>
        <div className="relative grid items-center gap-7 lg:grid-cols-[.94fr_1.06fr] lg:gap-12">
          <div>
            <p className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#b07e3c] dark:text-[#e0b367]">
              <ShieldCheck className="size-4" />
              {eyebrow}
            </p>
            <h1 className="max-w-xl text-4xl font-semibold leading-[1.1] text-[#2f251e] sm:text-5xl lg:text-[3.4rem] dark:text-[#f4f0e9]">
              {title}
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[#756558] sm:text-base dark:text-[#adbab3]">
              {description}
            </p>
            {badge ? (
              <p className="mt-6 inline-flex rounded-full border border-[#ead8bc] bg-white/70 px-4 py-2 text-xs font-medium text-[#765a38] dark:border-white/10 dark:bg-white/[0.04] dark:text-[#dbbf88]">
                {badge}
              </p>
            ) : null}
            {actions.length ? (
              <div className="mt-7 flex flex-wrap gap-3">
                {actions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition",
                      action.secondary
                        ? "border border-[#decaab] bg-white/62 text-[#493b31] hover:bg-[#f3e7d5] dark:border-white/12 dark:bg-white/[0.04] dark:text-[#e8eee8] dark:hover:bg-white/[0.09]"
                        : "bg-[#bd3829] text-white shadow-[0_14px_28px_-16px_rgba(177,51,39,0.7)] hover:bg-[#aa3024]"
                    )}
                  >
                    {action.label}
                    <ArrowRight className="size-4" />
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
          <div className="relative overflow-hidden rounded-[2rem] border border-[#ead9c2] bg-white shadow-[0_32px_70px_-48px_rgba(56,35,20,0.55)] dark:border-white/10 dark:bg-[#10241e]">
            {imageContent ??
              (imageSrc ? (
                <div className="relative aspect-[1.16/0.86] min-h-[290px]">
                  <Image
                    src={imageSrc}
                    alt={imageAlt ?? ""}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 52vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#16100c]/48 via-transparent to-transparent" />
                </div>
              ) : null)}
          </div>
        </div>
      </Container>
    </section>
  );
}

type InformationBoundaryProps = {
  className?: string;
  compact?: boolean;
};

export function InformationBoundary({
  className,
  compact = false,
}: InformationBoundaryProps) {
  return (
    <div
      className={cn(
        "rounded-[1.6rem] border border-[#ead9bf] bg-[#fffaf1] text-[#55463b] dark:border-white/10 dark:bg-[#122820] dark:text-[#d3ddd7]",
        compact ? "p-5" : "p-6 sm:p-7",
        className
      )}
    >
      <div className="flex items-start gap-3.5">
        <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f3e4cb] text-[#b83c2e] dark:bg-[#19372e] dark:text-[#ebb46a]">
          <CircleAlert className="size-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-[#342920] dark:text-[#eef2eb]">
            Food inspiration only, not medical advice
          </p>
          <p className="mt-2 text-sm leading-6">
            Kya Khayen provides recipe ideas and meal planning information
            based on taste, ingredient exclusions and cooking comfort. We do
            not diagnose, treat, prevent or manage any disease, and we do not
            create plans from medical or health information.
          </p>
          {!compact ? (
            <p className="mt-2 text-sm leading-6">
              If you have an allergy, intolerance, pregnancy-related need,
              medical condition or a prescribed diet, verify ingredients and
              cross-contamination risks yourself and consult a qualified
              professional before making food decisions.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#a97a3e] dark:text-[#d6ab63]">
      {children}
    </p>
  );
}
