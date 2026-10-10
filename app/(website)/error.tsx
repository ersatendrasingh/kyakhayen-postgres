"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, RefreshCw } from "lucide-react";

import Container from "@/components/container";

export default function WebsiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[calc(100svh-108px)] bg-[#fcf8f0] py-12 dark:bg-[#091712] sm:py-20 lg:min-h-[calc(100svh-100px)]">
      <Container>
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-[#eadbc6] bg-[#fffdf9] p-7 text-center shadow-[0_25px_70px_rgba(72,48,26,0.07)] sm:p-12 dark:border-white/8 dark:bg-[#10241e]">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#f5e8d5] text-[#b83c2e] dark:bg-[#17362e] dark:text-[#e5b367]">
            <AlertTriangle className="size-7" />
          </div>
          <p className="mt-7 text-xs font-semibold uppercase tracking-[0.3em] text-[#a87938] dark:text-[#d5a456]">
            Something interrupted this page
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-[#30261f] sm:text-4xl dark:text-[#edf3ed]">
            We could not load this page.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#716358] sm:text-base dark:text-[#aab8b0]">
            Your saved choices are not affected. Try loading the page again, or
            return home and continue exploring recipes.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={reset}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#b83c2e] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#9d3125]"
            >
              <RefreshCw className="size-4" />
              Try again
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#dfcdb4] px-6 py-3.5 text-sm font-semibold text-[#44362c] transition hover:bg-[#f7ecdc] dark:border-white/12 dark:text-[#e7eee8] dark:hover:bg-white/[0.06]"
            >
              Go to home
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
