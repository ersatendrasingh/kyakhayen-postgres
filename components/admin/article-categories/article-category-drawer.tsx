"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { MediaField } from "@/components/admin/media/media-field";
import type { ArticleCategoryRecord } from "@/components/admin/article-categories/article-category-types";
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

type ArticleCategoryDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: ArticleCategoryRecord | null;
  onSaved: () => void;
};

export function ArticleCategoryDrawer({
  open,
  onOpenChange,
  category,
  onSaved,
}: ArticleCategoryDrawerProps) {
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      setTitle(category?.title ?? "");
      setImageUrl(category?.imageUrl ?? null);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [category, open]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      toast.error("Category title is required");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(
        category ? `/api/articles/categories/${category.id}` : "/api/articles/categories",
        {
          method: category ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmedTitle, imageUrl }),
        }
      );

      if (!response.ok) {
        const message = await response.json().catch(() => null);
        throw new Error(typeof message === "string" ? message : "Unable to save category.");
      }

      toast.success(category ? "Article category updated" : "Article category created");
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
            {category ? "Edit article category" : "Create article category"}
          </SheetTitle>
          <SheetDescription>
            Organize editorial stories into clear, image-led reading collections.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <div className="rounded-3xl border border-primary/15 bg-primary/[0.04] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Editorial taxonomy
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Category imagery appears in discovery surfaces and keeps article browsing visual.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="article-category-title">Category title</Label>
              <Input
                id="article-category-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Kitchen Guides"
                className="h-12 rounded-xl"
                disabled={submitting}
              />
            </div>

            <MediaField
              label="Featured image"
              value={imageUrl}
              onChange={setImageUrl}
              disabled={submitting}
            />
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
            <Button type="submit" disabled={!title.trim() || submitting}>
              {submitting && <LoaderCircle className="animate-spin" />}
              {category ? "Update category" : "Create category"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
