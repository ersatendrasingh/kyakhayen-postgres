"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { MediaField } from "@/components/admin/media/media-field";
import type { MealTimeRecord } from "@/components/admin/recipe-meal-times/meal-time-types";
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

type MealTimeDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealTime: MealTimeRecord | null;
  onSaved: () => void;
};

export function MealTimeDrawer({
  open,
  onOpenChange,
  mealTime,
  onSaved,
}: MealTimeDrawerProps) {
  const [title, setTitle] = useState(mealTime?.title ?? "");
  const [preview, setPreview] = useState<string | null>(mealTime?.imageUrl ?? null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      toast.error("Meal time title is required");
      return;
    }

    try {
      setSubmitting(true);
      let mealTimeId = mealTime?.id;

      if (mealTimeId) {
        const response = await fetch(`/api/recipes/meal-time/${mealTimeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmedTitle, imageUrl: preview }),
        });

        if (!response.ok) throw new Error("Unable to update meal time.");
      } else {
        const response = await fetch("/api/recipes/meal-time", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmedTitle, imageUrl: preview }),
        });

        if (!response.ok) throw new Error("Unable to create meal time.");
        const created = (await response.json()) as { id: string };
        mealTimeId = created.id;
      }

      toast.success(
        mealTime ? "Meal time updated successfully" : "Meal time created successfully"
      );
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save meal time.");
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
            {mealTime ? "Edit meal time" : "Create meal time"}
          </SheetTitle>
          <SheetDescription>
            Organize the daily moments visitors use to discover suitable recipes.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <div className="rounded-3xl border border-primary/15 bg-primary/[0.04] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Recipe Schedule
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Meal times help arrange recipes for breakfast, lunch, snacks and dinner.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meal-time-title">Meal time title</Label>
              <Input
                id="meal-time-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Breakfast"
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
              {mealTime ? "Update Meal Time" : "Create Meal Time"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
