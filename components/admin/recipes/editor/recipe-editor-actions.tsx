"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function RecipeEditorActions({
  recipeId,
  title,
  isPublished,
  isSeoReady,
  canPublish,
}: {
  recipeId: string;
  title: string;
  isPublished: boolean;
  isSeoReady: boolean;
  canPublish: boolean;
}) {
  const router = useRouter();
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [seoUpdating, setSeoUpdating] = useState(false);

  const updatePublished = async (checked: boolean) => {
    if (checked && !canPublish) {
      toast.warning("Complete description, cover image, difficulty and season use before publishing.");
      return;
    }
    try {
      setPublishing(true);
      const response = await fetch(`/api/recipes/${recipeId}/${checked ? "publish" : "unpublish"}`, {
        method: "PATCH",
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Unable to update publication status.");
      }
      toast.success(`${title} ${checked ? "published" : "moved to drafts"}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update recipe.");
    } finally {
      setPublishing(false);
    }
  };

  const updateSeoReady = async (checked: boolean) => {
    if (checked && !isPublished) {
      toast.warning("Publish the recipe before marking it SEO ready.");
      return;
    }
    try {
      setSeoUpdating(true);
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSeoReady: checked }),
      });
      if (!response.ok) throw new Error((await response.text()) || "Unable to update SEO status.");
      toast.success(checked ? "Recipe added to sitemap" : "Recipe removed from sitemap");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update SEO status.");
    } finally {
      setSeoUpdating(false);
    }
  };

  const deleteRecipe = async () => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/recipes/${recipeId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Unable to delete this recipe.");
      toast.success("Recipe deleted");
      router.push("/admin/recipes");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete recipe.");
      setDeleting(false);
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" asChild className="admin-taxonomy-hero-action cursor-pointer">
        <Link href="/admin/recipes">
          <ArrowLeft className="size-4" />
          Back
        </Link>
      </Button>
      <Tooltip><TooltipTrigger asChild><span className="admin-taxonomy-hero-action inline-flex size-10 items-center justify-center rounded-xl border"><Switch checked={isPublished} disabled={publishing} onCheckedChange={(checked) => void updatePublished(checked)} className="cursor-pointer" aria-label="Toggle published status" /></span></TooltipTrigger><TooltipContent>{isPublished ? "Published — click to move to draft" : "Draft — click to publish"}</TooltipContent></Tooltip>
      <Tooltip><TooltipTrigger asChild><span className="admin-taxonomy-hero-action inline-flex size-10 items-center justify-center rounded-xl border"><Switch checked={isSeoReady} disabled={seoUpdating || !isPublished} onCheckedChange={(checked) => void updateSeoReady(checked)} className="cursor-pointer" aria-label="Toggle SEO ready status" /></span></TooltipTrigger><TooltipContent>{isSeoReady ? "SEO ready — included in sitemap" : "SEO held — excluded from sitemap"}</TooltipContent></Tooltip>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            className="admin-taxonomy-hero-action cursor-pointer"
            aria-label="Delete recipe"
          >
            <Trash2 className="size-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this recipe?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the recipe, its ingredients, steps and uploaded media permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={() => void deleteRecipe()}
              className="cursor-pointer bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete recipe"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </TooltipProvider>
  );
}
