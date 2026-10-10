import Link from "next/link";
import { ArrowRight, BookOpen, CookingPot, SearchX } from "lucide-react";

type ContentNotFoundProps = {
  kind: "article" | "recipe";
};

const copy = {
  article: {
    title: "This article is no longer available.",
    description:
      "It may have been moved or unpublished. Explore more food stories and cooking inspiration instead.",
    href: "/blog",
    label: "Browse articles",
    icon: BookOpen,
  },
  recipe: {
    title: "This recipe could not be found.",
    description:
      "It may have moved or been removed. Discover other recipe ideas made for everyday cooking.",
    href: "/recipes",
    label: "Browse recipes",
    icon: CookingPot,
  },
};

export default function ContentNotFound({ kind }: ContentNotFoundProps) {
  const content = copy[kind];
  const Icon = content.icon;

  return (
    <section className="flex min-h-[calc(100svh-108px)] items-center justify-center bg-[#fcf8f0] px-4 py-10 dark:bg-[#091712] lg:min-h-[calc(100svh-100px)]">
      <div className="w-full max-w-2xl rounded-[2rem] border border-[#eadbc6] bg-[#fffdf9] p-8 text-center shadow-[0_24px_70px_rgba(66,46,27,0.08)] sm:p-12 dark:border-white/8 dark:bg-[#10241e]">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#f5e8d5] text-[#b83c2e] dark:bg-[#17362e] dark:text-[#e5b367]">
          <SearchX className="size-7" />
        </div>
        <p className="mt-7 text-xs font-semibold uppercase tracking-[0.28em] text-[#a87938] dark:text-[#d5a456]">
          Not found
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-[#30261f] sm:text-4xl dark:text-[#edf3ed]">
          {content.title}
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[#716358] sm:text-base dark:text-[#aab8b0]">
          {content.description}
        </p>
        <Link
          href={content.href}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#b83c2e] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#9d3125]"
        >
          <Icon className="size-4" />
          {content.label}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
