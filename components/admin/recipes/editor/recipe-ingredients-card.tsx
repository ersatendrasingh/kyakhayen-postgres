"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, LoaderCircle, Pencil, Plus, Salad, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { RecipeIngredientDrawer } from "@/components/admin/recipes/editor/recipe-ingredient-drawer";
import type {
  RecipeEditorIngredient,
  RecipeEditorOption,
} from "@/components/admin/recipes/editor/recipe-editor-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function RecipeIngredientsCard({
  recipeId,
  ingredients,
  ingredientOptions,
  unitOptions,
  formOptions,
}: {
  recipeId: string;
  ingredients: RecipeEditorIngredient[];
  ingredientOptions: RecipeEditorOption[];
  unitOptions: RecipeEditorOption[];
  formOptions: RecipeEditorOption[];
}) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<RecipeEditorIngredient | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecipeEditorIngredient | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);

  const removeIngredient = async (id: string) => {
    try {
      setDeletingId(id);
      const response = await fetch(`/api/recipes/${recipeId}/ingredients/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Unable to remove ingredient.");
      toast.success("Ingredient removed");
      setDeleteTarget(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove ingredient.");
    } finally {
      setDeletingId(null);
    }
  };

  const moveIngredient = async (ingredientId: string, direction: -1 | 1) => {
    const sourceIndex = ingredients.findIndex((ingredient) => ingredient.id === ingredientId);
    const destinationIndex = sourceIndex + direction;
    if (sourceIndex < 0 || destinationIndex < 0 || destinationIndex >= ingredients.length) return;

    const reordered = [...ingredients];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(destinationIndex, 0, moved);

    try {
      setMovingId(ingredientId);
      const response = await fetch(`/api/recipes/${recipeId}/ingredients/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          list: reordered.map((item, index) => ({ id: item.id, position: index + 1 })),
        }),
      });
      if (!response.ok) throw new Error("Unable to update ingredient position.");
      toast.success("Ingredient position updated");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reorder ingredient.");
    } finally {
      setMovingId(null);
    }
  };

  return (
    <Card className="overflow-hidden rounded-3xl py-0">
      <CardHeader className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="space-y-2">
          <CardTitle className="flex items-center gap-3 text-xl">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Salad className="size-5" />
            </span>
            Ingredients
            <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
              {ingredients.length}
            </span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Add measured ingredients here so nutrition calculation stays reliable.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setSelectedIngredient(null);
            setDrawerOpen(true);
          }}
          className="h-11 w-full shrink-0 cursor-pointer rounded-xl sm:w-auto"
        >
          <Plus className="size-4" />
          Add ingredient
        </Button>
      </CardHeader>
      <CardContent className="p-5 sm:p-6">
        <div className="overflow-hidden rounded-2xl border">
          {ingredients.length ? (
            ingredients.map((ingredient, index) => (
              <div
                key={ingredient.id}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b px-4 py-3 last:border-b-0"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
                    {index + 1}
                  </span>
                  {movingId === ingredient.id ? (
                    <LoaderCircle className="size-3.5 animate-spin text-primary" />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{ingredient.ingredientName}</p>
                  <p className="text-sm text-muted-foreground">
                    {ingredient.quantity} {ingredient.unitName} / {ingredient.formName}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    disabled={Boolean(movingId) || index === 0}
                    onClick={() => void moveIngredient(ingredient.id, -1)}
                    className="cursor-pointer text-muted-foreground hover:text-foreground"
                    aria-label={`Move ${ingredient.ingredientName} up`}
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    disabled={Boolean(movingId) || index === ingredients.length - 1}
                    onClick={() => void moveIngredient(ingredient.id, 1)}
                    className="cursor-pointer text-muted-foreground hover:text-foreground"
                    aria-label={`Move ${ingredient.ingredientName} down`}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedIngredient(ingredient);
                      setDrawerOpen(true);
                    }}
                    className="cursor-pointer text-muted-foreground hover:text-foreground"
                    aria-label={`Edit ${ingredient.ingredientName}`}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    disabled={deletingId === ingredient.id}
                    onClick={() => setDeleteTarget(ingredient)}
                    className="cursor-pointer text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${ingredient.ingredientName}`}
                  >
                    {deletingId === ingredient.id ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No ingredients added yet. Start with the first measured ingredient above.
            </p>
          )}
        </div>
      </CardContent>
      <RecipeIngredientDrawer
        key={`${selectedIngredient?.id ?? "new"}-${drawerOpen ? "open" : "closed"}`}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        recipeId={recipeId}
        ingredient={selectedIngredient}
        ingredients={ingredients}
        ingredientOptions={ingredientOptions}
        unitOptions={unitOptions}
        formOptions={formOptions}
      />
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !deletingId) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleteTarget?.ingredientName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the ingredient from this recipe. Nutrition totals will update after
              removal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingId)} className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={Boolean(deletingId)}
              onClick={(event) => {
                event.preventDefault();
                if (deleteTarget) void removeIngredient(deleteTarget.id);
              }}
              className="cursor-pointer"
            >
              {deletingId ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              {deletingId ? "Removing..." : "Remove ingredient"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
