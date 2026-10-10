"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IndianRupee, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import type { IngredientEditorRecord } from "@/components/admin/ingredients/ingredient-types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function formatUpdatedAt(value: Date | string | null) {
  if (!value) return null;

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function IngredientPricingCard({
  ingredient,
}: {
  ingredient: IngredientEditorRecord;
}) {
  const router = useRouter();
  const [priceInr, setPriceInr] = useState(
    ingredient.marketPriceInr?.toString() ?? "",
  );
  const [basisGrams, setBasisGrams] = useState(
    ingredient.marketPriceBasisGrams?.toString() ?? "100",
  );
  const [source, setSource] = useState(ingredient.marketPriceSource ?? "");
  const [submitting, setSubmitting] = useState(false);
  const updatedAt = formatUpdatedAt(ingredient.marketPriceUpdatedAt);

  const savePricing = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedPrice = priceInr.trim() ? Number(priceInr) : null;
    const parsedBasis = Number(basisGrams);

    if (
      (parsedPrice !== null && (!Number.isFinite(parsedPrice) || parsedPrice < 0)) ||
      !Number.isFinite(parsedBasis) ||
      parsedBasis <= 0
    ) {
      toast.error("Enter a valid price and gram basis.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/ingredients/${ingredient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketPriceInr: parsedPrice,
          marketPriceBasisGrams: parsedBasis,
          marketPriceSource: source.trim() || null,
        }),
      });

      if (!response.ok) throw new Error("Unable to save market price.");

      toast.success("Market price saved");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save price.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="gap-0 overflow-hidden rounded-3xl py-0">
      <CardHeader className="border-b px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <IndianRupee className="size-5" />
          </div>
          <div>
            <CardTitle className="text-lg">
              <h2>Market pricing</h2>
            </CardTitle>
            <CardDescription className="mt-1">
              Used by budget tools to estimate recipe cost from measured ingredients.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 px-5 py-5 sm:px-6">
        <form
          onSubmit={savePricing}
          className="grid gap-3 rounded-2xl border bg-muted/[0.15] p-4 sm:grid-cols-[1fr_1fr] sm:items-end"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="ingredient-price-inr">Price in INR</Label>
            <Input
              id="ingredient-price-inr"
              type="number"
              min="0"
              step="any"
              value={priceInr}
              onChange={(event) => setPriceInr(event.target.value)}
              placeholder="e.g. 45"
              disabled={submitting}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ingredient-price-basis">For grams</Label>
            <Input
              id="ingredient-price-basis"
              type="number"
              min="1"
              step="any"
              value={basisGrams}
              onChange={(event) => setBasisGrams(event.target.value)}
              placeholder="e.g. 100"
              disabled={submitting}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="ingredient-price-source">Source note</Label>
            <Input
              id="ingredient-price-source"
              value={source}
              onChange={(event) => setSource(event.target.value)}
              placeholder="e.g. local retail estimate"
              disabled={submitting}
              className="h-11 rounded-xl"
            />
          </div>
          <Button className="h-11 rounded-xl sm:col-span-2" type="submit" disabled={submitting}>
            {submitting && <LoaderCircle className="animate-spin" />}
            Save market price
          </Button>
        </form>

        <div className="rounded-2xl border px-4 py-3 text-sm text-muted-foreground">
          {ingredient.marketPriceInr !== null ? (
            <span>
              Current estimate:{" "}
              <strong className="font-semibold text-foreground">
                Rs {ingredient.marketPriceInr} per {ingredient.marketPriceBasisGrams} g
              </strong>
              {updatedAt ? `, updated ${updatedAt}` : ""}
            </span>
          ) : (
            "No price estimate yet. Budget matches will skip this ingredient until pricing is added."
          )}
        </div>
      </CardContent>
    </Card>
  );
}
