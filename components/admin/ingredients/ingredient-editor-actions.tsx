"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Trash2 } from "lucide-react";
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

export function IngredientEditorActions({
  ingredientId,
  ingredientName,
  isPublished,
  canPublish,
  recipeUsageCount,
}: {
  ingredientId: string;
  ingredientName: string;
  isPublished: boolean;
  canPublish: boolean;
  recipeUsageCount: number;
}) {
  const router = useRouter();
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const updatePublished = async (checked: boolean) => {
    try {
      setPublishing(true);
      const response = await fetch(
        `/api/ingredients/${ingredientId}/${checked ? "publish" : "unpublish"}`,
        { method: "PATCH" }
      );

      if (!response.ok) {
        throw new Error(
          checked
            ? "Complete nutrition and measurements before publishing."
            : "Unable to unpublish ingredient."
        );
      }

      toast.success(`${ingredientName} ${checked ? "published" : "unpublished"}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update visibility.");
    } finally {
      setPublishing(false);
    }
  };

  const deleteIngredient = async () => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/ingredients/${ingredientId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Only unused ingredients can be deleted.");
      toast.success("Ingredient deleted successfully");
      router.push("/admin/ingredients");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete ingredient.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 rounded-2xl border bg-background/80 px-4 py-2.5">
        <Switch
          aria-label={`${isPublished ? "Unpublish" : "Publish"} ${ingredientName}`}
          checked={isPublished}
          disabled={publishing || (!canPublish && !isPublished)}
          onCheckedChange={(checked) => void updatePublished(checked)}
          className="cursor-pointer"
        />
        <span className="text-sm font-medium">
          {publishing ? "Updating..." : isPublished ? "Published" : "Draft"}
        </span>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="rounded-2xl"
            disabled={recipeUsageCount > 0 || deleting}
            aria-label={
              recipeUsageCount > 0
                ? "Ingredient is used in recipes and cannot be deleted"
                : "Delete ingredient"
            }
          >
            {deleting ? <LoaderCircle className="animate-spin" /> : <Trash2 />}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {ingredientName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the ingredient and its unit mappings. Published
              or recipe-linked ingredients should be unpublished instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={() => void deleteIngredient()}
            >
              Delete ingredient
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
