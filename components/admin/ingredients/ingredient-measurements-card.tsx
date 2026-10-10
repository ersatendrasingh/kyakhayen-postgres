"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Plus, Scale, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type { IngredientMeasurement } from "@/components/admin/ingredients/ingredient-types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type UnitOption = { id: string; title: string; shortName: string };

export function IngredientMeasurementsCard({
  ingredientId,
  measurements,
  units,
}: {
  ingredientId: string;
  measurements: IngredientMeasurement[];
  units: UnitOption[];
}) {
  const router = useRouter();
  const [unitId, setUnitId] = useState("");
  const [grams, setGrams] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const saveMeasurement = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = Number(grams);
    if (!unitId || !Number.isFinite(value) || value < 0) {
      toast.error("Select a unit and enter its gram equivalent.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/ingredients/${ingredientId}/unit-measurements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitId, values: value }),
      });
      if (!response.ok) throw new Error("Unable to save measurement conversion.");
      toast.success("Measurement conversion saved");
      setUnitId("");
      setGrams("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save conversion.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteMeasurement = async (measurementId: string) => {
    try {
      setDeletingId(measurementId);
      const response = await fetch(
        `/api/ingredients/${ingredientId}/unit-measurements/${measurementId}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Unable to remove conversion.");
      toast.success("Measurement conversion removed");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove conversion.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="gap-0 overflow-hidden rounded-3xl py-0">
      <CardHeader className="border-b px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <Scale className="size-5" />
          </div>
          <div>
            <CardTitle className="text-lg">
              <h2>Measurement conversions</h2>
            </CardTitle>
            <CardDescription className="mt-1">
              Tell the calculator how many grams one household unit represents.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 px-5 py-5 sm:px-6">
        <form
          onSubmit={saveMeasurement}
          className="grid gap-3 rounded-2xl border bg-muted/[0.15] p-4 sm:grid-cols-[1fr_180px_auto] sm:items-end"
        >
          <div className="flex flex-col gap-2">
            <Label>Household unit</Label>
            <Select value={unitId} onValueChange={setUnitId} disabled={submitting}>
              <SelectTrigger className="!h-11 w-full rounded-xl">
                <SelectValue placeholder="Select unit to map" />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.title} ({unit.shortName})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="measurement-grams">Equals grams</Label>
            <Input
              id="measurement-grams"
              type="number"
              min="0"
              step="any"
              value={grams}
              onChange={(event) => setGrams(event.target.value)}
              placeholder="e.g. 15"
              disabled={submitting}
              className="h-11 rounded-xl"
            />
          </div>
          <Button type="submit" className="h-11 rounded-xl" disabled={submitting}>
            {submitting ? <LoaderCircle className="animate-spin" /> : <Plus />}
            Save mapping
          </Button>
        </form>

        <div className="overflow-hidden rounded-2xl border">
          {measurements.length ? (
            measurements.map((measurement) => (
              <div
                key={measurement.id}
                className="flex items-center justify-between gap-3 border-b px-4 py-3 last:border-b-0"
              >
                <div className="text-sm">
                  <span className="font-medium">1 {measurement.unit.title}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    ({measurement.unit.shortName}) ={" "}
                  </span>
                  <span className="font-medium">{measurement.values} g</span>
                </div>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Remove ${measurement.unit.title} conversion`}
                  disabled={deletingId === measurement.id}
                  onClick={() => void deleteMeasurement(measurement.id)}
                >
                  {deletingId === measurement.id ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <Trash2 />
                  )}
                </Button>
              </div>
            ))
          ) : (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No conversion mappings yet. Add at least one before publishing.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
