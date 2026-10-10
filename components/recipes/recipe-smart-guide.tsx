"use client";

import {
  AlertTriangle,
  ChefHat,
  CircleHelp,
  LinkIcon,
  PackageCheck,
  RefreshCw,
  Sparkles,
  Utensils,
} from "lucide-react";
import Link from "next/link";

import {
  buildRecipeSmartGuide,
  relatedRecipeLinks,
  type RecipeSmartGuideItem,
} from "@/lib/recipe-smart-guide";
import type { HomeRecipeCardRecipe } from "@/components/recipes/home-recipe-card";
import type { RecipeWithCategory } from "@/types/recipe";

type RecipeSmartGuideProps = {
  recipe: RecipeWithCategory;
  relatedRecipes?: HomeRecipeCardRecipe[];
};

function GuideBlock({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: typeof ChefHat;
  items: RecipeSmartGuideItem[];
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-full bg-[#f2e4cd] text-[#8b5d24] dark:bg-white/8 dark:text-[#dfb76c]">
          <Icon className="size-4.5" />
        </span>
        <h3 className="text-lg font-semibold text-[#30261e] dark:text-[#eef2ec]">
          {title}
        </h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <article
            key={`${title}-${item.title}`}
            className="rounded-2xl border border-[#eee2d1] bg-[#fffdf9] p-4 dark:border-white/8 dark:bg-[#132a23]"
          >
            <h4 className="text-sm font-semibold text-[#3b2e24] dark:text-[#f0f4ee]">
              {item.title}
            </h4>
            <p className="mt-2 text-sm leading-6 text-[#66594d] dark:text-[#b3c0b9]">
              {item.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

const RecipeSmartGuide = ({ recipe, relatedRecipes = [] }: RecipeSmartGuideProps) => {
  const guide = buildRecipeSmartGuide(recipe);
  const links = relatedRecipeLinks(relatedRecipes);

  return (
    <div className="space-y-8">
      <GuideBlock title="Why this recipe works" icon={Sparkles} items={guide.whyItWorks} />
      <GuideBlock title="Chef tips" icon={ChefHat} items={guide.chefTips} />
      <GuideBlock title="Common mistakes" icon={AlertTriangle} items={guide.commonMistakes} />
      <GuideBlock title="Serving suggestions" icon={Utensils} items={guide.servingSuggestions} />
      <GuideBlock title="Storage instructions" icon={PackageCheck} items={guide.storageInstructions} />
      <GuideBlock title="Variations" icon={RefreshCw} items={guide.variations} />

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-[#f2e4cd] text-[#8b5d24] dark:bg-white/8 dark:text-[#dfb76c]">
            <CircleHelp className="size-4.5" />
          </span>
          <h3 className="text-lg font-semibold text-[#30261e] dark:text-[#eef2ec]">
            FAQs
          </h3>
        </div>
        <div className="space-y-3">
          {guide.faqs.map((faq) => (
            <article
              key={faq.question}
              className="rounded-2xl border border-[#eee2d1] bg-[#fffdf9] p-4 dark:border-white/8 dark:bg-[#132a23]"
            >
              <h4 className="text-sm font-semibold text-[#3b2e24] dark:text-[#f0f4ee]">
                {faq.question}
              </h4>
              <p className="mt-2 text-sm leading-6 text-[#66594d] dark:text-[#b3c0b9]">
                {faq.answer}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-[#f2e4cd] text-[#8b5d24] dark:bg-white/8 dark:text-[#dfb76c]">
            <LinkIcon className="size-4.5" />
          </span>
          <h3 className="text-lg font-semibold text-[#30261e] dark:text-[#eef2ec]">
            Related recipes
          </h3>
        </div>
        {links.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {links.map((recipeLink) => (
              <Link
                key={recipeLink.href}
                href={recipeLink.href}
                className="rounded-full border border-[#e9d8bf] bg-[#fbf4e8] px-4 py-2 text-sm font-medium text-[#554337] transition hover:border-[#bf8f4d] hover:text-[#8b5d24] dark:border-white/10 dark:bg-white/5 dark:text-[#d7e1dc] dark:hover:text-[#dfb76c]"
              >
                {recipeLink.title}
              </Link>
            ))}
          </div>
        ) : (
          <a
            href="#recipe-related-recipes"
            className="inline-flex rounded-full border border-[#e9d8bf] bg-[#fbf4e8] px-4 py-2 text-sm font-medium text-[#554337] transition hover:border-[#bf8f4d] hover:text-[#8b5d24] dark:border-white/10 dark:bg-white/5 dark:text-[#d7e1dc] dark:hover:text-[#dfb76c]"
          >
            See more recipe ideas below
          </a>
        )}
      </section>
    </div>
  );
};

export default RecipeSmartGuide;
