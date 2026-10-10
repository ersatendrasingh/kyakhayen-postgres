"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LoaderCircle,
  SearchCheck,
} from "lucide-react";
import { toast } from "sonner";

import type { RecipeEditorRecord } from "@/components/admin/recipes/editor/recipe-editor-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { auditRecipeContent } from "@/lib/recipe-content-audit";
import { recipeHref, seoDescription, seoTitle } from "@/lib/seo";
import { cn } from "@/lib/utils";

function gradeClass(grade: string) {
  if (grade === "Excellent") return "text-emerald-600";
  if (grade === "Good") return "text-lime-600";
  if (grade === "Needs work") return "text-amber-600";
  return "text-red-600";
}

function meterTone(percent: number) {
  if (percent >= 85) return "bg-emerald-500";
  if (percent >= 60) return "bg-amber-500";
  return "bg-red-500";
}

function meterText(percent: number) {
  if (percent >= 85) return "Good";
  if (percent >= 60) return "Needs work";
  return "Fix";
}

function Meter({ value, className }: { value: number; className?: string }) {
  const safeValue = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-muted", className)}>
      <div
        className={cn("h-full rounded-full transition-all", meterTone(safeValue))}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

function fieldScore(value: string, min: number, max: number) {
  const length = value.trim().length;
  if (length === 0) return 0;
  if (length >= min && length <= max) return 100;
  if (length < min) return Math.round((length / min) * 75);
  return Math.max(35, 100 - Math.round(((length - max) / max) * 80));
}

function slugScore(value: string, fallback: string) {
  const slug = (value || fallback).trim();
  if (!slug) return 0;
  if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 80) return 100;
  if (/^[a-z0-9-]+$/.test(slug)) return 70;
  return 35;
}

function fieldHelp(kind: "title" | "description" | "slug", score: number) {
  if (score >= 85) return "Looks good";
  if (kind === "title") return "Aim for a natural 25-62 character title.";
  if (kind === "description") return "Aim for 110-158 characters with dish, ingredient and use case.";
  return "Use lowercase words with hyphens only.";
}

