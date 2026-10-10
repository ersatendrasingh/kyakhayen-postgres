import { ArrowRight, BookOpenText } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import {
  EditorialStory,
  EditorialStoryRow,
  StoryMeta,
} from "@/components/blogs/editorial-story-card";
import { articleHref } from "@/components/blogs/editorial-utils";
import Container from "@/components/container";

type HomeEditorialStoriesProps = {
  articles: EditorialStory[];
};

export default function HomeEditorialStories({
  articles,
}: HomeEditorialStoriesProps) {
  const feature = articles[0];
  if (!feature) return null;

  return (
    <section className="home-surface py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-[1420px] rounded-[2rem] border border-[#eadcc6] bg-[#fffaf4] p-5 shadow-[0_26px_65px_-54px_rgba(48,31,19,0.72)] dark:border-white/10 dark:bg-[#0e211b] sm:p-8 lg:p-10">
          <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.26em] text-[#aa7838] dark:text-[#d8ad63]">
                <BookOpenText className="size-4" /> From the journal
              </p>
              <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-[#30251e] dark:text-[#eef2ec] sm:text-4xl">
                Food stories worth slowing down for
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-[#756457] dark:text-[#aab8b0] sm:text-base">
                Practical guides, seasonal ideas and thoughtful everyday
                cooking from the Kya Khayen editorial table.
              </p>
            </div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-full border border-[#dfc69e] px-5 py-3 text-sm font-semibold text-[#46372d] transition hover:bg-[#f5ead8] dark:border-white/12 dark:text-[#e8eee9] dark:hover:bg-white/7"
            >
              Open the journal <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
            <Link
              href={articleHref(feature)}
              className="group relative min-h-[430px] overflow-hidden rounded-[1.7rem] sm:min-h-[500px]"
            >
              {feature.imageUrl ? (
                <Image
                  src={feature.imageUrl}
                  alt={feature.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 53vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#d8bf90] to-[#224337]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#17140f]/92 via-[#17140f]/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
                <StoryMeta story={feature} />
                <h3 className="mt-4 max-w-xl text-2xl font-semibold leading-tight sm:text-3xl">
                  {feature.title}
                </h3>
                <p className="mt-3 line-clamp-2 max-w-lg text-sm leading-7 text-white/72">
                  {feature.metaDescription}
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">
                  Read story <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
            <div className="flex flex-col gap-4">
              {articles.slice(1, 4).map((article) => (
                <EditorialStoryRow key={article.id} story={article} compact />
              ))}
              <Link
                href="/blog"
                className="mt-auto flex items-center justify-between rounded-[1.35rem] bg-[#17382d] px-5 py-5 text-sm font-semibold text-white dark:bg-[#17342b]"
              >
                Browse every kitchen story
                <ArrowRight className="size-4 text-[#dfb36c]" />
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
