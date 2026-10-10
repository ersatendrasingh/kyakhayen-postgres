"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type RowSelectionState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChefHat,
  CircleCheckBig,
  CircleOff,
  Download,
  Link2,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { getCookingMethodColumns } from "@/components/admin/recipe-cooking-methods/cooking-method-columns";
import { CookingMethodDrawer } from "@/components/admin/recipe-cooking-methods/cooking-method-drawer";
import { CookingMethodImportDialog } from "@/components/admin/recipe-cooking-methods/cooking-method-import-dialog";
import type { CookingMethodRecord } from "@/components/admin/recipe-cooking-methods/cooking-method-types";
import { exportCookingMethods } from "@/components/admin/recipe-cooking-methods/cooking-method-utils";
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
  | { type: "single"; method: CookingMethodRecord }
  | { type: "bulk"; methods: CookingMethodRecord[] }
  | null;

export function CookingMethodsDashboard({
  cookingMethods,
}: {
  cookingMethods: CookingMethodRecord[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [selectedMethod, setSelectedMethod] = useState<CookingMethodRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteSelection, setDeleteSelection] = useState<DeleteSelection>(null);
  const [deleting, setDeleting] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const orderedMethods = useMemo(
    () =>
      [...cookingMethods].sort((first, second) => {
        const firstPosition = first.position ?? Number.MAX_SAFE_INTEGER;
        const secondPosition = second.position ?? Number.MAX_SAFE_INTEGER;

        if (firstPosition !== secondPosition) {
          return firstPosition - secondPosition;
        }

        return first.title.localeCompare(second.title);
      }),
    [cookingMethods]
  );

  const filteredMethods = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return orderedMethods;

    return orderedMethods.filter(
      (method) =>
        method.title.toLowerCase().includes(query) ||
        method.slug.toLowerCase().includes(query)
    );
  }, [orderedMethods, search]);

  const moveMethod = async (method: CookingMethodRecord, direction: "up" | "down") => {
    const sourceIndex = orderedMethods.findIndex((item) => item.id === method.id);
    const destinationIndex = direction === "up" ? sourceIndex - 1 : sourceIndex + 1;

    if (
      sourceIndex < 0 ||
      destinationIndex < 0 ||
      destinationIndex >= orderedMethods.length
    ) {
      return;
    }

    const reorderedMethods = [...orderedMethods];
    const [movedMethod] = reorderedMethods.splice(sourceIndex, 1);
    reorderedMethods.splice(destinationIndex, 0, movedMethod);

    try {
      setReordering(true);
      const response = await fetch("/api/recipes/cooking-method/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          list: reorderedMethods.map((item, index) => ({
            id: item.id,
            position: index + 1,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to update cooking method order.");
      }

      setSorting([]);
      toast.success("Cooking method position updated");
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reorder cooking methods.");
    } finally {
      setReordering(false);
    }
  };

  const updatePublishedState = async (
    method: CookingMethodRecord,
    isPublished: boolean
  ) => {
    try {
      setPublishingId(method.id);
      const response = await fetch(`/api/recipes/cooking-method/${method.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished }),
      });

      if (!response.ok) {
        throw new Error("Unable to update cooking method visibility.");
      }

      toast.success(`${method.title} ${isPublished ? "published" : "unpublished"}`);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update cooking method.");
    } finally {
      setPublishingId(null);
    }
  };

  const columns = getCookingMethodColumns(
    (method) => {
      setSelectedMethod(method);
      setDrawerOpen(true);
    },
    (method, isPublished) => void updatePublishedState(method, isPublished),
    (method) => setDeleteSelection({ type: "single", method }),
    (method) => void moveMethod(method, "up"),
    (method) => void moveMethod(method, "down"),
    (method) => orderedMethods[0]?.id === method.id,
    (method) => orderedMethods[orderedMethods.length - 1]?.id === method.id,
    reordering,
    publishingId
  );

  // TanStack Table owns mutable callbacks and cannot be safely compiler-memoized.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredMethods,
    columns,
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } },
    state: { sorting, rowSelection },
  });

  const selectedMethods = orderedMethods.filter((method) => rowSelection[method.id]);
  const linkedRecipes = orderedMethods.reduce(
    (total, method) => total + method._count.recipeCookingMethod,
    0
  );
  const activeMethods = orderedMethods.filter(
    (method) => method._count.recipeCookingMethod > 0
  ).length;
  const unusedMethods = orderedMethods.length - activeMethods;
  const deleteItems =
    deleteSelection?.type === "single"
      ? [deleteSelection.method]
      : deleteSelection?.methods ?? [];

  const openCreateDrawer = () => {
    setSelectedMethod(null);
    setDrawerOpen(true);
  };

  const refresh = () => {
    setRowSelection({});
    router.refresh();
  };

  const confirmDelete = async () => {
    if (!deleteItems.length) return;

    try {
      setDeleting(true);

      for (const method of deleteItems) {
        const response = await fetch(`/api/recipes/cooking-method/${method.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error(
            `Unable to delete "${method.title}". It may still be used by recipes.`
          );
        }
      }

      toast.success(
        deleteItems.length === 1
          ? "Cooking method deleted successfully"
          : `${deleteItems.length} cooking methods deleted successfully`
      );
      setDeleteSelection(null);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete cooking method.");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="admin-taxonomy-hero rounded-[32px] p-5 sm:p-7 lg:p-9">
        <div className="relative z-[1] flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl space-y-3">
            <span className="admin-taxonomy-hero-badge inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]">
              Recipe Taxonomy
            </span>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Cooking methods dashboard
              </h1>
              <p className="admin-taxonomy-hero-copy mt-2 text-sm sm:text-base">
                Manage the techniques visitors use to discover and compare recipes.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 sm:flex-nowrap xl:shrink-0">
            <Button
              variant="outline"
              className="admin-taxonomy-hero-action rounded-2xl"
              onClick={() => setImportOpen(true)}
            >
              <Upload />
              Import
            </Button>
            <Button
              variant="outline"
              className="admin-taxonomy-hero-action rounded-2xl"
              onClick={() => exportCookingMethods(filteredMethods, "cooking-methods.csv")}
            >
              <Download />
              Export
            </Button>
            <Button className="rounded-2xl shadow-sm" onClick={openCreateDrawer}>
              <Sparkles />
              Add Method
            </Button>
          </div>
        </div>

        <div className="relative z-[1] mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total Methods", value: orderedMethods.length, icon: ChefHat },
            { label: "Linked Recipes", value: linkedRecipes, icon: Link2 },
            { label: "Active Methods", value: activeMethods, icon: CircleCheckBig },
            { label: "Unused Methods", value: unusedMethods, icon: CircleOff },
          ].map((stat) => (
            <div
              key={stat.label}
              className="admin-taxonomy-stat rounded-3xl px-5 py-5 backdrop-blur"
            >
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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-lg">
            <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title or slug"
              className="h-12 rounded-2xl pl-11"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="rounded-2xl"
              disabled={!selectedMethods.length}
              onClick={() =>
                exportCookingMethods(selectedMethods, "selected-cooking-methods.csv")
              }
            >
              <Download />
              Export Selected
            </Button>
            <Button
              variant="outline"
              className="rounded-2xl"
              disabled={!selectedMethods.length}
              onClick={() =>
                setDeleteSelection({ type: "bulk", methods: selectedMethods })
              }
            >
              <Trash2 />
              Delete Selected
            </Button>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-3xl border border-border/70">
          <Table>
            <TableHeader className="bg-muted/35">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "h-14 px-4",
                        header.column.id === "position" && "hidden sm:table-cell",
                        header.column.id === "slug" && "hidden lg:table-cell"
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
                          cell.column.id === "position" && "hidden sm:table-cell",
                          cell.column.id === "slug" && "hidden lg:table-cell"
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
                    No cooking methods found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedMethods.length
                ? `${selectedMethods.length} selected`
                : `${filteredMethods.length} cooking methods`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <span className="px-2 text-sm text-muted-foreground">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </section>

      <CookingMethodDrawer
        key={`${selectedMethod?.id ?? "new"}-${drawerOpen ? "open" : "closed"}`}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        method={selectedMethod}
        onSaved={refresh}
      />
      <CookingMethodImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={refresh}
      />

      <AlertDialog
        open={Boolean(deleteSelection)}
        onOpenChange={(open) => !open && setDeleteSelection(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteItems.length === 1 ? "cooking method" : "selected cooking methods"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Methods linked to existing recipes may not be removable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
