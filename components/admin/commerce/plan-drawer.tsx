"use client";

import { LoaderCircle } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

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

type PlanDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export function PlanDrawer({ open, onOpenChange, onSaved }: PlanDrawerProps) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = name.trim();
    if (!title) {
      toast.error("Plan title is required");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/subscription-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: title }),
      });
      if (!response.ok) {
        const message = await response.json().catch(() => "Unable to create plan");
        throw new Error(typeof message === "string" ? message : "Unable to create plan");
      }
      toast.success("Draft membership plan created");
      setName("");
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create plan");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 border-border/70 bg-background p-0 sm:max-w-[560px]"
      >
        <SheetHeader className="border-b bg-card/70 px-6 py-6 text-left">
          <SheetTitle className="text-2xl">Create membership plan</SheetTitle>
          <SheetDescription>
            Start a draft offer here. Add pricing and benefits when you open it from the table.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <div className="rounded-3xl border border-primary/15 bg-primary/[0.04] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Commerce
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Add monthly, quarterly or launch offers without leaving this dashboard.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-plan-title">Plan title</Label>
              <Input
                id="new-plan-title"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Quarterly access"
                className="h-12 rounded-xl"
                disabled={submitting}
              />
            </div>
          </div>
          <SheetFooter className="border-t bg-background px-6 py-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !name.trim()}>
              {submitting && <LoaderCircle className="size-4 animate-spin" />}
              Create Draft Plan
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
