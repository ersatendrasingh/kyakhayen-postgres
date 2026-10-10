import { ArrowRight, Clock3 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { RecipeSuggestion } from "@/components/sections/situation-tools/types";
import { shouldServeDirectMediaImage } from "@/lib/direct-media-image";

export function RecipeResultCard({ suggestion }: { suggestion: RecipeSuggestion }) {
  return (
    <Link
      href={suggestion.href}
      className="group flex min-h-[132px] w-full min-w-0 overflow-hidden rounded-lg border border-[#ead9c3] bg-[#fffdf8] shadow-sm transition hover:-translate-y-0.5 hover:border-[#d09b51] hover:shadow-md dark:border-white/10 dark:bg-white/[0.06] sm:min-h-0 sm:flex-col"
    >
      <div className="relative w-[112px] shrink-0 overflow-hidden bg-[#f1e4cf] sm:aspect-[1.38] sm:w-full">
        <Image
          src={suggestion.imageUrl}
          alt={suggestion.title}
          fill
          quality={75}
          unoptimized={shouldServeDirectMediaImage(suggestion.imageUrl)}
          sizes="(max-width: 640px) 112px, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <span className="absolute left-2 top-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-white/94 px-2 py-1 text-[10px] font-semibold text-[#8f352a] shadow-sm">
          {suggestion.badge}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between p-3 sm:p-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-md bg-[#f1e4cf] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#80572c] dark:bg-white/10 dark:text-[#f2cf8b]">
              <Clock3 className="size-3" />
              {suggestion.tag}
            </span>
            <span className="rounded-md bg-[#eef4e9] px-2 py-1 text-[10px] font-semibold text-[#436640] dark:bg-emerald-400/10 dark:text-emerald-100">
              {suggestion.context}
            </span>
          </div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-[#2e241c] transition group-hover:text-primary dark:text-white sm:text-base sm:leading-6">
            {suggestion.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[#786859] dark:text-white/64">
            {suggestion.meta}
          </p>
        </div>
        <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
          View recipe
          <ArrowRight className="size-3.5" />
        </span>
      </div>
    </Link>
  );
}

export function RecipeResultSkeleton() {
  return (
    <div className="flex min-h-[132px] w-full min-w-0 animate-pulse overflow-hidden rounded-lg border border-[#ead9c3] bg-[#fffdf8] dark:border-white/10 dark:bg-white/[0.06] sm:min-h-0 sm:flex-col">
      <div className="w-[112px] shrink-0 bg-[#f1e4cf] dark:bg-white/10 sm:aspect-[1.38] sm:w-full" />
      <div className="flex flex-1 flex-col justify-between p-3 sm:p-4">
        <div>
          <div className="mb-3 h-6 w-28 rounded-md bg-[#f1e4cf] dark:bg-white/10" />
          <div className="h-5 w-3/4 rounded-md bg-[#ead9c3] dark:bg-white/10" />
          <div className="mt-2 h-4 w-full rounded-md bg-[#f5ead8] dark:bg-white/10" />
        </div>
        <div className="mt-3 h-4 w-20 rounded-md bg-[#ead9c3] dark:bg-white/10" />
      </div>
    </div>
  );
}
