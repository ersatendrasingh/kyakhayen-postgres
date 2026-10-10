"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, LoaderCircle, SearchCheck, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type { ArticleCategoryOption, ArticleEditorRecord, ArticleTagOption } from "@/components/admin/articles/article-types";
import { MediaField } from "@/components/admin/media/media-field";
import { Editor } from "@/components/editor";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export function ArticleEditor({ article, categoryOptions, tagOptions }: { article: ArticleEditorRecord; categoryOptions: ArticleCategoryOption[]; tagOptions: ArticleTagOption[] }) {
  const router = useRouter();
  const [title, setTitle] = useState(article.title);
  const [content, setContent] = useState(article.content ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(article.imageUrl);
  const [metaTitle, setMetaTitle] = useState(article.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(article.metaDescription ?? "");
  const [metaSlug, setMetaSlug] = useState(article.metaSlug ?? "");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(article.categories.map((category) => category.id));
  const [selectedTagIds, setSelectedTagIds] = useState(article.tags.map((tag) => tag.id));
  const [savingContent, setSavingContent] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const completion = [Boolean(title.trim()), Boolean(content.trim()), Boolean(imageUrl), Boolean(metaTitle.trim()), selectedCategoryIds.length > 0, selectedTagIds.length > 0].filter(Boolean).length;
  const canPublish = Boolean(title.trim() && content.trim() && imageUrl);

  const patchArticle = async (values: object) => {
    const response = await fetch(`/api/articles/${article.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    if (!response.ok) throw new Error("Unable to save article changes.");
  };
  const saveContent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setSavingContent(true);
      await patchArticle({ title: title.trim(), content: content.trim() || null });
      toast.success("Article content saved");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save article.");
    } finally {
      setSavingContent(false);
    }
  };
  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setSavingSettings(true);
      await patchArticle({ imageUrl, metaTitle: metaTitle.trim() || null, metaDescription: metaDescription.trim() || null, metaSlug: metaSlug.trim() || null });
      const categoryResponse = await fetch(`/api/articles/${article.id}/categories`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ categoriesValues: selectedCategoryIds }) });
      if (!categoryResponse.ok) throw new Error("Unable to save article categories.");
      const tagResponse = await fetch(`/api/articles/${article.id}/tags`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tagIds: selectedTagIds }) });
      if (!tagResponse.ok) throw new Error("Unable to save article tags.");
      toast.success("Publishing details saved");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save article settings.");
    } finally {
      setSavingSettings(false);
    }
  };
  const updatePublished = async (checked: boolean) => {
    if (checked && !canPublish) {
      toast.warning("Add body content and a cover image before publishing.");
      return;
    }
    try {
      setPublishing(true);
      const response = await fetch(`/api/articles/${article.id}/${checked ? "publish" : "unpublish"}`, { method: "PATCH" });
      if (!response.ok) throw new Error("Unable to update publication status.");
      toast.success(`${article.title} ${checked ? "published" : "moved to drafts"}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update article.");
    } finally {
      setPublishing(false);
    }
  };
  const deleteArticle = async () => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/articles/${article.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Unable to delete this article.");
      toast.success("Article deleted");
      router.push("/admin/articles");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete article.");
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="admin-taxonomy-hero rounded-[32px] p-5 sm:p-7 lg:p-9">
        <div className="relative z-[1] flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge variant={article.isPublished ? "secondary" : "outline"}>{article.isPublished ? "Published" : "Draft"}</Badge>
              <span className="text-xs text-muted-foreground">Updated {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(article.updatedAt))}</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{article.title}</h1>
            <p className="admin-taxonomy-hero-copy mt-2 text-sm sm:text-base">Shape the story, visuals, categories and search presentation in one editorial workspace.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" className="admin-taxonomy-hero-action"><Link href="/admin/articles"><ArrowLeft /> Back</Link></Button>
            <div className="admin-taxonomy-hero-action flex h-10 items-center gap-3 rounded-xl border px-3 text-sm"><Switch checked={article.isPublished} disabled={publishing} onCheckedChange={(checked) => void updatePublished(checked)} className="cursor-pointer" />{article.isPublished ? "Published" : "Draft"}</div>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button size="icon" variant="outline" className="admin-taxonomy-hero-action" aria-label="Delete article"><Trash2 /></Button></AlertDialogTrigger>
              <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this article?</AlertDialogTitle><AlertDialogDescription>This permanently removes the story and its category relationships.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={deleting} onClick={() => void deleteArticle()}>{deleting ? "Deleting..." : "Delete article"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <div className="relative z-[1] mt-7 grid gap-4 sm:grid-cols-3">
          <div className="admin-taxonomy-stat rounded-3xl p-5"><p className="text-sm text-muted-foreground">Publishing readiness</p><p className="mt-2 text-3xl font-semibold">{completion}/6</p></div>
          <div className="admin-taxonomy-stat rounded-3xl p-5"><p className="text-sm text-muted-foreground">Categories</p><p className="mt-2 text-3xl font-semibold">{selectedCategoryIds.length}</p></div>
          <div className="admin-taxonomy-stat rounded-3xl p-5"><p className="text-sm text-muted-foreground">Tags</p><p className="mt-2 text-3xl font-semibold">{selectedTagIds.length}</p></div>
        </div>
      </section>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <Card className="overflow-hidden rounded-2xl py-0">
          <CardHeader className="border-b p-5 sm:p-6">
            <CardTitle className="flex items-center gap-3 text-xl"><span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><FileText className="size-5" /></span>Article content</CardTitle>
            <p className="text-sm text-muted-foreground">Write rich content with headings, links and media selected directly from your library.</p>
          </CardHeader>
          <CardContent className="p-5 sm:p-6">
            <form onSubmit={saveContent} className="space-y-6">
              <div className="space-y-2"><Label htmlFor="article-editor-title">Article title</Label><Input id="article-editor-title" value={title} onChange={(event) => setTitle(event.target.value)} className="h-12 rounded-xl text-base" /></div>
              <div className="space-y-2"><Label>Story body</Label><Editor value={content} onChange={setContent} /><p className="text-xs text-muted-foreground">Use the image button in the toolbar to insert assets from the media library.</p></div>
              <div className="flex justify-end"><Button type="submit" disabled={savingContent || !title.trim()} className="h-11 min-w-44 rounded-xl">{savingContent && <LoaderCircle className="animate-spin" />}Save content</Button></div>
            </form>
          </CardContent>
        </Card>
        <form onSubmit={saveSettings} className="space-y-6">
          <Card className="rounded-2xl py-0">
            <CardHeader className="border-b p-5"><CardTitle className="flex items-center gap-3 text-lg"><Settings2 className="size-5 text-primary" />Presentation</CardTitle></CardHeader>
            <CardContent className="space-y-5 p-5">
              <MediaField label="Cover image" value={imageUrl} onChange={setImageUrl} description="Used on listing cards and the article header" />
              <div className="space-y-2"><Label>Categories</Label><div className="max-h-48 space-y-2 overflow-y-auto rounded-2xl border bg-muted/10 p-3">{categoryOptions.map((category) => <label key={category.id} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 hover:bg-muted/50"><input type="checkbox" checked={selectedCategoryIds.includes(category.id)} onChange={(event) => setSelectedCategoryIds((current) => event.target.checked ? [...current, category.id] : current.filter((id) => id !== category.id))} className="size-4 accent-primary" /><span className="text-sm">{category.label}</span></label>)}</div></div>
              <div className="space-y-2"><Label>Tags</Label><div className="max-h-48 space-y-2 overflow-y-auto rounded-2xl border bg-muted/10 p-3">{tagOptions.map((tag) => <label key={tag.id} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 hover:bg-muted/50"><input type="checkbox" checked={selectedTagIds.includes(tag.id)} onChange={(event) => setSelectedTagIds((current) => event.target.checked ? [...current, tag.id] : current.filter((id) => id !== tag.id))} className="size-4 accent-primary" /><span className="text-sm">{tag.label}</span></label>)}</div></div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl py-0">
            <CardHeader className="border-b p-5"><CardTitle className="flex items-center gap-3 text-lg"><SearchCheck className="size-5 text-primary" />Search preview</CardTitle></CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="space-y-2"><Label htmlFor="meta-title">Meta title</Label><Input id="meta-title" value={metaTitle} onChange={(event) => setMetaTitle(event.target.value)} className="h-11 rounded-xl" /><p className="text-xs text-muted-foreground">{metaTitle.length}/60 characters</p></div>
              <div className="space-y-2"><Label htmlFor="meta-description">Meta description</Label><Textarea id="meta-description" value={metaDescription} onChange={(event) => setMetaDescription(event.target.value)} className="min-h-24 rounded-xl" /><p className="text-xs text-muted-foreground">{metaDescription.length}/160 characters</p></div>
              <div className="space-y-2"><Label htmlFor="meta-slug">Search slug</Label><Input id="meta-slug" value={metaSlug} onChange={(event) => setMetaSlug(event.target.value.replace(/\s+/g, "-").toLowerCase())} className="h-11 rounded-xl" placeholder={article.slug} /></div>
              <Button type="submit" disabled={savingSettings} className="h-11 w-full rounded-xl">{savingSettings && <LoaderCircle className="animate-spin" />}Save publishing details</Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
