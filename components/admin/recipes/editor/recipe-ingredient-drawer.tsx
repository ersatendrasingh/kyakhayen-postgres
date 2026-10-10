"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, Search } from "lucide-react";
import { toast } from "sonner";

import type {
  RecipeEditorIngredient,
  RecipeEditorOption,
} from "@/components/admin/recipes/editor/recipe-editor-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const selectClassName =
  "h-12 w-full cursor-pointer rounded-xl border border-input bg-background px-4 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function RecipeIngredientDrawer({
  open,
  onOpenChange,
  recipeId,
  ingredient,
  ingredients,
  ingredientOptions,
  unitOptions,
  formOptions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipeId: string;
  ingredient: RecipeEditorIngredient | null;
  ingredients: RecipeEditorIngredient[];
  ingredientOptions: RecipeEditorOption[];
  unitOptions: RecipeEditorOption[];
  formOptions: RecipeEditorOption[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [ingredientId, setIngredientId] = useState(ingredient?.ingredientId ?? "");
  const [quantity, setQuantity] = useState(String(ingredient?.quantity ?? 1));
  const [unitId, setUnitId] = useState(ingredient?.unitId ?? "");
  const [formId, setFormId] = useState(ingredient?.formId ?? "");
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(ingredient);
  const selectedIngredient = ingredientOptions.find((option) => option.id === ingredientId);
  const usedIds = useMemo(
    () => new Set(ingredients.map((item) => item.ingredientId)),
    [ingredients]
  );
  const matchingIngredients = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = ingredientOptions.filter((option) =>
      normalizedQuery ? option.label.toLowerCase().includes(normalizedQuery) : true
    );
    const selectedIndex = filtered.findIndex((option) => option.id === ingredientId);

    if (selectedIndex > 0) {
      const [selected] = filtered.splice(selectedIndex, 1);
      filtered.unshift(selected);
    }

    return filtered.slice(0, 32);
  }, [ingredientId, ingredientOptions, query]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!ingredientId || !unitId || !formId || !Number(quantity)) {
      toast.warning("Select ingredient, form, unit and quantity.");
      return;
    }
    try {
      setSaving(true);
      const endpoint = ingredient
        ? `/api/recipes/${recipeId}/ingredients/${ingredient.id}`
        : `/api/recipes/${recipeId}/ingredients`;
      const response = await fetch(endpoint, {
        method: ingredient ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredientId,
          quantity: Number(quantity),
          unitId,
          formId,
        }),
      });
      if (!response.ok) throw new Error(`Unable to ${isEditing ? "update" : "add"} ingredient.`);
      toast.success(isEditing ? "Ingredient updated" : "Ingredient added");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save ingredient.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 border-border/70 bg-background p-0 sm:max-w-[620px]"
      >
        <SheetHeader className="border-b bg-card/70 px-5 py-6 text-left sm:px-6">
          <SheetTitle className="text-2xl">
            {isEditing ? "Edit ingredient" : "Add ingredient"}
          </SheetTitle>
          <SheetDescription>
            Choose the ingredient first, then define the serving measurement and preparation form.
          </SheetDescription>
          {ingredient ? (
            <div className="mt-4 rounded-2xl border border-primary/25 bg-primary/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Currently editing
              </p>
              <p className="mt-2 font-semibold text-foreground">{ingredient.ingredientName}</p>
              <p className="text-sm text-muted-foreground">
                {ingredient.quantity} {ingredient.unitName} / {ingredient.formName}
              </p>
            </div>
          ) : null}
        </SheetHeader>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6 sm:px-6">
            <section className="space-y-3">
              <Label htmlFor="drawer-ingredient-search">Choose ingredient</Label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="drawer-ingredient-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search ingredients or browse below"
                  className="h-12 rounded-xl pl-11"
                  autoComplete="off"
                />
              </div>
              <div className="overflow-hidden rounded-2xl border">
                <div className="flex items-center justify-between border-b bg-muted/25 px-4 py-3 text-sm text-muted-foreground">
                  <span>{query.trim() ? "Matching ingredients" : "Available ingredients"}</span>
                  <span>{ingredientOptions.length} total</span>
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                  {matchingIngredients.length ? (
                    matchingIngredients.map((option) => {
                      const selected = ingredientId === option.id;
                      const alreadyUsed = usedIds.has(option.id) && ingredient?.ingredientId !== option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setIngredientId(option.id)}
                          className={cn(
                            "flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                            selected ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                          )}
                        >
                          <span>{option.label}</span>
                          {selected ? (
                            <Check className="size-4" />
                          ) : alreadyUsed ? (
                            <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                              Used
                            </span>
                          ) : null}
                        </button>
                      );
                    })
                  ) : (
                    <p className="p-6 text-center text-sm text-muted-foreground">
                      No ingredient matched this search.
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border bg-muted/15 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Selected Ingredient
                </p>
                <p className="mt-2 font-medium">
                  {selectedIngredient?.label ?? "Choose an ingredient from the list"}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="drawer-ingredient-quantity">Quantity</Label>
                  <Input
                    id="drawer-ingredient-quantity"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="drawer-ingredient-unit">Unit</Label>
                  <select id="drawer-ingredient-unit" value={unitId} onChange={(event) => setUnitId(event.target.value)} className={selectClassName}>
                    <option value="">Select unit</option>
                    {unitOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="drawer-ingredient-form">Preparation</Label>
                  <select id="drawer-ingredient-form" value={formId} onChange={(event) => setFormId(event.target.value)} className={selectClassName}>
                    <option value="">Select form</option>
                    {formOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                  </select>
                </div>
              </div>
            </section>
          </div>
          <SheetFooter className="border-t bg-background px-5 py-5 sm:flex-row sm:justify-end sm:px-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving} className="cursor-pointer rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={!ingredientId || !unitId || !formId || saving} className="cursor-pointer rounded-xl">
              {saving && <LoaderCircle className="size-4 animate-spin" />}
              {isEditing ? "Update ingredient" : "Add ingredient"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
