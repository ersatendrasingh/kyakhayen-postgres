"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { MediaField } from "@/components/admin/media/media-field";
import type {
  IngredientCategoryOption,
  IngredientEditorRecord,
} from "@/components/admin/ingredients/ingredient-types";
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

export function IngredientBasicsCard({
  ingredient,
  categories,
}: {
  ingredient: IngredientEditorRecord;
  categories: IngredientCategoryOption[];
}) {
  const router = useRouter();
  const [name, setName] = useState(ingredient.name);
  const [categoryId, setCategoryId] = useState(ingredient.ingredientCategoriesId ?? "");
  const [preview, setPreview] = useState<string | null>(ingredient.imageUrl);
  const [submitting, setSubmitting] = useState(false);

  const saveBasics = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !categoryId) {
      toast.error("Ingredient name and category are required.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/ingredients/${ingredient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          ingredientCategoriesId: categoryId,
          imageUrl: preview,
        }),
      });
      if (!response.ok) throw new Error("Unable to save ingredient details.");

      toast.success("Ingredient details saved");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save details.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="gap-0 overflow-hidden rounded-3xl py-0">
      <CardHeader className="border-b px-5 py-5 sm:px-6">
        <CardTitle className="text-lg">
          <h2>Identity and media</h2>
        </CardTitle>
        <CardDescription>
          What this ingredient is and how it will appear across the platform.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-5 py-5 sm:px-6">
        <form className="space-y-5" onSubmit={saveBasics}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ingredient-edit-name">Ingredient name</Label>
            <Input
              id="ingredient-edit-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={submitting}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Category</Label>
            <Select
              value={categoryId}
              onValueChange={setCategoryId}
              disabled={submitting}
            >
              <SelectTrigger className="!h-11 w-full rounded-xl">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <MediaField label="Ingredient image" value={preview} onChange={setPreview} disabled={submitting} />
          <Button className="w-full rounded-xl" type="submit" disabled={submitting}>
            {submitting && <LoaderCircle className="animate-spin" />}
            Save identity and image
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
