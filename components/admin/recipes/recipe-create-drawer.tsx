"use client";

import { useState } from "react";
import { BookOpen, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { RecipeFilterOption } from "@/components/admin/recipes/recipe-types";
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

export function RecipeCreateDrawer({
  open,
  onOpenChange,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: RecipeFilterOption[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) {
      toast.error("Recipe title is required.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          recipeCategoriesId: categoryId || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to create recipe draft.");
      }

      const created = (await response.json()) as { id: string };
      toast.success("Recipe draft created. Complete the recipe workspace next.");
      onOpenChange(false);
      router.push(`/admin/recipes/${created.id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create recipe.");
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
          <SheetTitle className="text-2xl">Create recipe draft</SheetTitle>
          <SheetDescription>
            Start with the recipe identity, then complete ingredients, steps and discovery tags.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <div className="rounded-3xl border border-primary/15 bg-primary/[0.04] p-4">
              <div className="flex items-center gap-2 text-primary">
                <BookOpen className="size-4" />
                <p className="text-xs font-semibold uppercase tracking-[0.2em]">Recipe Workflow</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                New recipes remain draft until title, description and cover image are ready.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipe-title">Recipe title</Label>
              <Input
                id="recipe-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Paneer tikka bowl"
                className="h-12 rounded-xl"
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label>Primary category</Label>
              <Select value={categoryId} onValueChange={setCategoryId} disabled={submitting}>
                <SelectTrigger className="!h-12 w-full rounded-xl">
                  <SelectValue placeholder="Choose category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <SheetFooter className="border-t bg-background px-6 py-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || submitting}>
              {submitting && <LoaderCircle className="animate-spin" />}
              Create and Continue
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
