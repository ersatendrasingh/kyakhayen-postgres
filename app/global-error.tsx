"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
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
    <html lang="en">
      <body>
        <div className="flex min-h-screen items-center justify-center bg-[#fcf8f0] p-5 text-[#30261f] dark:bg-[#091712] dark:text-[#edf3ed]">
          <div className="w-full max-w-xl rounded-[2rem] border border-[#eadbc6] bg-white p-8 text-center shadow-[0_25px_80px_rgba(72,48,26,0.1)] sm:p-12 dark:border-white/10 dark:bg-[#10241e]">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a87938] dark:text-[#d5a456]">
              Kya Khayen
            </p>
            <h1 className="mt-5 text-3xl font-semibold">
              We need to reload this experience.
            </h1>
            <p className="mt-4 text-sm leading-7 text-[#716358] dark:text-[#aab8b0]">
              A temporary issue stopped the site from opening. Reload it now,
              or return to the homepage.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={reset}
                className="cursor-pointer rounded-full bg-[#b83c2e] px-7 py-3.5 text-sm font-semibold text-white"
              >
                Reload site
              </button>
              <Link
                href="/"
                className="rounded-full border border-[#dfcdb4] px-7 py-3.5 text-sm font-semibold dark:border-white/12"
              >
                Go home
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
