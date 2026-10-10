"use client";

import { type FormEvent, useState } from "react";
import { LoaderCircle, Newspaper } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { ArticleCategoryOption } from "@/components/admin/articles/article-types";
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

export function ArticleCreateDrawer({
  open,
  onOpenChange,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ArticleCategoryOption[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;
    try {
      setSubmitting(true);
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), categoryId: categoryId || null }),
      });
      if (!response.ok) throw new Error("Unable to create article.");
      const article = (await response.json()) as { id: string };
      toast.success("Article draft created");
      onOpenChange(false);
      router.push(`/admin/articles/${article.id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create article.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 border-border/70 bg-background p-0 sm:max-w-[560px]">
        <SheetHeader className="border-b bg-card/70 px-6 py-6 text-left">
          <SheetTitle className="text-2xl">Create article</SheetTitle>
          <SheetDescription>Start a draft, then add rich content, cover media and search details.</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <div className="rounded-3xl border border-primary/15 bg-primary/[0.04] p-4">
              <Newspaper className="mb-3 size-5 text-primary" />
              <p className="text-sm text-muted-foreground">
                The draft opens in the article studio with Tiptap editing and media library access.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="article-title">Article title</Label>
              <Input id="article-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Seasonal vegetables for summer meals" className="h-12 rounded-xl" disabled={submitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="article-category">Starting category</Label>
              <select id="article-category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="h-12 w-full cursor-pointer rounded-xl border border-input bg-background px-4 text-sm" disabled={submitting}>
                <option value="">Assign later</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
              </select>
            </div>
          </div>
          <SheetFooter className="border-t bg-background px-6 py-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={!title.trim() || submitting}>
              {submitting && <LoaderCircle className="animate-spin" />}
              Create draft
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
