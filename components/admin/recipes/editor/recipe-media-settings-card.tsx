"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Settings2 } from "lucide-react";
import { toast } from "sonner";

import { MediaField } from "@/components/admin/media/media-field";
import type {
  RecipeEditorOption,
  RecipeEditorRecord,
  RecipeSeasonality,
} from "@/components/admin/recipes/editor/recipe-editor-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const selectClassName =
  "h-11 w-full cursor-pointer rounded-xl border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30";

export function RecipeMediaSettingsCard({
  recipe,
  categories,
  difficulties,
  seasons,
}: {
  recipe: RecipeEditorRecord;
  categories: RecipeEditorOption[];
  difficulties: RecipeEditorOption[];
  seasons: RecipeEditorOption[];
}) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState(recipe.recipeCategoriesId ?? "");
  const [difficultyId, setDifficultyId] = useState(recipe.recipeDifficultyId ?? "");
  const [seasonality, setSeasonality] = useState<RecipeSeasonality>(recipe.seasonality);
  const [seasonIds, setSeasonIds] = useState(recipe.seasonIds);
  const [preview, setPreview] = useState(recipe.imageUrl);
  const [saving, setSaving] = useState(false);

  const toggleSeason = (seasonId: string) => {
    setSeasonIds((current) =>
      current.includes(seasonId)
        ? current.filter((id) => id !== seasonId)
        : [...current, seasonId],
    );
  };

  const selectImage = async (imageUrl: string | null) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
      if (!response.ok) throw new Error("Unable to save cover image.");
      setPreview(imageUrl);
      toast.success(imageUrl ? "Cover image selected" : "Cover image removed");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save image.");
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (seasonality === "SEASONAL" && seasonIds.length === 0) {
      toast.warning("Select at least one season for a strict seasonal recipe.");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeCategoriesId: categoryId || null,
          recipeDifficultyId: difficultyId || null,
          seasonality,
          seasonIds: seasonality === "SEASONAL" ? seasonIds : [],
        }),
      });
      if (!response.ok) throw new Error("Unable to save recipe classification.");
      toast.success("Recipe classification saved");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden rounded-2xl py-0">
      <CardHeader className="border-b p-4">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Settings2 className="size-4 text-primary" />
          Cover and classification
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <form onSubmit={saveSettings} className="space-y-4">
          <div className="space-y-2">
            <MediaField
              label="Cover image"
              value={preview}
              onChange={(url) => void selectImage(url)}
              disabled={saving}
              description="Choose or upload a reusable recipe cover."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recipe-category">Primary category</Label>
            <select id="recipe-category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className={selectClassName}>
              <option value="">No category</option>
              {categories.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="space-y-2">
              <Label htmlFor="recipe-difficulty">Difficulty</Label>
              <select id="recipe-difficulty" value={difficultyId} onChange={(event) => setDifficultyId(event.target.value)} className={selectClassName}>
                <option value="">Needs review</option>
                {difficulties.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
              </select>
              {!difficultyId && (
                <p className="text-xs leading-5 text-amber-700 dark:text-amber-300">
                  Pick the cooking skill needed before using this recipe in meal plans.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipe-seasonality">Season use</Label>
              <select
                id="recipe-seasonality"
                value={seasonality}
                onChange={(event) => setSeasonality(event.target.value as RecipeSeasonality)}
                className={selectClassName}
              >
                <option value="UNREVIEWED">Needs review</option>
                <option value="ALL_YEAR">All year</option>
                <option value="SEASONAL">Strict seasonal</option>
              </select>
              <p className="text-xs leading-5 text-muted-foreground">
                All year recipes can appear any month. Strict seasonal recipes appear only in the selected season.
              </p>
            </div>
          </div>
          {seasonality === "SEASONAL" && (
            <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
              <Label>Allowed seasons</Label>
              <div className="grid gap-2">
                {seasons.map((option) => (
                  <label
                    key={option.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-background"
                  >
                    <Checkbox
                      checked={seasonIds.includes(option.id)}
                      onCheckedChange={() => toggleSeason(option.id)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <Button disabled={saving} type="submit" variant="outline" className="h-10 w-full rounded-xl">
            {saving ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {saving ? "Saving..." : "Save classification"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
