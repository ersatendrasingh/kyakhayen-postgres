import Image from "next/image";
import Link from "next/link";

import { recipeCollectionHref } from "@/lib/recipe-collection-url";

interface RecipeSidebarWidgetProps {
  title: string;
  eyebrow: string;
  type: "category" | "mealTime" | "recipeType";
  widgetItems?: {
    id: string;
    name?: string;
    title?: string;
    slug: string;
    imageUrl: string | null;
  }[];
}

const RecipeSidebarWidget = ({
  title,
  eyebrow,
  widgetItems,
}: RecipeSidebarWidgetProps) => {
  return (
    <div className="recipe-sidebar-panel rounded-[1.75rem] border border-[#eadcc8] bg-[#fffdf8] p-5 shadow-sm dark:border-white/10 dark:bg-[#10221d]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.23em] text-[#ab7d40] dark:text-[#d2aa62]">
        {eyebrow}
      </p>
      <h3 className="mb-5 mt-2 text-lg font-semibold text-[#30261f] dark:text-[#eef2ec]">
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {(widgetItems || []).slice(0, 8).map((widget) => (
          <Link
            key={widget.id}
            href={recipeCollectionHref(widget.slug)}
            className="group flex flex-col overflow-hidden rounded-2xl border border-[#ece0cf] bg-[#fcf7ee] transition hover:-translate-y-0.5 hover:border-[#dcc192] dark:border-white/8 dark:bg-[#142d25] dark:hover:border-[#537062]"
          >
            {widget.imageUrl ? (
              <div className="relative aspect-[1.35/1] overflow-hidden">
                <Image
                  src={widget.imageUrl}
                  alt={widget.name || widget.title || "Category"}
                  fill
                  sizes="150px"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
            ) : (
              <div className="flex aspect-[1.35/1] items-end bg-gradient-to-br from-[#e8d0a0] via-[#f6e9d2] to-[#d6e2d5] p-3 dark:from-[#213d33] dark:via-[#193329] dark:to-[#1b2923]">
                <span className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#8b6636] dark:text-[#d1aa64]">
                  Discover
                </span>
              </div>
            )}
            <span className="line-clamp-2 px-3 py-2.5 text-xs font-medium text-[#4d4035] dark:text-[#dbe4de]">
              {widget.name || widget.title}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RecipeSidebarWidget;
