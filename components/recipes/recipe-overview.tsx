import { hasInternalSeoCopy } from "@/lib/seo";
import type { RecipeWithCategory } from "@/types/recipe";

interface RecipeOverviewProps {
  recipe: Pick<RecipeWithCategory, "description" | "title">;
}

function demoteEmbeddedHeadings(value: string) {
  return value.replace(
    /<\/?h([1-6])([^>]*)>/gi,
    (match, level: string, attrs: string) => {
      const nextLevel = Number(level) <= 2 ? 3 : Math.min(6, Number(level) + 1);
      return match.startsWith("</") ? `</h${nextLevel}>` : `<h${nextLevel}${attrs}>`;
    },
  );
}

function sanitizeOverviewHtml(value: string) {
  return demoteEmbeddedHeadings(value)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*(["'])[\s\S]*?\1/gi, "")
    .replace(/\s+href\s*=\s*(["'])\s*javascript:[\s\S]*?\1/gi, ' href="#"');
}

const RecipeOverview = ({ recipe }: RecipeOverviewProps) => {
  const description =
    recipe.description && !hasInternalSeoCopy(recipe.description)
      ? sanitizeOverviewHtml(recipe.description)
      : "";

  return description ? (
    <div
      className="rich-content recipe-rich-content recipe-overview-copy text-[15px] leading-8 text-[#5e5146] dark:text-[#b3c0b9]"
      dangerouslySetInnerHTML={{ __html: description }}
    />
  ) : (
    <p className="text-sm leading-7 text-[#75685c] dark:text-[#b1bdb7]">
      This recipe story is being prepared. Ingredients and steps below are
      ready to help you cook.
    </p>
  );
};

export default RecipeOverview;
