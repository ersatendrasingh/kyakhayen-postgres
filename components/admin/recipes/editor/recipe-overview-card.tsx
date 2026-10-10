"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock3, LoaderCircle, NotebookPen } from "lucide-react";
import { toast } from "sonner";

import type { RecipeEditorRecord } from "@/components/admin/recipes/editor/recipe-editor-types";
import { Editor } from "@/components/editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RecipeOverviewCard({ recipe }: { recipe: RecipeEditorRecord }) {
  const router = useRouter();
  const [title, setTitle] = useState(recipe.title);
  const [description, setDescription] = useState(recipe.description ?? "");
  const [prepTime, setPrepTime] = useState(String(recipe.recipeCookingTime?.prepTime ?? 0));
  const [cookTime, setCookTime] = useState(String(recipe.recipeCookingTime?.cookTime ?? 0));
  const [restTime, setRestTime] = useState(String(recipe.recipeCookingTime?.restTime ?? 0));
  const [saving, setSaving] = useState(false);

  const saveOverview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) {
      toast.warning("Recipe title is required.");
      return;
    }
    try {
      setSaving(true);
      const detailsResponse = await fetch(`/api/recipes/${recipe.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
        }),
      });
      if (!detailsResponse.ok) throw new Error("Unable to save recipe details.");

      const timeResponse = await fetch(`/api/recipes/${recipe.id}/recipe-cooking-time`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prepTime: Number(prepTime) || 0,
          cookTime: Number(cookTime) || 0,
          restTime: Number(restTime) || 0,
        }),
      });
      if (!timeResponse.ok) throw new Error("Unable to save cooking time.");

      toast.success("Recipe content saved");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save recipe.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden rounded-2xl py-0">
      <CardHeader className="border-b p-5 sm:p-6">
        <CardTitle className="flex items-center gap-3 text-xl">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <NotebookPen className="size-5" />
          </span>
          Recipe information
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Write the title and full public description. Rich content is ready for headings and lists.
        </p>
      </CardHeader>
      <CardContent className="p-5 sm:p-6">
        <form onSubmit={saveOverview} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="recipe-title">Recipe title</Label>
            <Input
              id="recipe-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="h-12 rounded-xl text-base"
            />
          </div>
          <div className="space-y-2">
            <Label>Recipe description</Label>
            <Editor value={description} onChange={setDescription} />
            <p className="text-xs text-muted-foreground">
              This description is displayed on the public recipe page and may be used for search previews.
            </p>
          </div>
          <div className="rounded-2xl border bg-muted/15 p-4">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium">
              <Clock3 className="size-4 text-primary" />
              Time in minutes
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Prep", prepTime, setPrepTime],
                ["Cook", cookTime, setCookTime],
                ["Rest", restTime, setRestTime],
              ].map(([label, value, setter]) => (
                <div key={label as string} className="space-y-2">
                  <Label className="text-xs">{label as string}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={value as string}
                    onChange={(event) => (setter as (value: string) => void)(event.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <Button disabled={saving} type="submit" className="h-11 min-w-44 rounded-xl">
              {saving ? <LoaderCircle className="size-4 animate-spin" /> : null}
              {saving ? "Saving..." : "Save recipe content"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
