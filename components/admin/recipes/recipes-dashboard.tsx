"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type RowSelectionState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  BookOpen,
  CheckCircle2,
  Download,
  FilePenLine,
  Gauge,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Tags,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { getRecipeColumns } from "@/components/admin/recipes/recipe-columns";
import { RecipeCreateDrawer } from "@/components/admin/recipes/recipe-create-drawer";
import type {
  RecipeFilterOption,
  RecipeFilters,
  RecipeListRecord,
} from "@/components/admin/recipes/recipe-types";
import { exportRecipes } from "@/components/admin/recipes/recipe-utils";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type DeleteSelection =
  | { type: "single"; recipe: RecipeListRecord }
  | { type: "bulk"; recipes: RecipeListRecord[] }
  | null;

function buildPageHref(filters: RecipeFilters, page: number) {
  const params = new URLSearchParams();
  if (filters.search) params.set("q", filters.search);
  if (filters.categoryId) params.set("category", filters.categoryId);
  if (filters.cuisineId) params.set("cuisine", filters.cuisineId);
  if (filters.mealTimeId) params.set("mealTime", filters.mealTimeId);
  if (filters.status) params.set("status", filters.status);
  if (filters.difficultyId) params.set("difficulty", filters.difficultyId);
  if (filters.seasonality) params.set("seasonality", filters.seasonality);
  if (filters.seasonId) params.set("season", filters.seasonId);
  if (filters.cookingMethodId) params.set("cookingMethod", filters.cookingMethodId);
  if (filters.allergyId) params.set("allergy", filters.allergyId);
  if (filters.nutrientId) params.set("nutrient", filters.nutrientId);
  if (filters.dietTypeId) params.set("dietType", filters.dietTypeId);
  if (filters.recipeTypeId) params.set("recipeType", filters.recipeTypeId);
  if (filters.bodyTypeId) params.set("bodyType", filters.bodyTypeId);
  if (filters.ingredientId) params.set("ingredient", filters.ingredientId);
  if (filters.minTime) params.set("minTime", filters.minTime);
  if (filters.maxTime) params.set("maxTime", filters.maxTime);
  if (filters.auditStatus) params.set("audit", filters.auditStatus);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin/recipes?${query}` : "/admin/recipes";
}

const emptyFilters: RecipeFilters = {
  search: "",
  categoryId: "",
  cuisineId: "",
  mealTimeId: "",
  status: "",
  difficultyId: "",
  seasonality: "",
  seasonId: "",
  cookingMethodId: "",
  allergyId: "",
  nutrientId: "",
  dietTypeId: "",
  recipeTypeId: "",
  bodyTypeId: "",
  ingredientId: "",
  minTime: "",
  maxTime: "",
  auditStatus: "",
};

const advancedFilterKeys = [
  "difficultyId",
  "seasonality",
  "seasonId",
  "cookingMethodId",
  "allergyId",
  "nutrientId",
  "dietTypeId",
  "recipeTypeId",
  "bodyTypeId",
  "ingredientId",
  "minTime",
  "maxTime",
  "auditStatus",
] satisfies Array<keyof RecipeFilters>;

function visiblePageNumbers(page: number, pageCount: number) {
  const candidates = new Set([
    1,
    pageCount,
    page - 2,
    page - 1,
    page,
    page + 1,
    page + 2,
  ]);

  return Array.from(candidates)
    .filter((number) => number >= 1 && number <= pageCount)
    .sort((left, right) => left - right);
}

export function RecipesDashboard({
  recipes,
  categories,
  cuisines,
  mealTimes,
  difficulties,
  seasons,
  cookingMethods,
  allergies,
  nutrients,
  dietTypes,
  recipeTypes,
  bodyTypes,
  ingredients,
  stats,
  filters,
  page,
  pageCount,
  totalFiltered,
}: {
  recipes: RecipeListRecord[];
  categories: RecipeFilterOption[];
  cuisines: RecipeFilterOption[];
  mealTimes: RecipeFilterOption[];
  difficulties: RecipeFilterOption[];
  seasons: RecipeFilterOption[];
  cookingMethods: RecipeFilterOption[];
  allergies: RecipeFilterOption[];
  nutrients: RecipeFilterOption[];
  dietTypes: RecipeFilterOption[];
  recipeTypes: RecipeFilterOption[];
  bodyTypes: RecipeFilterOption[];
  ingredients: RecipeFilterOption[];
  stats: {
    total: number;
    published: number;
    drafts: number;
    averageAuditScore: number;
  };
  filters: RecipeFilters;
  page: number;
  pageCount: number;
  totalFiltered: number;
}) {
  const router = useRouter();
  const [filterValues, setFilterValues] = useState<RecipeFilters>(filters);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteSelection, setDeleteSelection] = useState<DeleteSelection>(null);
  const [deleting, setDeleting] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [jumpPage, setJumpPage] = useState(String(page));
  const [bulkTagOpen, setBulkTagOpen] = useState(false);
  const [bulkTagging, setBulkTagging] = useState(false);
  const [bulkDifficultyId, setBulkDifficultyId] = useState("__KEEP__");
  const [bulkSeasonality, setBulkSeasonality] = useState("__KEEP__");
  const [bulkSeasonIds, setBulkSeasonIds] = useState<string[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const refresh = () => {
    setRowSelection({});
    router.refresh();
  };

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRowSelection({});
    router.replace(buildPageHref(filterValues, 1), { scroll: false });
  };

  const clearFilters = () => {
    setFilterValues(emptyFilters);
    setRowSelection({});
    router.replace("/admin/recipes", { scroll: false });
  };

  const goToPage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const target = Math.min(
      Math.max(Number.parseInt(jumpPage, 10) || page, 1),
      pageCount,
    );
    setJumpPage(String(target));
    router.push(buildPageHref(filters, target), { scroll: false });
  };

  const updatePublished = async (recipe: RecipeListRecord, checked: boolean) => {
    try {
      setPublishingId(recipe.id);
      const response = await fetch(
        `/api/recipes/${recipe.id}/${checked ? "publish" : "unpublish"}`,
        { method: "PATCH" }
      );

      if (!response.ok) {
        const message = (await response.text()).replace(/^"|"$/g, "");
        throw new Error(
          message ||
            (checked
              ? "Complete content, difficulty and season use before publishing."
              : "Unable to unpublish recipe.")
        );
      }

      toast.success(`${recipe.title} ${checked ? "published" : "unpublished"}`);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update recipe status.");
    } finally {
      setPublishingId(null);
    }
  };

  const columns = getRecipeColumns(
    (recipe, checked) => void updatePublished(recipe, checked),
    (recipe) => setDeleteSelection({ type: "single", recipe }),
    publishingId
  );

  // TanStack Table owns mutable callbacks and cannot be safely compiler-memoized.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: recipes,
    columns,
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting, rowSelection },
  });

  const selectedRecipes = recipes.filter((recipe) => rowSelection[recipe.id]);
  const deleteItems =
    deleteSelection?.type === "single"
      ? [deleteSelection.recipe]
      : deleteSelection?.recipes ?? [];
  const pageNumbers = visiblePageNumbers(page, pageCount);
  const activeAdvancedCount = advancedFilterKeys.filter((key) => Boolean(filterValues[key])).length;
  const advancedSelectFilters: Array<{
    key: keyof RecipeFilters;
    label: string;
    placeholder: string;
    options: RecipeFilterOption[];
  }> = [
    { key: "categoryId", label: "Food category", placeholder: "Any category", options: categories },
    { key: "difficultyId", label: "Difficulty", placeholder: "Any difficulty", options: difficulties },
    { key: "seasonId", label: "Season", placeholder: "Any season", options: seasons },
    { key: "cuisineId", label: "Cuisine", placeholder: "Any cuisine", options: cuisines },
    { key: "mealTimeId", label: "Meal time", placeholder: "Any meal time", options: mealTimes },
    { key: "cookingMethodId", label: "Cooking method", placeholder: "Any cooking method", options: cookingMethods },
    { key: "nutrientId", label: "Nutrient", placeholder: "Any nutrient", options: nutrients },
    { key: "dietTypeId", label: "Diet type", placeholder: "Any diet type", options: dietTypes },
    { key: "recipeTypeId", label: "Recipe type", placeholder: "Any recipe type", options: recipeTypes },
    { key: "bodyTypeId", label: "Body type", placeholder: "Any body type", options: bodyTypes },
    { key: "allergyId", label: "Allergy", placeholder: "Any allergy", options: allergies },
    { key: "ingredientId", label: "Ingredient", placeholder: "Any ingredient", options: ingredients },
  ];

  const toggleBulkSeason = (seasonId: string, checked: boolean) => {
    setBulkSeasonIds((current) =>
      checked
        ? [...new Set([...current, seasonId])]
        : current.filter((id) => id !== seasonId)
    );
  };

  const resetBulkTagForm = () => {
    setBulkDifficultyId("__KEEP__");
    setBulkSeasonality("__KEEP__");
    setBulkSeasonIds([]);
  };

  const applyBulkTags = async () => {
    if (!selectedRecipes.length) return;

    if (bulkDifficultyId === "__KEEP__" && bulkSeasonality === "__KEEP__") {
      toast.error("Choose difficulty or season use before applying.");
      return;
    }

    if (bulkSeasonality === "SEASONAL" && bulkSeasonIds.length === 0) {
      toast.error("Select at least one season for strict seasonal recipes.");
      return;
    }

    const payload: Record<string, unknown> = {
      recipeIds: selectedRecipes.map((recipe) => recipe.id),
    };

    if (bulkDifficultyId !== "__KEEP__") {
      payload.recipeDifficultyId =
        bulkDifficultyId === "__CLEAR__" ? null : bulkDifficultyId;
    }

    if (bulkSeasonality !== "__KEEP__") {
      payload.seasonality = bulkSeasonality;
      payload.seasonIds = bulkSeasonality === "SEASONAL" ? bulkSeasonIds : [];
    }

    try {
      setBulkTagging(true);
      const response = await fetch("/api/recipes/bulk-tags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Unable to update selected recipes.");
      }

      const result = (await response.json()) as { updated?: number };
      toast.success(`${result.updated ?? selectedRecipes.length} recipes updated`);
      setBulkTagOpen(false);
      resetBulkTagForm();
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update selected recipes.");
    } finally {
      setBulkTagging(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteItems.length) return;
    try {
      setDeleting(true);
      for (const recipe of deleteItems) {
        const response = await fetch(`/api/recipes/${recipe.id}`, { method: "DELETE" });
        if (!response.ok) throw new Error(`Unable to delete "${recipe.title}".`);
      }
      toast.success(
        deleteItems.length === 1 ? "Recipe deleted successfully" : "Recipes deleted successfully"
      );
      setDeleteSelection(null);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete recipes.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <section className="admin-taxonomy-hero rounded-[32px] p-5 sm:p-7 lg:p-9">
        <div className="relative z-[1] flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-3">
            <span className="admin-taxonomy-hero-badge inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]">
              Recipe Studio
            </span>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Recipes workspace
              </h1>
              <p className="admin-taxonomy-hero-copy mt-2 text-sm sm:text-base">
                Build, review and publish recipe content with ingredients, steps and discovery
                coverage visible at a glance.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="admin-taxonomy-hero-action rounded-2xl"
              onClick={() => exportRecipes(recipes, "recipes-page.csv")}
            >
              <Download />
              Export Page
            </Button>
            <Button className="rounded-2xl shadow-sm" onClick={() => setCreateOpen(true)}>
              <Plus />
              Add Recipe
            </Button>
          </div>
        </div>
        <div className="relative z-[1] mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total Recipes", value: stats.total, icon: BookOpen },
            { label: "Published", value: stats.published, icon: CheckCircle2 },
            { label: "Drafts", value: stats.drafts, icon: FilePenLine },
            {
              label: "Avg Audit Score",
              value: `${stats.averageAuditScore}/100`,
              icon: Gauge,
            },
          ].map((stat) => (
            <div key={stat.label} className="admin-taxonomy-stat rounded-3xl px-5 py-5 backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <p className="admin-taxonomy-stat-label text-sm font-medium">{stat.label}</p>
                <stat.icon className="admin-taxonomy-stat-icon size-5" />
              </div>
              <p className="admin-taxonomy-stat-value mt-3 text-3xl font-semibold">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border bg-card p-4 shadow-sm sm:p-5">
        <form
          onSubmit={applyFilters}
          className="grid gap-3 xl:grid-cols-[minmax(220px,1fr)_minmax(130px,170px)_minmax(130px,170px)_minmax(130px,170px)_minmax(120px,145px)_minmax(130px,150px)_3rem_3rem]"
        >
          <div className="relative">
            <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-12 rounded-2xl pl-11"
              placeholder="Search recipes"
              value={filterValues.search}
              onChange={(event) =>
                setFilterValues((current) => ({ ...current, search: event.target.value }))
              }
            />
          </div>
          {[
            {
              value: filterValues.categoryId,
              key: "categoryId" as const,
              label: "All categories",
              options: categories,
            },
            {
              value: filterValues.cuisineId,
              key: "cuisineId" as const,
              label: "All cuisines",
              options: cuisines,
            },
            {
              value: filterValues.mealTimeId,
              key: "mealTimeId" as const,
              label: "All meal times",
              options: mealTimes,
            },
          ].map((filter) => (
            <select
              key={filter.key}
              value={filter.value}
              onChange={(event) =>
                setFilterValues((current) => ({ ...current, [filter.key]: event.target.value }))
              }
              className="h-12 cursor-pointer rounded-2xl border border-input bg-background px-4 text-sm"
            >
              <option value="">{filter.label}</option>
              {filter.options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          ))}
          <select
            value={filterValues.status}
            onChange={(event) =>
              setFilterValues((current) => ({ ...current, status: event.target.value }))
            }
            className="h-12 cursor-pointer rounded-2xl border border-input bg-background px-4 text-sm"
          >
            <option value="">All status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="incomplete">Needs content</option>
            <option value="needs-tags">Needs tags</option>
            <option value="missing-difficulty">Missing difficulty</option>
            <option value="needs-season-review">Needs season review</option>
            <option value="ready-to-publish">Ready to publish</option>
            <option value="audit-fix-first">Audit: fix first</option>
            <option value="audit-needs-work">Audit: needs work</option>
            <option value="audit-good">Audit: good</option>
          </select>
          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-2xl"
            onClick={() => setAdvancedOpen(true)}
          >
            <SlidersHorizontal />
            More filters
            {activeAdvancedCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeAdvancedCount}
              </Badge>
            )}
          </Button>
          <div className="grid grid-cols-2 gap-3 xl:contents">
            <Button type="submit" className="h-12 rounded-2xl xl:size-12" aria-label="Apply filters">
              <SlidersHorizontal />
              <span className="xl:sr-only">Apply</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-2xl xl:size-12"
              aria-label="Clear filters"
              onClick={clearFilters}
            >
              <RotateCcw />
              <span className="xl:sr-only">Clear</span>
            </Button>
          </div>
        </form>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button
            variant="outline"
            className="rounded-2xl"
            disabled={!selectedRecipes.length}
            onClick={() => setBulkTagOpen(true)}
          >
            <Tags />
            Tag Selected
          </Button>
          <Button
            variant="outline"
            className="rounded-2xl"
            disabled={!selectedRecipes.length}
            onClick={() => exportRecipes(selectedRecipes, "selected-recipes.csv")}
          >
            <Download />
            Export Selected
          </Button>
          <Button
            variant="outline"
            className="rounded-2xl"
            disabled={!selectedRecipes.length}
            onClick={() => setDeleteSelection({ type: "bulk", recipes: selectedRecipes })}
          >
            <Trash2 />
            Delete Selected
          </Button>
        </div>

        <div className="mt-5 overflow-x-auto rounded-3xl border border-border/70">
          <Table>
            <TableHeader className="bg-muted/35">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "h-14 px-4",
                        header.column.id === "tagging" && "hidden xl:table-cell",
                        header.column.id === "updatedAt" && "hidden xl:table-cell"
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          "px-4 py-3",
                          cell.column.id === "tagging" && "hidden xl:table-cell",
                          cell.column.id === "updatedAt" && "hidden xl:table-cell"
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                    No recipes match these filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{totalFiltered} matching recipes</span>
              {selectedRecipes.length > 0 && (
                <Badge variant="secondary">{selectedRecipes.length} selected</Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
                {page > 1 ? <Link href={buildPageHref(filters, 1)}>First</Link> : "First"}
              </Button>
              <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
                {page > 1 ? <Link href={buildPageHref(filters, page - 1)}>Previous</Link> : "Previous"}
              </Button>
              <nav className="flex items-center gap-1" aria-label="Recipe pages">
                {pageNumbers.map((number, index) => (
                  <span key={number} className="flex items-center gap-1">
                    {index > 0 && number - pageNumbers[index - 1] > 1 && (
                      <span className="px-1 text-sm text-muted-foreground">...</span>
                    )}
                    <Button
                      variant={number === page ? "default" : "outline"}
                      size="sm"
                      asChild={number !== page}
                      aria-current={number === page ? "page" : undefined}
                    >
                      {number === page ? (
                        String(number)
                      ) : (
                        <Link href={buildPageHref(filters, number)}>{number}</Link>
                      )}
                    </Button>
                  </span>
                ))}
              </nav>
              <Button variant="outline" size="sm" disabled={page >= pageCount} asChild={page < pageCount}>
                {page < pageCount ? <Link href={buildPageHref(filters, page + 1)}>Next</Link> : "Next"}
              </Button>
              <Button variant="outline" size="sm" disabled={page >= pageCount} asChild={page < pageCount}>
                {page < pageCount ? <Link href={buildPageHref(filters, pageCount)}>Last</Link> : "Last"}
              </Button>
              <form onSubmit={goToPage} className="ml-1 flex items-center gap-2">
                <label htmlFor="recipe-page-jump" className="sr-only">
                  Go to page
                </label>
                <Input
                  id="recipe-page-jump"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={jumpPage}
                  onChange={(event) => setJumpPage(event.target.value)}
                  className="h-8 w-20 rounded-lg px-2"
                  aria-label={`Go to page from 1 to ${pageCount}`}
                />
                <Button type="submit" variant="outline" size="sm">
                  Go
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <RecipeCreateDrawer
        key={createOpen ? "open" : "closed"}
        open={createOpen}
        onOpenChange={setCreateOpen}
        categories={categories}
      />

      <Dialog open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Advanced recipe filters</DialogTitle>
            <DialogDescription>
              Combine discovery tags, recipe type, season, ingredient and total time to find exact recipe sets.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              setRowSelection({});
              setAdvancedOpen(false);
              router.replace(buildPageHref(filterValues, 1), { scroll: false });
            }}
            className="space-y-5"
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="advanced-search">Search</Label>
                <Input
                  id="advanced-search"
                  value={filterValues.search}
                  onChange={(event) =>
                    setFilterValues((current) => ({ ...current, search: event.target.value }))
                  }
                  placeholder="Title or slug"
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="advanced-status">Status</Label>
                <select
                  id="advanced-status"
                  value={filterValues.status}
                  onChange={(event) =>
                    setFilterValues((current) => ({ ...current, status: event.target.value }))
                  }
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="">Any status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="incomplete">Needs content</option>
                  <option value="needs-tags">Needs tags</option>
                  <option value="missing-difficulty">Missing difficulty</option>
                  <option value="needs-season-review">Needs season review</option>
                  <option value="ready-to-publish">Ready to publish</option>
                  <option value="audit-fix-first">Audit: fix first</option>
                  <option value="audit-needs-work">Audit: needs work</option>
                  <option value="audit-good">Audit: good</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="advanced-audit-status">Audit health</Label>
                <select
                  id="advanced-audit-status"
                  value={filterValues.auditStatus}
                  onChange={(event) =>
                    setFilterValues((current) => ({ ...current, auditStatus: event.target.value }))
                  }
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="">Any audit score</option>
                  <option value="fix-first">Fix first (red)</option>
                  <option value="needs-work">Needs work (yellow)</option>
                  <option value="good">Good or excellent (green)</option>
                  <option value="excellent">Excellent only</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="advanced-season-use">Season use</Label>
                <select
                  id="advanced-season-use"
                  value={filterValues.seasonality}
                  onChange={(event) =>
                    setFilterValues((current) => ({ ...current, seasonality: event.target.value }))
                  }
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="">Any season use</option>
                  <option value="ALL_YEAR">All year</option>
                  <option value="SEASONAL">Strict seasonal</option>
                  <option value="UNREVIEWED">Needs review</option>
                </select>
              </div>

              {advancedSelectFilters.map((filter) => (
                <div key={filter.key} className="space-y-2">
                  <Label htmlFor={`advanced-${filter.key}`}>{filter.label}</Label>
                  <select
                    id={`advanced-${filter.key}`}
                    value={filterValues[filter.key]}
                    onChange={(event) =>
                      setFilterValues((current) => ({
                        ...current,
                        [filter.key]: event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                  >
                    <option value="">{filter.placeholder}</option>
                    {filter.options.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              <div className="space-y-2">
                <Label htmlFor="advanced-min-time">Min total time</Label>
                <Input
                  id="advanced-min-time"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={filterValues.minTime}
                  onChange={(event) =>
                    setFilterValues((current) => ({ ...current, minTime: event.target.value }))
                  }
                  placeholder="Minutes"
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="advanced-max-time">Max total time</Label>
                <Input
                  id="advanced-max-time"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={filterValues.maxTime}
                  onChange={(event) =>
                    setFilterValues((current) => ({ ...current, maxTime: event.target.value }))
                  }
                  placeholder="Minutes"
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFilterValues(emptyFilters);
                  setRowSelection({});
                  setAdvancedOpen(false);
                  router.replace("/admin/recipes", { scroll: false });
                }}
              >
                Reset filters
              </Button>
              <Button type="submit">
                Apply filters
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkTagOpen} onOpenChange={(open) => {
        setBulkTagOpen(open);
        if (!open) resetBulkTagForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tag selected recipes</DialogTitle>
            <DialogDescription>
              Apply common difficulty and season use to {selectedRecipes.length} selected recipes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="bulk-recipe-difficulty">Difficulty</Label>
              <select
                id="bulk-recipe-difficulty"
                value={bulkDifficultyId}
                onChange={(event) => setBulkDifficultyId(event.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="__KEEP__">Keep existing difficulty</option>
                <option value="__CLEAR__">Needs review</option>
                {difficulties.map((difficulty) => (
                  <option key={difficulty.id} value={difficulty.id}>
                    {difficulty.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-recipe-seasonality">Season use</Label>
              <select
                id="bulk-recipe-seasonality"
                value={bulkSeasonality}
                onChange={(event) => {
                  setBulkSeasonality(event.target.value);
                  if (event.target.value !== "SEASONAL") setBulkSeasonIds([]);
                }}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="__KEEP__">Keep existing season use</option>
                <option value="UNREVIEWED">Needs review</option>
                <option value="ALL_YEAR">All year</option>
                <option value="SEASONAL">Strict seasonal</option>
              </select>
            </div>

            {bulkSeasonality === "SEASONAL" && (
              <div className="space-y-2 rounded-2xl border bg-muted/20 p-3">
                <p className="text-sm font-medium">Active seasons</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {seasons.map((season) => (
                    <label key={season.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={bulkSeasonIds.includes(season.id)}
                        onCheckedChange={(checked) => toggleBulkSeason(season.id, Boolean(checked))}
                      />
                      <span>{season.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkTagOpen(false)} disabled={bulkTagging}>
              Cancel
            </Button>
            <Button onClick={applyBulkTags} disabled={bulkTagging || !selectedRecipes.length}>
              {bulkTagging ? "Applying..." : "Apply tags"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteSelection)} onOpenChange={(open) => !open && setDeleteSelection(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteItems.length === 1 ? "recipe" : "selected recipes"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes recipe content, ingredients, steps and attached media.
              Unpublish instead when the recipe may be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={deleting} onClick={confirmDelete}>
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
