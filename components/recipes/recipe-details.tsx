"use client";

import {
  BookOpen,
  CookingPot,
  ListChecks,
  Minus,
  Plus,
  Salad,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import RecipeIngredients from "@/components/recipes/recipe-ingredients";
import RecipeMethods from "@/components/recipes/recipe-methods";
import RecipeNutritionFacts from "@/components/recipes/recipe-nutrition-facts";
import RecipeOverview from "@/components/recipes/recipe-overview";
import RecipeSmartGuide from "@/components/recipes/recipe-smart-guide";
import type { HomeRecipeCardRecipe } from "@/components/recipes/home-recipe-card";
import type { RecipeWithCategory } from "@/types/recipe";

type DetailTab = "overview" | "guide" | "ingredients" | "methods" | "nutrition";

const tabs = [
  { key: "overview" as DetailTab, label: "Overview", icon: BookOpen },
  { key: "guide" as DetailTab, label: "Guide", icon: Sparkles },
  { key: "ingredients" as DetailTab, label: "Ingredients", icon: Salad },
  { key: "methods" as DetailTab, label: "Steps", icon: ListChecks },
  { key: "nutrition" as DetailTab, label: "Nutrition", icon: CookingPot },
];

interface RecipeDetailsProps {
  recipe: RecipeWithCategory;
  relatedRecipes?: HomeRecipeCardRecipe[];
}

const RecipeDetails = ({ recipe, relatedRecipes = [] }: RecipeDetailsProps) => {
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [quantity, setQuantity] = useState(1);
  const overviewRef = useRef<HTMLElement>(null);
  const guideRef = useRef<HTMLElement>(null);
  const ingredientsRef = useRef<HTMLElement>(null);
  const methodsRef = useRef<HTMLElement>(null);
  const nutritionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) {
          setActiveTab(visible.target.getAttribute("data-tab") as DetailTab);
        }
      },
      { threshold: 0.28, rootMargin: "-100px 0px -34% 0px" },
    );
    [overviewRef, guideRef, ingredientsRef, methodsRef, nutritionRef].forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });
    return () => observer.disconnect();
  }, []);

  const goToSection = (key: DetailTab) => {
    setActiveTab(key);
    const sectionRef =
      key === "overview"
        ? overviewRef
        : key === "guide"
          ? guideRef
          : key === "ingredients"
            ? ingredientsRef
            : key === "methods"
              ? methodsRef
              : nutritionRef;
    sectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="relative space-y-5">
      <div className="home-hide-scrollbar sticky top-[64px] z-30 flex gap-2 overflow-x-auto rounded-2xl border border-[#eadcc8] bg-[#fffdf8]/94 p-2 shadow-[0_14px_36px_-30px_rgba(45,30,20,0.48)] backdrop-blur-lg lg:top-[66px] dark:border-white/10 dark:bg-[#10221d]/95">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => goToSection(key)}
            className={`flex min-w-max flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-medium transition ${
              activeTab === key
                ? "bg-[#18382d] text-white shadow-sm dark:bg-[#d5ad61] dark:text-[#102019]"
                : "text-[#655549] hover:bg-[#f6eddf] dark:text-[#b4c1b9] dark:hover:bg-white/5"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      <section
        id="recipe-overview"
        ref={overviewRef}
        data-tab="overview"
        className="recipe-detail-panel scroll-mt-36 rounded-[1.75rem] border border-[#eadcc8] bg-[#fffdf8] p-5 shadow-sm sm:p-7 dark:border-white/10 dark:bg-[#10221d]"
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#a47a3f] dark:text-[#d6ad63]">
          From the kitchen
        </p>
        <h2 className="mb-6 text-2xl font-semibold text-[#2e251f] dark:text-[#f2f3ed]">
          About {recipe.title}
        </h2>
        <RecipeOverview recipe={recipe} />
      </section>

      <section
        id="recipe-guide"
        ref={guideRef}
        data-tab="guide"
        className="recipe-detail-panel scroll-mt-36 rounded-[1.75rem] border border-[#eadcc8] bg-[#fffdf8] p-5 shadow-sm sm:p-7 dark:border-white/10 dark:bg-[#10221d]"
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#a47a3f] dark:text-[#d6ad63]">
          Cook smarter
        </p>
        <h2 className="mb-6 text-2xl font-semibold text-[#2e251f] dark:text-[#f2f3ed]">
          Recipe guide
        </h2>
        <RecipeSmartGuide recipe={recipe} relatedRecipes={relatedRecipes} />
      </section>

      <section
        id="recipe-ingredients"
        ref={ingredientsRef}
        data-tab="ingredients"
        className="recipe-detail-panel scroll-mt-36 rounded-[1.75rem] border border-[#eadcc8] bg-[#fffdf8] p-5 shadow-sm sm:p-7 dark:border-white/10 dark:bg-[#10221d]"
      >
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#a47a3f] dark:text-[#d6ad63]">
              Prep your counter
            </p>
            <h2 className="text-2xl font-semibold text-[#2e251f] dark:text-[#f2f3ed]">
              Ingredients
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#e8d8c1] bg-[#fbf4e8] px-2 py-1.5 sm:gap-3 sm:px-3 sm:py-2 dark:border-white/10 dark:bg-[#162e27]">
            <span className="pl-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7e6957] sm:pl-1 sm:text-xs sm:tracking-[0.15em] dark:text-[#aab9b2]">
              Serves
            </span>
            <button
              type="button"
              aria-label="Decrease serving size"
              onClick={() => setQuantity(Math.max(quantity - 1, 1))}
              className="flex size-7 cursor-pointer items-center justify-center rounded-full bg-white text-[#47372b] shadow-sm sm:size-8 dark:bg-white/8 dark:text-white"
            >
              <Minus className="size-3.5 sm:size-4" />
            </button>
            <span className="min-w-4 text-center text-sm font-semibold text-[#30251d] sm:min-w-5 sm:text-base dark:text-white">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Increase serving size"
              onClick={() => setQuantity(quantity + 1)}
              className="flex size-7 cursor-pointer items-center justify-center rounded-full bg-[#b83324] text-white shadow-sm sm:size-8"
            >
              <Plus className="size-3.5 sm:size-4" />
            </button>
          </div>
        </div>
        <RecipeIngredients
          recipeIngredients={recipe.recipeIngredients}
          quantity={quantity}
        />
      </section>

      <section
        id="recipe-methods"
        ref={methodsRef}
        data-tab="methods"
        className="recipe-detail-panel scroll-mt-36 rounded-[1.75rem] border border-[#eadcc8] bg-[#fffdf8] p-5 shadow-sm sm:p-7 dark:border-white/10 dark:bg-[#10221d]"
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#a47a3f] dark:text-[#d6ad63]">
          Cook with confidence
        </p>
        <h2 className="mb-6 text-2xl font-semibold text-[#2e251f] dark:text-[#f2f3ed]">
          Method
        </h2>
        <RecipeMethods recipeMethods={recipe.recipeMethods} />
      </section>

      <section
        id="recipe-nutrition"
        ref={nutritionRef}
        data-tab="nutrition"
        className="recipe-detail-panel scroll-mt-36 rounded-[1.75rem] border border-[#eadcc8] bg-[#fffdf8] p-5 shadow-sm sm:p-7 dark:border-white/10 dark:bg-[#10221d]"
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#a47a3f] dark:text-[#d6ad63]">
          Know your plate
        </p>
        <h2 className="mb-6 text-2xl font-semibold text-[#2e251f] dark:text-[#f2f3ed]">
          Nutrition values
        </h2>
        <RecipeNutritionFacts
          recipeIngredients={recipe.recipeIngredients}
          quantity={quantity}
        />
      </section>
    </div>
  );
};

export default RecipeDetails;
