"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { MediaField } from "@/components/admin/media/media-field";
import type { ArticleTagRecord } from "@/components/admin/article-tags/article-tag-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function ArticleTagDrawer({ open, onOpenChange, tag, onSaved }: { open: boolean; onOpenChange: (open: boolean) => void; tag: ArticleTagRecord | null; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      setTitle(tag?.title ?? "");
      setImageUrl(tag?.imageUrl ?? null);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [tag, open]);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return toast.error("Tag title is required");
    try {
      setSubmitting(true);
      const response = await fetch(tag ? `/api/articles/tags/${tag.id}` : "/api/articles/tags", { method: tag ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: title.trim(), imageUrl }) });
      if (!response.ok) throw new Error("Unable to save article tag.");
      toast.success(tag ? "Article tag updated" : "Article tag created");
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save tag.");
    } finally { setSubmitting(false); }
  };
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent side="right" className="w-full gap-0 border-border/70 bg-background p-0 sm:max-w-[560px]"><SheetHeader className="border-b bg-card/70 px-6 py-6 text-left"><SheetTitle className="text-2xl">{tag ? "Edit article tag" : "Create article tag"}</SheetTitle><SheetDescription>Build discoverable themes readers can use to find related stories.</SheetDescription></SheetHeader><form onSubmit={submit} className="flex min-h-0 flex-1 flex-col"><div className="flex-1 space-y-6 overflow-y-auto px-6 py-6"><div className="rounded-3xl border border-primary/15 bg-primary/[0.04] p-4"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Editorial discovery</p><p className="mt-2 text-sm text-muted-foreground">Tags connect stories across categories and help surface seasonal ideas.</p></div><div className="space-y-2"><Label htmlFor="article-tag-title">Tag title</Label><Input id="article-tag-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Weeknight Cooking" className="h-12 rounded-xl" disabled={submitting} /></div><MediaField label="Featured image" value={imageUrl} onChange={setImageUrl} disabled={submitting} /></div><SheetFooter className="border-t bg-background px-6 py-5 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button><Button type="submit" disabled={!title.trim() || submitting}>{submitting && <LoaderCircle className="animate-spin" />}{tag ? "Update tag" : "Create tag"}</Button></SheetFooter></form></SheetContent></Sheet>;
}
