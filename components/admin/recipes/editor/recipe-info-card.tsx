import { CalendarClock, Eye, Hash, Link2 } from "lucide-react";

import type { RecipeEditorRecord } from "@/components/admin/recipes/editor/recipe-editor-types";
import { Badge } from "@/components/ui/badge";

function formatDateTime(value: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

export function RecipeInfoCard({ recipe }: { recipe: RecipeEditorRecord }) {
  const totalMinutes = recipe.recipeCookingTime
    ? recipe.recipeCookingTime.totalTime ??
      recipe.recipeCookingTime.prepTime +
        recipe.recipeCookingTime.cookTime +
        recipe.recipeCookingTime.restTime
    : 0;
  const rows = [
    { label: "Created", value: formatDateTime(recipe.createdAt), icon: CalendarClock },
    { label: "Last updated", value: formatDateTime(recipe.updatedAt), icon: CalendarClock },
    { label: "Content updated", value: formatDateTime(recipe.contentUpdatedAt), icon: CalendarClock },
    { label: "Published", value: formatDateTime(recipe.publishedAt), icon: CalendarClock },
    { label: "Views", value: recipe.views.toLocaleString("en-IN"), icon: Eye },
    { label: "Total time", value: totalMinutes ? formatMinutes(totalMinutes) : "Not set", icon: CalendarClock },
  ];

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Recipe info</h2>
          <p className="mt-1 text-xs text-muted-foreground">Audit and publishing details</p>
        </div>
        <Badge variant={recipe.isPublished ? "secondary" : "outline"}>
          {recipe.isPublished ? "Live" : "Draft"}
        </Badge>
      </div>

      <div className="space-y-3">
        {rows.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-start gap-3 text-sm">
            <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {label}
              </p>
              <p className="mt-0.5 break-words font-medium">{value}</p>
            </div>
          </div>
        ))}
        <div className="flex items-start gap-3 text-sm">
          <Link2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Slug
            </p>
            <p className="mt-0.5 break-words font-medium">{recipe.slug}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 text-sm">
          <Hash className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Recipe ID
            </p>
            <p className="mt-0.5 break-all font-mono text-xs">{recipe.id}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
