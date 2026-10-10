import { ArrowRight, CookingPot, Search } from "lucide-react";
import Link from "next/link";

interface NoRecipesFoundProps {
  keyparam?: string;
}

export const NoRecipesFound = ({ keyparam }: NoRecipesFoundProps) => {
  return (
    <div className="rounded-[2rem] border border-[#e8dac3] bg-[#fffdf8]/88 p-8 text-center shadow-[0_22px_54px_-42px_rgba(56,35,20,0.55)] sm:p-12 dark:border-white/10 dark:bg-[#11251f]/88">
      <span className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-[#f4e6cd] text-[#ad7635] dark:bg-[#19372e] dark:text-[#e2b96c]">
        <Search className="size-6" />
      </span>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a5773c] dark:text-[#d5ad64]">
        Explore another craving
      </p>
      <h2 className="mt-3 text-2xl font-semibold text-[#30251d] dark:text-[#edf2ec]">
        Let&apos;s find a different plate
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#75675b] dark:text-[#a7b7af]">
        {keyparam
          ? `No curated matches surfaced for "${keyparam}" yet. Try a cuisine, ingredient or meal moment.`
          : "Fresh recipe collections are being prepared. Explore all dishes in the kitchen meanwhile."}
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link
          href="/recipes"
          className="inline-flex items-center gap-2 rounded-full bg-[#b73325] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9e291e]"
        >
          <CookingPot className="size-4" />
          Browse all recipes
        </Link>
        <Link
          href="/search?k=paneer"
          className="inline-flex items-center gap-2 rounded-full border border-[#dfcba9] px-5 py-3 text-sm font-semibold text-[#4e4034] transition hover:bg-[#f6ecdd] dark:border-white/12 dark:text-[#e6eee8] dark:hover:bg-white/6"
        >
          Try paneer <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
};
