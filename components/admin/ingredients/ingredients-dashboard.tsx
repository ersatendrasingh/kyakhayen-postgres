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
  Beaker,
  CircleAlert,
  Download,
  Plus,
  RotateCcw,
  Salad,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { getIngredientColumns } from "@/components/admin/ingredients/ingredient-columns";
import { IngredientDrawer } from "@/components/admin/ingredients/ingredient-drawer";
import type {
  IngredientCategoryOption,
  IngredientRecord,
} from "@/components/admin/ingredients/ingredient-types";
import { exportIngredients } from "@/components/admin/ingredients/ingredient-utils";
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
import { Input } from "@/components/ui/input";
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
  | { type: "single"; ingredient: IngredientRecord }
  | { type: "bulk"; ingredients: IngredientRecord[] }
  | null;

type Filters = {
  search: string;
  categoryId: string;
  status: string;
  nutrition: string;
};

function buildPageHref(filters: Filters, page: number) {
  const params = new URLSearchParams();
  if (filters.search) params.set("q", filters.search);
  if (filters.categoryId) params.set("category", filters.categoryId);
  if (filters.status) params.set("status", filters.status);
  if (filters.nutrition) params.set("nutrition", filters.nutrition);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin/ingredients?${query}` : "/admin/ingredients";
}

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

export function IngredientsDashboard({
  ingredients,
  categories,
  stats,
  filters,
  page,
  pageCount,
  totalFiltered,
}: {
  ingredients: IngredientRecord[];
  categories: IngredientCategoryOption[];
  stats: {
    total: number;
    published: number;
    nutritionComplete: number;
    recipesMissingConversion: number;
  };
  filters: Filters;
  page: number;
  pageCount: number;
  totalFiltered: number;
}) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteSelection, setDeleteSelection] = useState<DeleteSelection>(null);
  const [deleting, setDeleting] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [filterValues, setFilterValues] = useState<Filters>(filters);
  const [jumpPage, setJumpPage] = useState(String(page));

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
    const clearedFilters: Filters = {
      search: "",
      categoryId: "",
      status: "",
      nutrition: "",
    };

    setFilterValues(clearedFilters);
    setRowSelection({});
    router.replace("/admin/ingredients", { scroll: false });
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

  const updatePublishedState = async (
    ingredient: IngredientRecord,
    isPublished: boolean
  ) => {
    try {
      setPublishingId(ingredient.id);
      const response = await fetch(
        `/api/ingredients/${ingredient.id}/${isPublished ? "publish" : "unpublish"}`,
        { method: "PATCH" }
      );

      if (!response.ok) {
        throw new Error("Unable to update ingredient visibility.");
      }

      toast.success(`${ingredient.name} ${isPublished ? "published" : "unpublished"}`);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update ingredient.");
    } finally {
      setPublishingId(null);
    }
  };

  const columns = getIngredientColumns(
    (ingredient, isPublished) => void updatePublishedState(ingredient, isPublished),
    (ingredient) => setDeleteSelection({ type: "single", ingredient }),
    publishingId
  );

  // TanStack Table owns mutable callbacks and cannot be safely compiler-memoized.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: ingredients,
    columns,
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting, rowSelection },
  });

  const selectedIngredients = ingredients.filter(
    (ingredient) => rowSelection[ingredient.id]
  );
  const deleteItems =
    deleteSelection?.type === "single"
      ? [deleteSelection.ingredient]
      : deleteSelection?.ingredients ?? [];
  const pageNumbers = visiblePageNumbers(page, pageCount);

  const confirmDelete = async () => {
    if (!deleteItems.length) return;

    try {
      setDeleting(true);

      for (const ingredient of deleteItems) {
        const response = await fetch(`/api/ingredients/${ingredient.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error(
            `Unable to delete "${ingredient.name}". It may still be used by recipes.`
          );
        }
      }

      toast.success(
        deleteItems.length === 1
          ? "Ingredient deleted successfully"
          : `${deleteItems.length} ingredients deleted successfully`
      );
      setDeleteSelection(null);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete ingredient.");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <section className="admin-taxonomy-hero rounded-[32px] p-5 sm:p-6 lg:p-7">
        <div className="relative z-[1] flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl space-y-3">
            <span className="admin-taxonomy-hero-badge inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]">
              Ingredient Intelligence
            </span>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Ingredients catalog
              </h1>
              <p className="admin-taxonomy-hero-copy mt-2 text-sm sm:text-base">
                Control nutrition sources and measurement coverage behind every recipe calculation.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 sm:flex-nowrap xl:shrink-0">
            <Button
              variant="outline"
              className="admin-taxonomy-hero-action rounded-2xl"
              onClick={() => exportIngredients(ingredients, "ingredients-page.csv")}
            >
              <Download />
              Export Page
            </Button>
            <Button className="rounded-2xl shadow-sm" onClick={() => setDrawerOpen(true)}>
              <Plus />
              Add Ingredient
            </Button>
          </div>
        </div>

        <div className="relative z-[1] mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total Ingredients", value: stats.total, icon: Salad },
            { label: "Published Ingredients", value: stats.published, icon: Salad },
            { label: "Nutrition Complete", value: stats.nutritionComplete, icon: Beaker },
            {
              label: "Recipes Missing Conversion",
              value: stats.recipesMissingConversion,
              icon: CircleAlert,
            },
          ].map((stat) => (
            <div key={stat.label} className="admin-taxonomy-stat rounded-3xl px-5 py-4 backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <p className="admin-taxonomy-stat-label text-sm font-medium">{stat.label}</p>
                <stat.icon className="admin-taxonomy-stat-icon size-5" />
              </div>
              <p className="admin-taxonomy-stat-value mt-3 text-3xl font-semibold">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border bg-card p-4 shadow-sm sm:p-5">
        <form
          className="grid gap-3 lg:grid-cols-[minmax(180px,1fr)_minmax(140px,180px)_minmax(120px,150px)_minmax(145px,175px)_3rem_3rem]"
          onSubmit={applyFilters}
        >
          <div className="relative">
            <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filterValues.search}
              onChange={(event) =>
                setFilterValues((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
              placeholder="Search ingredients"
              className="h-12 rounded-2xl pl-11"
            />
          </div>
          <select
            value={filterValues.categoryId}
            onChange={(event) =>
              setFilterValues((current) => ({
                ...current,
                categoryId: event.target.value,
              }))
            }
            className="h-12 cursor-pointer rounded-2xl border border-input bg-background px-4 text-sm"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            value={filterValues.status}
            onChange={(event) =>
              setFilterValues((current) => ({
                ...current,
                status: event.target.value,
              }))
            }
            className="h-12 cursor-pointer rounded-2xl border border-input bg-background px-4 text-sm"
          >
            <option value="">All status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <select
            value={filterValues.nutrition}
            onChange={(event) =>
              setFilterValues((current) => ({
                ...current,
                nutrition: event.target.value,
              }))
            }
            className="h-12 cursor-pointer rounded-2xl border border-input bg-background px-4 text-sm"
          >
            <option value="">All nutrition</option>
            <option value="ready">Nutrition complete</option>
            <option value="missing">Nutrition incomplete</option>
          </select>
          <div className="grid grid-cols-2 gap-3 lg:contents">
            <Button
              type="submit"
              className="h-12 w-full rounded-2xl lg:size-12"
              aria-label="Apply filters"
            >
              <SlidersHorizontal />
              <span className="lg:sr-only">Apply</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full rounded-2xl lg:size-12"
              aria-label="Clear filters"
              onClick={clearFilters}
            >
              <RotateCcw />
              <span className="lg:sr-only">Clear</span>
            </Button>
          </div>
        </form>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button
            variant="outline"
            className="rounded-2xl"
            disabled={!selectedIngredients.length}
            onClick={() => exportIngredients(selectedIngredients, "selected-ingredients.csv")}
          >
            <Download />
            Export Selected
          </Button>
          <Button
            variant="outline"
            className="rounded-2xl"
            disabled={!selectedIngredients.length}
            onClick={() =>
              setDeleteSelection({ type: "bulk", ingredients: selectedIngredients })
            }
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
                        header.column.id === "nutrition" && "hidden lg:table-cell",
                        header.column.id === "conversion" && "hidden xl:table-cell"
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
                          cell.column.id === "nutrition" && "hidden lg:table-cell",
                          cell.column.id === "conversion" && "hidden xl:table-cell"
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
                    No ingredients match these filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{totalFiltered} matching ingredients</span>
              {selectedIngredients.length > 0 && (
                <Badge variant="secondary">{selectedIngredients.length} selected</Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
                {page > 1 ? (
                  <Link href={buildPageHref(filters, 1)}>First</Link>
                ) : (
                  "First"
                )}
              </Button>
              <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
                {page > 1 ? (
                  <Link href={buildPageHref(filters, page - 1)}>Previous</Link>
                ) : (
                  "Previous"
                )}
              </Button>
              <nav className="flex items-center gap-1" aria-label="Ingredient pages">
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
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pageCount}
                asChild={page < pageCount}
              >
                {page < pageCount ? (
                  <Link href={buildPageHref(filters, page + 1)}>Next</Link>
                ) : (
                  "Next"
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pageCount}
                asChild={page < pageCount}
              >
                {page < pageCount ? (
                  <Link href={buildPageHref(filters, pageCount)}>Last</Link>
                ) : (
                  "Last"
                )}
              </Button>
              <form onSubmit={goToPage} className="ml-1 flex items-center gap-2">
                <label htmlFor="ingredient-page-jump" className="sr-only">
                  Go to page
                </label>
                <Input
                  id="ingredient-page-jump"
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

      <IngredientDrawer
        key={drawerOpen ? "open" : "closed"}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        categories={categories}
      />

      <AlertDialog
        open={Boolean(deleteSelection)}
        onOpenChange={(open) => !open && setDeleteSelection(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteItems.length === 1 ? "ingredient" : "selected ingredients"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Ingredients already used in recipes cannot be deleted. This action is permanent for unused drafts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
