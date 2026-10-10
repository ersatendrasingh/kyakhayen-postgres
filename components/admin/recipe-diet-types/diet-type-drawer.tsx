"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { MediaField } from "@/components/admin/media/media-field";
import type { DietTypeRecord } from "@/components/admin/recipe-diet-types/diet-type-types";
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

type DietTypeDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dietType: DietTypeRecord | null;
  onSaved: () => void;
};

export function DietTypeDrawer({
  open,
  onOpenChange,
  dietType,
  onSaved,
}: DietTypeDrawerProps) {
  const [title, setTitle] = useState(dietType?.title ?? "");
  const [preview, setPreview] = useState<string | null>(dietType?.imageUrl ?? null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      toast.error("Diet type title is required");
      return;
    }

    try {
      setSubmitting(true);
      let dietTypeId = dietType?.id;

      if (dietTypeId) {
        const response = await fetch(`/api/recipes/diet-types/${dietTypeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmedTitle, imageUrl: preview }),
        });
        if (!response.ok) throw new Error("Unable to update diet type.");
      } else {
        const response = await fetch("/api/recipes/diet-types", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmedTitle, imageUrl: preview }),
        });
        if (!response.ok) throw new Error("Unable to create diet type.");
        const created = (await response.json()) as { id: string };
        dietTypeId = created.id;
      }

      toast.success(dietType ? "Diet type updated successfully" : "Diet type created successfully");
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save diet type.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 border-border/70 bg-background p-0 sm:max-w-[560px]">
        <SheetHeader className="border-b bg-card/70 px-6 py-6 text-left">
          <SheetTitle className="text-2xl">{dietType ? "Edit diet type" : "Create diet type"}</SheetTitle>
          <SheetDescription>Manage dietary preference labels used for recipe discovery.</SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <div className="rounded-3xl border border-primary/15 bg-primary/[0.04] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Diet Preference</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Keep labels simple and discoverable, such as Vegan or Gluten Free.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="diet-type-title">Diet type title</Label>
              <Input
                id="diet-type-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Vegan"
                className="h-12 rounded-xl"
                disabled={submitting}
              />
            </div>
            <MediaField label="Featured image" value={preview} onChange={setPreview} disabled={submitting} />
          </div>
          <SheetFooter className="border-t bg-background px-6 py-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || submitting}>
              {submitting && <LoaderCircle className="animate-spin" />}
              {dietType ? "Update Diet Type" : "Create Diet Type"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