export function RecipeSeoAuditCard({ recipe }: { recipe: RecipeEditorRecord }) {
  const router = useRouter();
  const [metaTitle, setMetaTitle] = useState(recipe.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(recipe.metaDescription ?? "");
  const [metaSlug, setMetaSlug] = useState(recipe.metaSlug ?? "");
  const [saving, setSaving] = useState(false);
  const liveRecipe = {
    ...recipe,
    metaTitle: metaTitle.trim() || null,
    metaDescription: metaDescription.trim() || null,
    metaSlug: metaSlug.trim() || null,
  };
  const audit = auditRecipeContent(liveRecipe);
  const percent = Math.round((audit.score / audit.maxScore) * 100);

  const previewTitle = seoTitle(metaTitle, `${recipe.title} Recipe | Kya Khayen`);
  const previewDescription = seoDescription(
    metaDescription,
    recipe.description || `${recipe.title} recipe from Kya Khayen.`,
  );
  const previewPath = recipeHref({ slug: recipe.slug, metaSlug: metaSlug || null });
  const titleScore = fieldScore(metaTitle || `${recipe.title} Recipe | Kya Khayen`, 25, 62);
  const descriptionScore = fieldScore(metaDescription, 110, 158);
  const slugFieldScore = slugScore(metaSlug, recipe.slug);
  const topIssue = audit.sections
    .flatMap((section) => section.checks.map((check) => ({ ...check, section: section.title })))
    .find((check) => check.severity === "critical" || check.severity === "warning");

  const saveSeo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setSaving(true);
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metaTitle: metaTitle.trim() || null,
          metaDescription: metaDescription.trim() || null,
          metaSlug: metaSlug.trim() || null,
        }),
      });
      if (!response.ok) throw new Error("Unable to save search metadata.");
      toast.success("Search preview saved");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save search preview.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden rounded-2xl py-0">
      <CardHeader className="border-b p-5 sm:p-6">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-3 text-xl">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <SearchCheck className="size-5" />
              </span>
              SEO and content audit
            </CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              Search preview, content checks and exact fixes in one place. Audit signals are deterministic, not ranking promises.
            </p>
            {topIssue ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-200">
                <span className="font-semibold">Next fix: {topIssue.title}. </span>
                {topIssue.fix || topIssue.detail}
              </div>
            ) : null}
          </div>
          <div className="rounded-2xl border bg-muted/20 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Live audit score
                </p>
                <p className={cn("mt-1 text-4xl font-semibold leading-none", gradeClass(audit.grade))}>
                  {percent}/100
                </p>
              </div>
              <Badge variant={audit.grade === "Weak" ? "destructive" : "secondary"}>
                {audit.grade}
              </Badge>
            </div>
            <Meter value={percent} className="mt-4 h-2.5" />
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <span className="rounded-lg bg-red-100 px-2 py-1 font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {audit.criticalCount} fix
              </span>
              <span className="rounded-lg bg-amber-100 px-2 py-1 font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                {audit.warningCount} improve
              </span>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Updates while you edit title, description and slug. Other content checks update after saving the recipe content.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-5 sm:p-6">
        <form onSubmit={saveSeo} className="space-y-5 rounded-2xl border bg-muted/10 p-4">
          <div>
            <h3 className="text-base font-semibold">Edit search preview</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              These fields control the search/social preview and update the audit score in real time.
            </p>
          </div>

          <div className="rounded-2xl border bg-background p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Live preview
            </p>
            <p className="truncate text-base font-medium text-blue-700 dark:text-blue-300">
              {previewTitle}
            </p>
            <p className="mt-1 truncate text-sm text-emerald-700 dark:text-emerald-300">
              kyakhayen.com{previewPath}
            </p>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
              {previewDescription}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <Label htmlFor="recipe-meta-title">Meta title</Label>
                <p className="text-xs text-muted-foreground">{fieldHelp("title", titleScore)}</p>
              </div>
              <span className={cn("text-xs font-semibold", titleScore >= 85 ? "text-emerald-600" : titleScore >= 60 ? "text-amber-600" : "text-red-600")}>
                {metaTitle.length || previewTitle.length}/60
              </span>
            </div>
            <Input
              id="recipe-meta-title"
              value={metaTitle}
              onChange={(event) => setMetaTitle(event.target.value)}
              maxLength={70}
              placeholder="Search result title"
              className="h-11 rounded-xl text-base"
            />
            <Meter value={titleScore} className="h-1.5" />
          </div>

          <div className="space-y-2">
            <div className="flex items-end justify-between gap-2">
              <div>
                <Label htmlFor="recipe-meta-slug">Meta slug</Label>
                <p className="text-xs text-muted-foreground">{fieldHelp("slug", slugFieldScore)}</p>
              </div>
              <span className={cn("text-xs font-semibold", slugFieldScore >= 85 ? "text-emerald-600" : slugFieldScore >= 60 ? "text-amber-600" : "text-red-600")}>
                {meterText(slugFieldScore)}
              </span>
            </div>
            <Input
              id="recipe-meta-slug"
              value={metaSlug}
              onChange={(event) => setMetaSlug(event.target.value.replace(/\s+/g, "-").toLowerCase())}
              placeholder={recipe.slug}
              className="h-11 rounded-xl text-base"
            />
            <Meter value={slugFieldScore} className="h-1.5" />
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <Label htmlFor="recipe-meta-description">Meta description</Label>
                <p className="text-xs text-muted-foreground">{fieldHelp("description", descriptionScore)}</p>
              </div>
              <span className={cn("text-xs font-semibold", descriptionScore >= 85 ? "text-emerald-600" : descriptionScore >= 60 ? "text-amber-600" : "text-red-600")}>
                {metaDescription.length}/160
              </span>
            </div>
            <Textarea
              id="recipe-meta-description"
              value={metaDescription}
              onChange={(event) => setMetaDescription(event.target.value)}
              maxLength={180}
              placeholder="Short search-friendly summary"
              className="min-h-28 w-full rounded-xl text-base leading-7"
            />
            <Meter value={descriptionScore} className="h-1.5" />
          </div>

          <div className="flex justify-end">
            <Button disabled={saving} type="submit" variant="outline" className="rounded-xl">
              {saving ? <LoaderCircle className="size-4 animate-spin" /> : null}
              {saving ? "Saving..." : "Save preview"}
            </Button>
          </div>
        </form>

        <div className="rounded-2xl border bg-muted/10 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold">Audit issues and suggestions</h3>
            <p className="text-xs text-muted-foreground">Each row shows the important gap and the next practical fix.</p>
          </div>
          <div className="space-y-3">
          {audit.sections.map((section) => {
            const sectionPercent = Math.round((section.score / section.maxScore) * 100);
            const firstIssue = section.checks.find((item) => item.severity === "critical" || item.severity === "warning");
            return (
              <section key={section.id} className="grid gap-3 rounded-xl border bg-background p-3 lg:grid-cols-[180px_minmax(0,1fr)_minmax(220px,0.9fr)] lg:items-center">
                <div>
                  <h4 className="text-sm font-semibold">{section.title}</h4>
                  <p className={cn("text-xs font-medium", sectionPercent >= 85 ? "text-emerald-600" : sectionPercent >= 60 ? "text-amber-600" : "text-red-600")}>
                    {sectionPercent}% - {meterText(sectionPercent)}
                  </p>
                </div>
                <Meter value={sectionPercent} />
                <div className="text-xs leading-5 text-muted-foreground">
                  {firstIssue ? (
                    <>
                      <span className="font-semibold text-foreground">{firstIssue.title}: </span>
                      {firstIssue.fix || firstIssue.detail}
                    </>
                  ) : (
                    <span className="text-emerald-600">No important issue in this section.</span>
                  )}
                </div>
              </section>
            );
          })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
