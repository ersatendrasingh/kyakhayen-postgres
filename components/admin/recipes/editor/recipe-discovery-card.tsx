"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LoaderCircle, Search, Tags, X } from "lucide-react";
import { toast } from "sonner";

import type {
  RecipeEditorOption,
  RecipeEditorRecord,
} from "@/components/admin/recipes/editor/recipe-editor-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SelectionKey =
  | "cuisineIds"
  | "cookingMethodIds"
  | "allergyIds"
  | "mealTimeIds"
  | "nutrientIds"
  | "dietTypeIds"
  | "recipeTypeIds"
  | "bodyTypeIds";

type TagSelections = Pick<RecipeEditorRecord, SelectionKey>;
type DiscoveryGroup = { title: string; key: SelectionKey; options: RecipeEditorOption[] };

const endpointPayloads: Array<{
  key: SelectionKey;
  endpoint: string;
  payloadKey: string;
}> = [
  { key: "cuisineIds", endpoint: "cuisines", payloadKey: "cuisineValues" },
  { key: "cookingMethodIds", endpoint: "cooking-method", payloadKey: "cookingMethodValues" },
  { key: "allergyIds", endpoint: "allergies", payloadKey: "allergyValues" },
  { key: "mealTimeIds", endpoint: "meal-times", payloadKey: "mealTimeValues" },
  { key: "nutrientIds", endpoint: "nutrients", payloadKey: "nutrientValues" },
  { key: "dietTypeIds", endpoint: "diet-types", payloadKey: "dietTypeValues" },
  { key: "recipeTypeIds", endpoint: "recipe-types", payloadKey: "recipeTypeValues" },
  { key: "bodyTypeIds", endpoint: "body-types", payloadKey: "bodyTypeValues" },
];

export function RecipeDiscoveryCard({
  recipe,
  groups,
}: {
  recipe: RecipeEditorRecord;
  groups: DiscoveryGroup[];
}) {
  const router = useRouter();
  const [selections, setSelections] = useState<TagSelections>({
    cuisineIds: recipe.cuisineIds,
    cookingMethodIds: recipe.cookingMethodIds,
    allergyIds: recipe.allergyIds,
    mealTimeIds: recipe.mealTimeIds,
    nutrientIds: recipe.nutrientIds,
    dietTypeIds: recipe.dietTypeIds,
    recipeTypeIds: recipe.recipeTypeIds,
    bodyTypeIds: recipe.bodyTypeIds,
  });
  const [openKey, setOpenKey] = useState<SelectionKey | null>(null);
  const [queries, setQueries] = useState<Partial<Record<SelectionKey, string>>>({});
  const [savingTags, setSavingTags] = useState(false);

  const totalSelected = Object.values(selections).reduce((total, selected) => total + selected.length, 0);

  const toggle = (key: SelectionKey, id: string) => {
    setSelections((current) => ({
      ...current,
      [key]: current[key].includes(id)
        ? current[key].filter((selectedId) => selectedId !== id)
        : [...current[key], id],
    }));
  };

  const saveTags = async () => {
    try {
      setSavingTags(true);
      const responses = await Promise.all(
        endpointPayloads.map(({ key, endpoint, payloadKey }) =>
          fetch(`/api/recipes/${recipe.id}/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ [payloadKey]: selections[key] }),
          })
        )
      );
      if (responses.some((response) => !response.ok)) {
        throw new Error("Unable to save all discovery tags.");
      }
      toast.success("Discovery tags saved");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save tags.");
    } finally {
      setSavingTags(false);
    }
  };

  return (
    <Card className="overflow-hidden rounded-2xl py-0">
      <CardHeader className="border-b p-4">
        <CardTitle className="flex items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-2">
            <Tags className="size-4 text-primary" />
            Discovery tags
          </span>
          <Badge variant="secondary">{totalSelected} selected</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {groups.map((group) => (
          <TagGroupPicker
            key={group.key}
            group={group}
            selectedIds={selections[group.key]}
            open={openKey === group.key}
            query={queries[group.key] ?? ""}
            onToggleOpen={() => setOpenKey((current) => current === group.key ? null : group.key)}
            onQueryChange={(value) => setQueries((current) => ({ ...current, [group.key]: value }))}
            onToggle={(id) => toggle(group.key, id)}
          />
        ))}
        <Button onClick={() => void saveTags()} disabled={savingTags} className="mt-2 h-10 w-full rounded-xl">
          {savingTags ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {savingTags ? "Saving..." : "Save discovery tags"}
        </Button>
      </CardContent>
    </Card>
  );
}

function TagGroupPicker({
  group,
  selectedIds,
  open,
  query,
  onToggleOpen,
  onQueryChange,
  onToggle,
}: {
  group: DiscoveryGroup;
  selectedIds: string[];
  open: boolean;
  query: string;
  onToggleOpen: () => void;
  onQueryChange: (query: string) => void;
  onToggle: (id: string) => void;
}) {
  const selectedOptions = group.options.filter((option) => selectedIds.includes(option.id));
  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return group.options;
    return group.options.filter((option) => option.label.toLowerCase().includes(normalized));
  }, [group.options, query]);

  return (
    <section className="overflow-hidden rounded-xl border bg-muted/[0.08]">
      <button
        type="button"
        onClick={onToggleOpen}
        className="flex w-full cursor-pointer items-center justify-between gap-3 p-3 text-left"
        aria-expanded={open}
      >
        <span>
          <span className="block text-sm font-medium">{group.title}</span>
          <span className="text-xs text-muted-foreground">
            {selectedIds.length ? `${selectedIds.length} selected` : "Nothing selected"}
          </span>
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {selectedOptions.length ? (
        <div className="flex flex-wrap gap-1.5 border-t px-3 py-2">
          {selectedOptions.map((option) => (
            <Badge key={option.id} variant="secondary" className="gap-1 pr-1">
              {option.label}
              <button
                type="button"
                className="cursor-pointer rounded-full p-0.5 hover:bg-foreground/10"
                onClick={() => onToggle(option.id)}
                aria-label={`Remove ${option.label}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
      {open ? (
        <div className="space-y-2 border-t p-3">
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={`Search ${group.title.toLowerCase()}`}
              className="h-9 rounded-lg pl-9"
            />
          </label>
          <div className="max-h-44 space-y-1 overflow-y-auto pr-1">
            {filteredOptions.length ? filteredOptions.map((option) => (
              <label key={option.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted">
                <Checkbox checked={selectedIds.includes(option.id)} onCheckedChange={() => onToggle(option.id)} />
                <span>{option.label}</span>
              </label>
            )) : (
              <p className="py-4 text-center text-xs text-muted-foreground">No matching options</p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
