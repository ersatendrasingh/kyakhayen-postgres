"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Film,
  ImageIcon,
  ListOrdered,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { RecipeStepDrawer } from "@/components/admin/recipes/editor/recipe-step-drawer";
import type { RecipeEditorStep } from "@/components/admin/recipes/editor/recipe-editor-types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function instructionPreview(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function RecipeStepsCard({
  recipeId,
  steps,
}: {
  recipeId: string;
  steps: RecipeEditorStep[];
}) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState<RecipeEditorStep | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecipeEditorStep | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);

  const removeStep = async (step: RecipeEditorStep) => {
    try {
      setDeletingId(step.id);
      const response = await fetch(`/api/recipes/${recipeId}/methods/${step.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Unable to remove cooking step.");
      toast.success("Cooking step removed");
      setDeleteTarget(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove cooking step.");
    } finally {
      setDeletingId(null);
    }
  };

  const moveStep = async (stepId: string, direction: -1 | 1) => {
    const sourceIndex = steps.findIndex((step) => step.id === stepId);
    const destinationIndex = sourceIndex + direction;
    if (sourceIndex < 0 || destinationIndex < 0 || destinationIndex >= steps.length) return;

    const reordered = [...steps];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(destinationIndex, 0, moved);

    try {
      setMovingId(stepId);
      const response = await fetch(`/api/recipes/${recipeId}/methods/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          list: reordered.map((step, index) => ({ id: step.id, position: index + 1 })),
        }),
      });
      if (!response.ok) throw new Error("Unable to update cooking step position.");
      toast.success("Cooking step position updated");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reorder cooking steps.");
    } finally {
      setMovingId(null);
    }
  };

  return (
    <Card className="overflow-hidden rounded-3xl py-0">
      <CardHeader className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="space-y-2">
          <CardTitle className="flex items-center gap-3 text-xl">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ListOrdered className="size-5" />
            </span>
            Cooking steps
            <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
              {steps.length}
            </span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Build a clean sequence with optional image or video guidance for each action.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setSelectedStep(null);
            setDrawerOpen(true);
          }}
          className="h-11 w-full shrink-0 cursor-pointer rounded-xl sm:w-auto"
        >
          <Plus className="size-4" />
          Add step
        </Button>
      </CardHeader>
      <CardContent className="p-5 sm:p-6">
        {steps.length ? (
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className="group rounded-2xl border bg-card p-3 transition-colors hover:border-primary/25 sm:p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex shrink-0 flex-col items-center gap-1">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </span>
                    {movingId === step.id ? (
                      <LoaderCircle className="size-3.5 animate-spin text-primary" />
                    ) : null}
                  </div>
                  {step.imageUrl ? (
                    <div className="relative hidden size-16 shrink-0 overflow-hidden rounded-xl border sm:block">
                      <Image src={step.imageUrl} alt="" fill className="object-cover" sizes="64px" />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{step.title}</p>
                      <Badge variant={step.isPublished ? "secondary" : "outline"}>
                        {step.isPublished ? "Visible" : "Draft"}
                      </Badge>
                      {step.imageUrl ? (
                        <Badge variant="outline" className="gap-1">
                          <ImageIcon className="size-3" />
                          Image
                        </Badge>
                      ) : null}
                      {step.videoUrl ? (
                        <Badge variant="outline" className="gap-1">
                          <Film className="size-3" />
                          Video
                        </Badge>
                      ) : null}
                    </div>
                    {step.description ? (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {instructionPreview(step.description)}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm italic text-muted-foreground">
                        No instruction detail added.
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      disabled={Boolean(movingId) || index === 0}
                      onClick={() => void moveStep(step.id, -1)}
                      className="cursor-pointer text-muted-foreground hover:text-foreground"
                      aria-label={`Move ${step.title} up`}
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      disabled={Boolean(movingId) || index === steps.length - 1}
                      onClick={() => void moveStep(step.id, 1)}
                      className="cursor-pointer text-muted-foreground hover:text-foreground"
                      aria-label={`Move ${step.title} down`}
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedStep(step);
                        setDrawerOpen(true);
                      }}
                      className="cursor-pointer text-muted-foreground hover:text-foreground"
                      aria-label={`Edit ${step.title}`}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      disabled={deletingId === step.id}
                      onClick={() => setDeleteTarget(step)}
                      className="cursor-pointer text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${step.title}`}
                    >
                      {deletingId === step.id ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Add the first cooking step to turn ingredients into an actionable recipe.
          </div>
        )}
      </CardContent>

      <RecipeStepDrawer
        key={`${selectedStep?.id ?? "new"}-${drawerOpen ? "open" : "closed"}`}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        recipeId={recipeId}
        step={selectedStep}
      />

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !deletingId) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleteTarget?.title}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the instruction and any attached step image or video permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingId)} className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={Boolean(deletingId)}
              onClick={(event) => {
                event.preventDefault();
                if (deleteTarget) void removeStep(deleteTarget);
              }}
              className="cursor-pointer"
            >
              {deletingId ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              {deletingId ? "Removing..." : "Remove step"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
