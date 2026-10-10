"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { MediaField } from "@/components/admin/media/media-field";
import type { NutrientRecord } from "@/components/admin/recipe-nutrients/nutrient-types";
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

type NutrientDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nutrient: NutrientRecord | null;
  onSaved: () => void;
};

export function NutrientDrawer({
  open,
  onOpenChange,
  nutrient,
  onSaved,
}: NutrientDrawerProps) {
  const [title, setTitle] = useState(nutrient?.title ?? "");
  const [preview, setPreview] = useState<string | null>(nutrient?.imageUrl ?? null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      toast.error("Nutrient title is required");
      return;
    }

    try {
      setSubmitting(true);
      let nutrientId = nutrient?.id;

      if (nutrientId) {
        const response = await fetch(`/api/recipes/nutrients/${nutrientId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmedTitle, imageUrl: preview }),
        });

        if (!response.ok) throw new Error("Unable to update nutrient.");
      } else {
        const response = await fetch("/api/recipes/nutrients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmedTitle, imageUrl: preview }),
        });

        if (!response.ok) throw new Error("Unable to create nutrient.");
        const created = (await response.json()) as { id: string };
        nutrientId = created.id;
      }

      toast.success(
        nutrient ? "Nutrient updated successfully" : "Nutrient created successfully"
      );
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save nutrient.");
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
            {nutrient ? "Edit nutrient" : "Create nutrient"}
          </SheetTitle>
          <SheetDescription>
            Manage discoverable nutrition tags attached to recipes.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <div className="rounded-3xl border border-primary/15 bg-primary/[0.04] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Recipe Nutrition
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Nutrition tags describe recipe highlights; measured values still come from ingredients.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nutrient-title">Nutrient title</Label>
              <Input
                id="nutrient-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. High Protein"
                className="h-12 rounded-xl"
                disabled={submitting}
              />
            </div>

            <MediaField label="Featured image" value={preview} onChange={setPreview} disabled={submitting} />
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
              {nutrient ? "Update Nutrient" : "Create Nutrient"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
