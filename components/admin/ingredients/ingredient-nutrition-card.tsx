"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical, LoaderCircle } from "lucide-react";
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

type NumericField = Exclude<
  keyof IngredientEditorRecord,
  | "id"
  | "name"
  | "slug"
  | "imageUrl"
  | "isPublished"
  | "ingredientCategoriesId"
  | "nutritionSource"
  | "IngredientUnitMeasurements"
  | "_count"
>;

type NutrientDefinition = {
  key: NumericField;
  label: string;
  unit: string;
};

const macros: NutrientDefinition[] = [
  { key: "calories", label: "Energy", unit: "kcal" },
  { key: "carbohydrate", label: "Carbohydrate", unit: "g" },
  { key: "totalFat", label: "Total fat", unit: "g" },
  { key: "dietaryFiber", label: "Dietary fiber", unit: "g" },
  { key: "protein", label: "Protein", unit: "g" },
];

const vitamins: NutrientDefinition[] = [
  { key: "vitaminA", label: "Vitamin A", unit: "mcg" },
  { key: "ascorbicAcids", label: "Vitamin C", unit: "mg" },
  { key: "vitaminD", label: "Vitamin D", unit: "mcg" },
  { key: "tocopherolEquivalent", label: "Vitamin E", unit: "mg" },
  { key: "vitaminK", label: "Vitamin K", unit: "mcg" },
  { key: "thiamine", label: "Thiamine (B1)", unit: "mg" },
  { key: "riboflavin", label: "Riboflavin (B2)", unit: "mg" },
  { key: "totalB6", label: "Vitamin B6", unit: "mg" },
  { key: "folates", label: "Folates (B9)", unit: "mcg" },
];

const minerals: NutrientDefinition[] = [
  { key: "calcium", label: "Calcium", unit: "mg" },
  { key: "iron", label: "Iron", unit: "mg" },
  { key: "phosphorus", label: "Phosphorus", unit: "mg" },
  { key: "potassium", label: "Potassium", unit: "mg" },
  { key: "sodium", label: "Sodium", unit: "mg" },
  { key: "zinc", label: "Zinc", unit: "mg" },
];

const nutrientFields = [...macros, ...vitamins, ...minerals];

function buildValues(ingredient: IngredientEditorRecord) {
  return Object.fromEntries(
    nutrientFields.map((field) => [
      field.key,
      ingredient[field.key] === null ? "" : String(ingredient[field.key]),
    ])
  ) as Record<NumericField, string>;
}

function NutritionFields({
  title,
  description,
  fields,
  values,
  setValues,
  disabled,
}: {
  title: string;
  description: string;
  fields: NutrientDefinition[];
  values: Record<NumericField, string>;
  setValues: React.Dispatch<React.SetStateAction<Record<NumericField, string>>>;
  disabled: boolean;
}) {
  return (
    <section className="rounded-2xl border bg-muted/[0.15] p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {fields.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={`nutrition-${field.key}`}>
              {field.label} <span className="text-muted-foreground">({field.unit})</span>
            </Label>
            <Input
              id={`nutrition-${field.key}`}
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={values[field.key]}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  [field.key]: event.target.value,
                }))
              }
              disabled={disabled}
              placeholder="0"
              className="h-11 rounded-xl"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export function IngredientNutritionCard({
  ingredient,
}: {
  ingredient: IngredientEditorRecord;
}) {
  const router = useRouter();
  const [nutritionBasisGrams, setNutritionBasisGrams] = useState(
    String(ingredient.nutritionBasisGrams)
  );
  const [values, setValues] = useState(() => buildValues(ingredient));
  const [submitting, setSubmitting] = useState(false);

  const saveNutrition = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const basis = Number(nutritionBasisGrams);
    if (!Number.isFinite(basis) || basis <= 0) {
      toast.error("Nutrition basis must be a valid gram value.");
      return;
    }

    const nutrients = Object.fromEntries(
      nutrientFields.map((field) => {
        const rawValue = values[field.key].trim();
        return [field.key, rawValue === "" ? null : Number(rawValue)];
      })
    );
    if (Object.values(nutrients).some((value) => value !== null && !Number.isFinite(value))) {
      toast.error("Enter valid numeric nutrition values.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/ingredients/${ingredient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nutritionBasisGrams: basis,
          ...nutrients,
        }),
      });
      if (!response.ok) throw new Error("Unable to save nutrition values.");
      toast.success("Nutrition profile saved");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save nutrition.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="gap-0 overflow-hidden rounded-3xl py-0">
      <CardHeader className="border-b px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <FlaskConical className="size-5" />
          </div>
          <div>
            <CardTitle className="text-lg">
              <h2>Nutrition profile</h2>
            </CardTitle>
            <CardDescription className="mt-1">
              All values are measured per serving basis below. Macros and micros are
              both required for dependable recipe totals.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 py-5 sm:px-6">
        <form className="space-y-5" onSubmit={saveNutrition}>
          <div className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-lg text-sm text-muted-foreground">
              Enter all macro and micro values against one common gram basis for
              consistent recipe calculations.
            </p>
            <div className="flex w-full flex-col gap-2 sm:w-44">
              <Label htmlFor="nutrition-basis">Per grams</Label>
              <Input
                id="nutrition-basis"
                type="number"
                min="1"
                value={nutritionBasisGrams}
                onChange={(event) => setNutritionBasisGrams(event.target.value)}
                disabled={submitting}
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          <NutritionFields
            title="Macros"
            description="Energy and major nutrient totals used in every calculation."
            fields={macros}
            values={values}
            setValues={setValues}
            disabled={submitting}
          />
          <NutritionFields
            title="Micros: vitamins"
            description="Vitamin profile per nutrition basis."
            fields={vitamins}
            values={values}
            setValues={setValues}
            disabled={submitting}
          />
          <NutritionFields
            title="Micros: minerals"
            description="Mineral profile per nutrition basis."
            fields={minerals}
            values={values}
            setValues={setValues}
            disabled={submitting}
          />

          <div className="flex justify-end">
            <Button type="submit" className="rounded-xl" disabled={submitting}>
              {submitting && <LoaderCircle className="animate-spin" />}
              Save nutrition profile
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
