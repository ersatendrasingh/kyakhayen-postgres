"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function RootError({
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
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_18%_14%,#f4dfbe,transparent_30%),radial-gradient(circle_at_86%_12%,#f2d9ce,transparent_28%),#fcf8f0] p-5 dark:bg-[radial-gradient(circle_at_18%_14%,rgba(205,151,71,0.13),transparent_30%),#091712]">
      <div className="w-full max-w-xl rounded-[2rem] border border-[#eadbc6] bg-[#fffdf9] p-8 text-center shadow-[0_25px_80px_rgba(72,48,26,0.1)] sm:p-12 dark:border-white/8 dark:bg-[#10241e]">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#f5e8d5] text-[#b83c2e] dark:bg-[#17362e] dark:text-[#e5b367]">
          <AlertTriangle className="size-7" />
        </div>
        <h1 className="mt-7 text-3xl font-semibold text-[#30261f] dark:text-[#edf3ed]">
          That did not load correctly.
        </h1>
        <p className="mt-4 text-sm leading-7 text-[#716358] dark:text-[#aab8b0]">
          Please try once more. If the issue continues, you can return to the
          homepage and begin again safely.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#b83c2e] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#9d3125]"
          >
            <RefreshCw className="size-4" />
            Retry
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#dfcdb4] px-6 py-3.5 text-sm font-semibold text-[#44362c] dark:border-white/12 dark:text-[#e7eee8]"
          >
            <Home className="size-4" />
            Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
