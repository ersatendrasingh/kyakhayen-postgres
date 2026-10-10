"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { MediaField } from "@/components/admin/media/media-field";
import type { RecipeCategoryRecord } from "@/components/admin/recipe-categories/recipe-category-types";
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

type RecipeCategoryDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: RecipeCategoryRecord | null;
  onSaved: () => void;
};

export function RecipeCategoryDrawer({
  open,
  onOpenChange,
  category,
  onSaved,
}: RecipeCategoryDrawerProps) {
  const [name, setName] = useState(category?.name ?? "");
  const [preview, setPreview] = useState<string | null>(category?.imageUrl ?? null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      toast.error("Category name is required");
      return;
    }

    try {
      setSubmitting(true);
      let categoryId = category?.id;

      if (categoryId) {
        const response = await fetch(`/api/recipes/categories/${categoryId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmedName, imageUrl: preview }),
        });

        if (!response.ok) throw new Error("Unable to update category.");
      } else {
        const response = await fetch("/api/recipes/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmedName, imageUrl: preview }),
        });

        if (!response.ok) throw new Error("Unable to create category.");
        const created = (await response.json()) as { id: string };
        categoryId = created.id;
      }

      toast.success(category ? "Category updated successfully" : "Category created successfully");
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save category.");
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
          <SheetTitle className="text-2xl">
            {category ? "Edit category" : "Create category"}
          </SheetTitle>
          <SheetDescription>
            Build clean recipe discovery groups for the Kya Khayen catalogue.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <div className="rounded-3xl border border-primary/15 bg-primary/[0.04] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Recipe taxonomy
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Categories are used for browsing and recipe organization across the platform.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipe-category-name">Category name</Label>
              <Input
                id="recipe-category-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Breakfast"
                className="h-12 rounded-xl"
                disabled={submitting}
              />
            </div>

            <MediaField label="Featured image" value={preview} onChange={setPreview} disabled={submitting} />
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
            <Button type="submit" disabled={!name.trim() || submitting}>
              {submitting && <LoaderCircle className="animate-spin" />}
              {category ? "Update Category" : "Create Category"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
