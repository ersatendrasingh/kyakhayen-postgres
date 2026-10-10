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

export function CouponDrawer({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedCode = code.trim().toUpperCase();
    if (normalizedCode.length < 3) {
      toast.error("Coupon code needs at least 3 characters");
      return;
    }
    try {
      setSubmitting(true);
      const response = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalizedCode }),
      });
      if (!response.ok) {
        const message = await response.json().catch(() => "Unable to create coupon");
        throw new Error(typeof message === "string" ? message : "Unable to create coupon");
      }
      toast.success("Draft coupon created");
      setCode("");
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create coupon");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 border-border/70 bg-background p-0 sm:max-w-[560px]">
        <SheetHeader className="border-b bg-card/70 px-6 py-6 text-left">
          <SheetTitle className="text-2xl">Create coupon</SheetTitle>
          <SheetDescription>
            Start with the code here, then configure saving rules and eligible memberships.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <div className="rounded-3xl border border-primary/15 bg-primary/[0.04] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Offers</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Keep codes short, memorable and clearly connected to your campaigns.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-coupon-code">Coupon code</Label>
              <Input
                id="new-coupon-code"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="e.g. WELCOME20"
                className="h-12 rounded-xl uppercase"
                disabled={submitting}
              />
            </div>
          </div>
          <SheetFooter className="border-t bg-background px-6 py-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || code.trim().length < 3}>
              {submitting && <LoaderCircle className="size-4 animate-spin" />}
              Create Draft Coupon
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
