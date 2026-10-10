"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { MediaField } from "@/components/admin/media/media-field";
import type { AllergyRecord } from "@/components/admin/recipe-allergies/allergy-types";
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

type AllergyDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allergy: AllergyRecord | null;
  onSaved: () => void;
};

export function AllergyDrawer({
  open,
  onOpenChange,
  allergy,
  onSaved,
}: AllergyDrawerProps) {
  const [title, setTitle] = useState(allergy?.title ?? "");
  const [preview, setPreview] = useState<string | null>(allergy?.imageUrl ?? null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      toast.error("Allergy title is required");
      return;
    }

    try {
      setSubmitting(true);
      let allergyId = allergy?.id;

      if (allergyId) {
        const response = await fetch(`/api/recipes/allergies/${allergyId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmedTitle, imageUrl: preview }),
        });

        if (!response.ok) throw new Error("Unable to update allergy.");
      } else {
        const response = await fetch("/api/recipes/allergies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmedTitle, imageUrl: preview }),
        });

        if (!response.ok) throw new Error("Unable to create allergy.");
        const created = (await response.json()) as { id: string };
        allergyId = created.id;
      }

      toast.success(allergy ? "Allergy updated successfully" : "Allergy created successfully");
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save allergy.");
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
            {allergy ? "Edit allergy" : "Create allergy"}
          </SheetTitle>
          <SheetDescription>
            Manage ingredient exclusions used for safer recipe discovery.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <div className="rounded-3xl border border-primary/15 bg-primary/[0.04] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Recipe Safety
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Allergies help users avoid recipes containing ingredients they do not consume.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergy-title">Allergy title</Label>
              <Input
                id="allergy-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Peanuts"
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
              {allergy ? "Update Allergy" : "Create Allergy"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
