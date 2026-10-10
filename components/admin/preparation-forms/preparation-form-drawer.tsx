"use client";

import { useState } from "react";
import { CookingPot, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import type { PreparationFormRecord } from "@/components/admin/preparation-forms/preparation-form-types";
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

export function PreparationFormDrawer({
  open,
  onOpenChange,
  form,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: PreparationFormRecord | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState(form?.name ?? "");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Preparation form name is required");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(
        form
          ? `/api/ingredients/ingredients-form/${form.id}`
          : "/api/ingredients/ingredients-form",
        {
          method: form ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmedName }),
        }
      );
      if (!response.ok) {
        throw new Error(form ? "Unable to update preparation form." : "Unable to create preparation form.");
      }
      toast.success(form ? "Preparation form updated successfully" : "Preparation form created successfully");
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save preparation form.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 border-border/70 bg-background p-0 sm:max-w-[520px]">
        <SheetHeader className="border-b bg-card/70 px-6 py-6 text-left">
          <SheetTitle className="text-2xl">
            {form ? "Edit preparation form" : "Create preparation form"}
          </SheetTitle>
          <SheetDescription>
            Manage how an ingredient is prepared when it appears in a recipe.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <div className="rounded-3xl border border-primary/15 bg-primary/[0.04] p-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                <CookingPot className="size-4" />
                Recipe vocabulary
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Use short, readable terms such as chopped, grated, soaked or roasted.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="preparation-form-name">Form name</Label>
              <Input
                id="preparation-form-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Chopped"
                className="h-12 rounded-xl"
                disabled={submitting}
              />
            </div>
          </div>
          <SheetFooter className="border-t bg-background px-6 py-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || submitting}>
              {submitting && <LoaderCircle className="animate-spin" />}
              {form ? "Update Form" : "Create Form"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
