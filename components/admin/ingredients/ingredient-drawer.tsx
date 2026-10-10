"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { IngredientCategoryOption } from "@/components/admin/ingredients/ingredient-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function IngredientDrawer({
  open,
  onOpenChange,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: IngredientCategoryOption[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !categoryId) {
      toast.error("Ingredient name and category are required.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), ingredientCategoriesId: categoryId }),
      });

      if (!response.ok) {
        throw new Error("Unable to create ingredient.");
      }

      const created = (await response.json()) as { id: string };
      toast.success("Ingredient draft created. Add nutrition and measurements next.");
      onOpenChange(false);
      router.push(`/admin/ingredients/${created.id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create ingredient.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 border-border/70 bg-background p-0 sm:max-w-[560px]"
      >
        <SheetHeader className="border-b bg-card/70 px-6 py-6 text-left">
          <SheetTitle className="text-2xl">Create ingredient</SheetTitle>
          <SheetDescription>
            Start the ingredient record here, then complete its nutrition and measurement mappings.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <div className="rounded-3xl border border-primary/15 bg-primary/[0.04] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Nutrition Source
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                New ingredients stay draft until category, nutrient values and unit conversions are reviewed.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ingredient-name">Ingredient name</Label>
              <Input
                id="ingredient-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Paneer"
                className="h-12 rounded-xl"
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId} disabled={submitting}>
                <SelectTrigger className="!h-12 w-full rounded-xl">
                  <SelectValue placeholder="Choose an ingredient category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <SheetFooter className="border-t bg-background px-6 py-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || !categoryId || submitting}>
              {submitting && <LoaderCircle className="animate-spin" />}
              Create and Continue
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
