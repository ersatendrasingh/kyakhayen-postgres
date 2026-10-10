import Image from "next/image";
import Link from "next/link";
import { AlarmClock, ArrowUpRight, Leaf, Sparkles } from "lucide-react";
import { RecipeWithCategory } from "@/types/recipe";
import { formatTime } from "@/lib/formatTime";
import { recipeHref } from "@/lib/seo";

interface MealPlanCardProps {
  recipe: RecipeWithCategory;
}

const MealPlanCard = ({ recipe }: MealPlanCardProps) => {
  const totalTime = recipe.recipeCookingTime
    ? recipe.recipeCookingTime.prepTime +
      recipe.recipeCookingTime.cookTime +
      recipe.recipeCookingTime.restTime
    : null;
  const nutrient = recipe.recipeNutrient?.[0]?.nutrient.title;
  const recipeType = recipe.recipeRecipeType?.[0]?.recipeType.title;
  const category = recipe.RecipeCategories?.name;
  const timeLabel =
    totalTime === null
      ? null
      : totalTime === 1
        ? "1 min"
        : formatTime(totalTime);

  return (
    <Link
      href={recipeHref(recipe)}
      className="group flex min-h-[118px] overflow-hidden rounded-xl border border-[#eadfcc] bg-white transition hover:border-[#d7b991] hover:shadow-sm dark:border-white/10 dark:bg-[#142b23] dark:hover:border-[#d9a556] dark:hover:shadow-none"
    >
      <div className="relative w-[104px] shrink-0 overflow-hidden bg-[#f6ead9] dark:bg-[#20382f]">
        <Image
          className="object-cover transition duration-300 group-hover:scale-105"
          src={recipe.imageUrl || "/assets/images/default-recipe.png"}
          alt={recipe.title || "Recipe"}
          fill
          sizes="104px"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between px-3 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9a6b42] dark:text-[#d7a45d]">
              {recipeType || category || "Recipe"}
            </p>
            <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-[#2c2118] dark:text-[#f5f1e8]">
              {recipe.title}
            </h3>
          </div>
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[#eadfcc] text-[#9a6b42] transition group-hover:border-primary group-hover:text-primary dark:border-white/10 dark:text-[#d7a45d] dark:group-hover:border-[#d9a556] dark:group-hover:text-[#e1b366]">
            <ArrowUpRight className="size-3.5" />
          </span>
        </div>
        <div className="mt-3 flex min-w-0 flex-wrap items-center gap-1.5 text-[11px] font-medium text-[#806c5d] dark:text-[#9eaea6]">
          {timeLabel && (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#fff7eb] px-2 py-1 text-[#78461f] dark:bg-white/10 dark:text-[#e1b366]">
              <AlarmClock className="size-3 text-primary" />
              {timeLabel}
            </span>
          )}
          {nutrient ? (
            <span className="flex max-w-full items-center gap-1 truncate rounded-full bg-[#eef7ec] px-2 py-1 text-[#3f6b3f] dark:bg-emerald-400/10 dark:text-emerald-200">
              <Leaf className="size-3 shrink-0" />
              <span className="truncate">{nutrient}</span>
            </span>
          ) : null}
          {!nutrient && category ? (
            <span className="flex max-w-full items-center gap-1 truncate rounded-full bg-[#f4efe7] px-2 py-1 text-[#705b46] dark:bg-white/10 dark:text-[#c2ccc6]">
              <Sparkles className="size-3 shrink-0" />
              <span className="truncate">{category}</span>
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
};

export default MealPlanCard;
