"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { MediaField } from "@/components/admin/media/media-field";
import type { RecipeTypeRecord } from "@/components/admin/recipe-recipe-types/recipe-type-types";
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

type RecipeTypeDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipeType: RecipeTypeRecord | null;
  onSaved: () => void;
};

export function RecipeTypeDrawer({ open, onOpenChange, recipeType, onSaved }: RecipeTypeDrawerProps) {
  const [title, setTitle] = useState(recipeType?.title ?? "");
  const [preview, setPreview] = useState<string | null>(recipeType?.imageUrl ?? null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error("Recipe type title is required");
      return;
    }

    try {
      setSubmitting(true);
      let recipeTypeId = recipeType?.id;
      if (recipeTypeId) {
        const response = await fetch(`/api/recipes/recipe-types/${recipeTypeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmedTitle, imageUrl: preview }),
        });
        if (!response.ok) throw new Error("Unable to update recipe type.");
      } else {
        const response = await fetch("/api/recipes/recipe-types", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmedTitle, imageUrl: preview }),
        });
        if (!response.ok) throw new Error("Unable to create recipe type.");
        const created = (await response.json()) as { id: string };
        recipeTypeId = created.id;
      }

      toast.success(recipeType ? "Recipe type updated successfully" : "Recipe type created successfully");
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save recipe type.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 border-border/70 bg-background p-0 sm:max-w-[560px]">
        <SheetHeader className="border-b bg-card/70 px-6 py-6 text-left">
          <SheetTitle className="text-2xl">{recipeType ? "Edit recipe type" : "Create recipe type"}</SheetTitle>
          <SheetDescription>Manage recipe group labels used for browsing and meal planning.</SheetDescription>
        </SheetHeader>
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <div className="rounded-3xl border border-primary/15 bg-primary/[0.04] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Recipe Group</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Use clear grouping labels that help people discover the right kind of recipe.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipe-type-title">Recipe type title</Label>
              <Input id="recipe-type-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Quick Meals" className="h-12 rounded-xl" disabled={submitting} />
            </div>
            <MediaField label="Featured image" value={preview} onChange={setPreview} disabled={submitting} />
          </div>
          <SheetFooter className="border-t bg-background px-6 py-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={!title.trim() || submitting}>
              {submitting && <LoaderCircle className="animate-spin" />}
              {recipeType ? "Update Recipe Type" : "Create Recipe Type"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
