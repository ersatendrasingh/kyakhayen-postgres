"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { MediaField } from "@/components/admin/media/media-field";
import type { RecipeEditorStep } from "@/components/admin/recipes/editor/recipe-editor-types";
import { Editor } from "@/components/editor";
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
import { Switch } from "@/components/ui/switch";

export function RecipeStepDrawer({
  open,
  onOpenChange,
  recipeId,
  step,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipeId: string;
  step: RecipeEditorStep | null;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(step?.title ?? "");
  const [description, setDescription] = useState(step?.description ?? "");
  const [isPublished, setIsPublished] = useState(step?.isPublished ?? false);
  const [imageUrl, setImageUrl] = useState<string | null>(step?.imageUrl ?? null);
  const [videoUrl, setVideoUrl] = useState<string | null>(step?.videoUrl ?? null);
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(step);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset the reusable drawer form to the newly opened step.
    setTitle(step?.title ?? "");
    setDescription(step?.description ?? "");
    setIsPublished(step?.isPublished ?? false);
    setImageUrl(step?.imageUrl ?? null);
    setVideoUrl(step?.videoUrl ?? null);
  }, [open, step]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) {
      toast.warning("Step title is required.");
      return;
    }

    try {
      setSaving(true);
      const baseResponse = await fetch(
        step ? `/api/recipes/${recipeId}/methods/${step.id}` : `/api/recipes/${recipeId}/methods`,
        {
          method: step ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || null,
            isPublished,
            imageUrl,
            videoUrl,
          }),
        }
      );
      if (!baseResponse.ok) throw new Error(`Unable to ${isEditing ? "update" : "add"} step.`);

      toast.success(isEditing ? "Cooking step updated" : "Cooking step added");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save cooking step."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 border-border/70 bg-background p-0 sm:max-w-[680px]"
      >
        <SheetHeader className="border-b bg-card/70 px-5 py-6 text-left sm:px-6">
          <SheetTitle className="text-2xl">
            {isEditing ? "Edit cooking step" : "Add cooking step"}
          </SheetTitle>
          <SheetDescription>
            Keep each instruction focused, then add visual guidance when it helps the cook.
          </SheetDescription>
          {step ? (
            <div className="mt-4 rounded-2xl border border-primary/25 bg-primary/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Currently editing
              </p>
              <p className="mt-2 font-semibold text-foreground">
                Step {step.position}: {step.title}
              </p>
            </div>
          ) : null}
        </SheetHeader>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6 sm:px-6">
            <section className="space-y-4 rounded-2xl border p-4">
              <div className="space-y-2">
                <Label htmlFor="step-title">Step title</Label>
                <Input
                  id="step-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Saute onions until golden"
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Detailed instruction</Label>
                <Editor
                  value={description}
                  onChange={setDescription}
                  compact
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border bg-muted/20 px-4 py-3">
                <div>
                  <Label htmlFor="step-published" className="cursor-pointer">
                    Visible in published recipe
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Keep off while a step still needs review.
                  </p>
                </div>
                <Switch
                  id="step-published"
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                  className="cursor-pointer"
                />
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h3 className="font-semibold">Step media</h3>
                <p className="text-sm text-muted-foreground">
                  Add a helpful image or a short video for this exact cooking action.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <MediaField
                  label="Step image"
                  value={imageUrl}
                  accept="image"
                  onChange={setImageUrl}
                  disabled={saving}
                />
                <MediaField
                  label="Step video"
                  value={videoUrl}
                  accept="video"
                  onChange={setVideoUrl}
                  disabled={saving}
                />
              </div>
            </section>
          </div>

          <SheetFooter className="border-t bg-background px-5 py-5 sm:flex-row sm:justify-end sm:px-6">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => onOpenChange(false)}
              className="cursor-pointer rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || saving}
              className="cursor-pointer rounded-xl"
            >
              {saving ? <LoaderCircle className="size-4 animate-spin" /> : null}
              {saving ? "Saving..." : isEditing ? "Update step" : "Add step"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
