import { BadgeCheck, CalendarDays, ChefHat, ClipboardCheck } from "lucide-react";
import Link from "next/link";

import { SocialFollowLinks } from "@/components/social-follow-links";
import { formatDate } from "@/lib/formatDate";
import { recipeAuthorProfile } from "@/lib/recipe-author-profile";
import type { RecipeWithCategory } from "@/types/recipe";

interface RecipeAuthorTrustProps {
  recipe: RecipeWithCategory;
}

const RecipeAuthorTrust = ({ recipe }: RecipeAuthorTrustProps) => {
  const updatedDate = formatDate(recipe.contentUpdatedAt ?? recipe.updatedAt);

  return (
    <section className="recipe-detail-panel rounded-[1.75rem] border border-[#eadcc8] bg-[#fffdf8] p-5 shadow-sm sm:p-7 dark:border-white/10 dark:bg-[#10221d]">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[#18382d] text-lg font-semibold text-white shadow-sm dark:bg-[#d5ad61] dark:text-[#102019]">
            {recipeAuthorProfile.initials}
          </span>

          <div className="min-w-0">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#a47a3f] dark:text-[#d6ad63]">
              About the recipe developer
            </p>
            <h2 className="text-2xl font-semibold text-[#2e251f] dark:text-[#f2f3ed]">
              About {recipeAuthorProfile.name}
            </h2>
            <div className="mt-4 space-y-4 text-base leading-8 text-[#53483f] dark:text-[#c5d0ca]">
              <p>{recipeAuthorProfile.intro}</p>
              <p>{recipeAuthorProfile.purpose}</p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#e6d7c0] bg-[#fbf4e8] px-3 py-2 text-xs font-semibold text-[#6c5845] dark:border-white/10 dark:bg-white/6 dark:text-[#d7e0da]">
                <ChefHat className="size-3.5 text-[#a37638] dark:text-[#d9b36b]" />
                {recipeAuthorProfile.role}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#e6d7c0] bg-[#fbf4e8] px-3 py-2 text-xs font-semibold text-[#6c5845] dark:border-white/10 dark:bg-white/6 dark:text-[#d7e0da]">
                <BadgeCheck className="size-3.5 text-[#3f765f]" />
                Tested by {recipeAuthorProfile.kitchen}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#e6d7c0] bg-[#fbf4e8] px-3 py-2 text-xs font-semibold text-[#6c5845] dark:border-white/10 dark:bg-white/6 dark:text-[#d7e0da]">
                <CalendarDays className="size-3.5 text-[#a37638]" />
                Updated {updatedDate}
              </span>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a47a3f] dark:text-[#d6ad63]">
                Follow Kya Khayen
              </p>
              <SocialFollowLinks />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#eadcc8] bg-[#fbf4e8] p-4 dark:border-white/10 dark:bg-[#162e27]">
          <div className="flex gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[#8d6a3c] shadow-sm dark:bg-white/8 dark:text-[#d8b46b]">
              <ClipboardCheck className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#2f261f] dark:text-[#eef3ed]">
                Editor note
              </p>
              <p className="mt-1 text-sm leading-6 text-[#67584b] dark:text-[#b9c5be]">
                {recipeAuthorProfile.editorNote}
              </p>
            </div>
          </div>
        </div>

        <Link
          href={recipeAuthorProfile.url}
          className="w-fit text-sm font-semibold text-[#9f271f] underline decoration-[#d9b8a0] underline-offset-4 transition hover:text-[#7f1e18] dark:text-[#f1b38b] dark:decoration-white/25"
        >
          More about {recipeAuthorProfile.brand}
        </Link>
      </div>
    </section>
  );
};

export default RecipeAuthorTrust;
