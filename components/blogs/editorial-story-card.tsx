import { ArrowUpRight, Clock3 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import {
  articleHref,
  articleReadMinutes,
  formatArticleDate,
} from "@/components/blogs/editorial-utils";

export type EditorialStory = {
  id: string;
  title: string;
  metaDescription: string | null;
  content?: string | null;
  imageUrl: string | null;
  slug: string;
  metaSlug: string | null;
  updatedAt: Date;
  PostCategory: Array<{ category: { title: string; slug: string } }>;
  PostTag?: Array<{ tag: { title: string; slug: string } }>;
};

export function StoryMeta({ story }: { story: EditorialStory }) {
  const category = story.PostCategory[0]?.category;

  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9d753e] dark:text-[#d2aa63]">
      {category && <span>{category.title}</span>}
      <span className="size-1 rounded-full bg-current opacity-45" />
      <span>{articleReadMinutes(story.content)} min read</span>
    </div>
  );
}

export function EditorialStoryRow({
  story,
  compact = false,
}: {
  story: EditorialStory;
  compact?: boolean;
}) {
  return (
    <Link
      href={articleHref(story)}
      className="group grid gap-4 rounded-[1.5rem] border border-[#eadcc8] bg-[#fffdf9] p-3 transition hover:-translate-y-0.5 hover:border-[#ddc292] hover:shadow-[0_20px_42px_-34px_rgba(55,35,18,0.7)] dark:border-white/10 dark:bg-[#10241e] dark:hover:border-[#c99a50]/45 sm:grid-cols-[168px_1fr]"
    >
      <div
        className={`relative overflow-hidden rounded-[1.1rem] ${
          compact ? "min-h-[112px]" : "min-h-[136px]"
        }`}
      >
        {story.imageUrl ? (
          <Image
            src={story.imageUrl}
            alt={story.title}
            fill
            sizes="(max-width: 640px) 100vw, 180px"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#eed5aa] to-[#dbe2cf] dark:from-[#203d32] dark:to-[#182821]" />
        )}
      </div>
      <div className="flex min-w-0 flex-col justify-center py-1">
        <StoryMeta story={story} />
        <h3 className="mt-3 line-clamp-2 text-lg font-semibold leading-snug text-[#30251e] dark:text-[#f0f3ed]">
          {story.title}
        </h3>
        {!compact && (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#756557] dark:text-[#aab7b0]">
            {story.metaDescription}
          </p>
        )}
        <p className="mt-3 flex items-center gap-2 text-xs text-[#8c7969] dark:text-[#95a79f]">
          {formatArticleDate(story.updatedAt)}
          <ArrowUpRight className="size-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </p>
      </div>
    </Link>
  );
}

export function EditorialMiniStory({ story }: { story: EditorialStory }) {
  return (
    <Link href={articleHref(story)} className="group block">
      <div className="relative aspect-[1.25] overflow-hidden rounded-[1.2rem]">
        {story.imageUrl ? (
          <Image
            src={story.imageUrl}
            alt={story.title}
            fill
            sizes="(max-width: 768px) 100vw, 280px"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#efdec0] to-[#e5ebdc] dark:from-[#203c32] dark:to-[#172a22]" />
        )}
      </div>
      <div className="mt-3">
        <StoryMeta story={story} />
      </div>
      <h3 className="mt-3 line-clamp-2 text-lg font-semibold leading-snug text-[#30251e] transition group-hover:text-[#b83c2e] dark:text-[#eef2ec] dark:group-hover:text-[#e4bb70]">
        {story.title}
      </h3>
      <div className="mt-3 flex items-center gap-1.5 text-xs text-[#887666] dark:text-[#9eafa7]">
        <Clock3 className="size-3.5" />
        {articleReadMinutes(story.content)} min
      </div>
    </Link>
  );
}
