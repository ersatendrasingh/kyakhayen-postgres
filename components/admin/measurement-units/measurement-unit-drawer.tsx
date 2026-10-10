"use client";

import { useState } from "react";
import { LoaderCircle, Scale } from "lucide-react";
import { toast } from "sonner";

import type { MeasurementUnitRecord } from "@/components/admin/measurement-units/measurement-unit-types";
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

export function MeasurementUnitDrawer({
  open,
  onOpenChange,
  unit,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit: MeasurementUnitRecord | null;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(unit?.title ?? "");
  const [shortName, setShortName] = useState(unit?.shortName ?? "");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedSymbol = shortName.trim();

    if (!trimmedTitle || !trimmedSymbol) {
      toast.error("Unit name and symbol are required");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(
        unit ? `/api/ingredients/units/${unit.id}` : "/api/ingredients/units",
        {
          method: unit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmedTitle, shortName: trimmedSymbol }),
        }
      );
      if (!response.ok) {
        throw new Error(unit ? "Unable to update measurement unit." : "Unable to create measurement unit.");
      }
      toast.success(unit ? "Measurement unit updated successfully" : "Measurement unit created successfully");
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save measurement unit.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 border-border/70 bg-background p-0 sm:max-w-[520px]">
        <SheetHeader className="border-b bg-card/70 px-6 py-6 text-left">
          <SheetTitle className="text-2xl">
            {unit ? "Edit measurement unit" : "Create measurement unit"}
          </SheetTitle>
          <SheetDescription>
            Define the household units used for recipe quantities and nutrition conversion.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <div className="rounded-3xl border border-primary/15 bg-primary/[0.04] p-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                <Scale className="size-4" />
                Conversion foundation
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Symbols are used in recipes and gram mappings. Keep them short and consistent.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="measurement-unit-name">Unit name</Label>
              <Input
                id="measurement-unit-name"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Tablespoon"
                className="h-12 rounded-xl"
                disabled={submitting}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="measurement-unit-symbol">Short symbol</Label>
              <Input
                id="measurement-unit-symbol"
                value={shortName}
                onChange={(event) => setShortName(event.target.value)}
                placeholder="e.g. tbsp"
                className="h-12 rounded-xl"
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">
                Changing a symbol keeps existing links, but changes how the unit appears in recipe editing.
              </p>
            </div>
          </div>
          <SheetFooter className="border-t bg-background px-6 py-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || !shortName.trim() || submitting}>
              {submitting && <LoaderCircle className="animate-spin" />}
              {unit ? "Update Unit" : "Create Unit"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
