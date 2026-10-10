import { Layers3, ListChecks, Tags } from "lucide-react";

import { RecipeDiscoveryCard } from "@/components/admin/recipes/editor/recipe-discovery-card";
import { RecipeEditorActions } from "@/components/admin/recipes/editor/recipe-editor-actions";
import { RecipeInfoCard } from "@/components/admin/recipes/editor/recipe-info-card";
import { RecipeIngredientsCard } from "@/components/admin/recipes/editor/recipe-ingredients-card";
import { RecipeMediaSettingsCard } from "@/components/admin/recipes/editor/recipe-media-settings-card";
import { RecipeOverviewCard } from "@/components/admin/recipes/editor/recipe-overview-card";
import { RecipeSeoAuditCard } from "@/components/admin/recipes/editor/recipe-seo-audit-card";
import { RecipeStepsCard } from "@/components/admin/recipes/editor/recipe-steps-card";
import { Badge } from "@/components/ui/badge";
import type {
  RecipeEditorOptions,
  RecipeEditorRecord,
} from "@/components/admin/recipes/editor/recipe-editor-types";

export function RecipeEditor({
  recipe,
  options,
}: {
  recipe: RecipeEditorRecord;
  options: RecipeEditorOptions;
}) {
  const discoveryCount =
    recipe.cuisineIds.length +
    recipe.cookingMethodIds.length +
    recipe.allergyIds.length +
    recipe.mealTimeIds.length +
    recipe.nutrientIds.length +
    recipe.dietTypeIds.length +
    recipe.recipeTypeIds.length +
    recipe.bodyTypeIds.length +
    recipe.seasonIds.length;
  const hasSeasonClassification =
    recipe.seasonality === "ALL_YEAR" ||
    (recipe.seasonality === "SEASONAL" && recipe.seasonIds.length > 0);
  const canPublish =
    Boolean(recipe.title && recipe.description && recipe.imageUrl) &&
    Boolean(recipe.recipeDifficultyId) &&
    hasSeasonClassification;

  return (
    <div className="min-w-0 space-y-6">
      <section className="rounded-2xl border bg-card/85 p-4 shadow-sm backdrop-blur sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 space-y-2">
            <h1 className="truncate text-2xl font-semibold tracking-tight">{recipe.title}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={recipe.isPublished ? "default" : "secondary"}>
                {recipe.isPublished ? "Published" : "Draft"}
              </Badge>
              {[
                { label: `${recipe.ingredients.length} ingredients`, icon: Layers3 },
                { label: `${recipe.steps.length} steps`, icon: ListChecks },
                { label: `${discoveryCount} tags`, icon: Tags },
              ].map(({ label, icon: Icon }) => (
                <span key={label} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Icon className="size-3.5" />
                  {label}
                </span>
              ))}
              <span className="text-sm text-muted-foreground">Manage recipe content and publishing</span>
            </div>
          </div>
          <RecipeEditorActions
            recipeId={recipe.id}
            title={recipe.title}
            isPublished={recipe.isPublished}
            canPublish={canPublish}
          />
        </div>
      </section>

      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <RecipeOverviewCard recipe={recipe} />
          <RecipeIngredientsCard
            recipeId={recipe.id}
            ingredients={recipe.ingredients}
            ingredientOptions={options.ingredients}
            unitOptions={options.units}
            formOptions={options.forms}
          />
          <RecipeStepsCard recipeId={recipe.id} steps={recipe.steps} />
          <RecipeSeoAuditCard recipe={recipe} />
        </div>
        <aside className="min-w-0 space-y-4 xl:sticky xl:top-24">
          <RecipeMediaSettingsCard
            recipe={recipe}
            categories={options.categories}
            difficulties={options.difficulties}
            seasons={options.seasons}
          />
          <RecipeDiscoveryCard
            recipe={recipe}
            groups={[
              { title: "Cuisines", key: "cuisineIds", options: options.cuisines },
              { title: "Cooking methods", key: "cookingMethodIds", options: options.cookingMethods },
              { title: "Meal times", key: "mealTimeIds", options: options.mealTimes },
              { title: "Diet types", key: "dietTypeIds", options: options.dietTypes },
              { title: "Recipe types", key: "recipeTypeIds", options: options.recipeTypes },
              { title: "Body types", key: "bodyTypeIds", options: options.bodyTypes },
              { title: "Allergies", key: "allergyIds", options: options.allergies },
              { title: "Nutrients", key: "nutrientIds", options: options.nutrients },
            ]}
          />
          <RecipeInfoCard recipe={recipe} />
        </aside>
      </div>
    </div>
  );
}
