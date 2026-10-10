"use client";

import { ShoppingBasket } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { RecipeIngredientType } from "@/types/recipe";

interface RecipeIngredientsProps {
  recipeIngredients: RecipeIngredientType[];
  quantity: number;
}

const displayQuantity = (quantity: number) =>
  Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");

const RecipeIngredients = ({
  recipeIngredients,
  quantity,
}: RecipeIngredientsProps) => {
  const [checkedIngredients, setCheckedIngredients] = useState<string[]>([]);

  const handleCheckboxChange = (ingredientId: string) => {
    setCheckedIngredients((current) =>
      current.includes(ingredientId)
        ? current.filter((id) => id !== ingredientId)
        : [...current, ingredientId],
    );
  };

  if (recipeIngredients.length === 0) {
    return (
      <div className="rounded-2xl bg-[#fbf5ea] p-6 text-center text-sm text-[#75685c] dark:bg-[#162e27] dark:text-[#b1bdb7]">
        Ingredient details will be added shortly.
      </div>
    );
  }

  return (
    <div>
      <p className="mb-5 flex items-center gap-2 text-sm text-[#76675b] dark:text-[#aab8b1]">
        <ShoppingBasket className="size-4 text-[#b47e3c]" />
        Tick items as you prepare your counter.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {recipeIngredients.map((ingredient) => {
          const checked = checkedIngredients.includes(ingredient.id);
          const unit = ingredient.unit?.shortName || ingredient.unit?.title || "";
          const form = ingredient.ingredientForm?.name;
          return (
            <li key={ingredient.id}>
              <label
                htmlFor={ingredient.id}
                className={cn(
                  "flex min-h-[66px] cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition",
                  checked
                    ? "border-[#cadcc7] bg-[#eef5e9] dark:border-[#33594b] dark:bg-[#17372d]"
                    : "border-[#eee2d1] bg-[#fffdf9] hover:border-[#dfc696] hover:bg-[#fcf5e8] dark:border-white/8 dark:bg-[#132a23] dark:hover:border-[#4c6b5d]",
                )}
              >
                <Checkbox
                  id={ingredient.id}
                  className="shrink-0 border-[#b9904f] data-[state=checked]:border-[#388552] data-[state=checked]:bg-[#388552] data-[state=checked]:text-white"
                  checked={checked}
                  onCheckedChange={() => handleCheckboxChange(ingredient.id)}
                />
                {ingredient.ingredient.imageUrl && (
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-[#eadbc6] dark:border-white/10">
                    <Image
                      src={ingredient.ingredient.imageUrl}
                      alt={ingredient.ingredient.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                )}
                <span className={cn("min-w-0", checked && "opacity-65")}>
                  <span
                    className={cn(
                      "block text-sm font-semibold text-[#322820] dark:text-[#edf1eb]",
                      checked && "line-through",
                    )}
                  >
                    {ingredient.ingredient.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-[#806d5e] dark:text-[#a5b4ad]">
                    {displayQuantity(Number(ingredient.quantity) * quantity)}{" "}
                    {unit}
                    {form ? ` - ${form}` : ""}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default RecipeIngredients;
