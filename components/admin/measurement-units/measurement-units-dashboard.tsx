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
  AlertTriangle,
  ArrowLeftRight,
  Download,
  Search,
  Sparkles,
  Trash2,
  Upload,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";

import { getMeasurementUnitColumns } from "@/components/admin/measurement-units/measurement-unit-columns";
import { MeasurementUnitDrawer } from "@/components/admin/measurement-units/measurement-unit-drawer";
import { MeasurementUnitImportDialog } from "@/components/admin/measurement-units/measurement-unit-import-dialog";
import type { MeasurementUnitRecord } from "@/components/admin/measurement-units/measurement-unit-types";
import { exportMeasurementUnits } from "@/components/admin/measurement-units/measurement-unit-utils";
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
  | { type: "single"; unit: MeasurementUnitRecord }
  | { type: "bulk"; units: MeasurementUnitRecord[] }
  | null;

export function MeasurementUnitsDashboard({
  units,
  recipeUses,
  conversionMappings,
  missingConversionRows,
}: {
  units: MeasurementUnitRecord[];
  recipeUses: number;
  conversionMappings: number;
  missingConversionRows: number;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [selectedUnit, setSelectedUnit] = useState<MeasurementUnitRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteSelection, setDeleteSelection] = useState<DeleteSelection>(null);
  const [deleting, setDeleting] = useState(false);
  const [reordering, setReordering] = useState(false);

  const orderedUnits = useMemo(
    () =>
      [...units].sort((first, second) => {
        const firstPosition = first.position ?? Number.MAX_SAFE_INTEGER;
        const secondPosition = second.position ?? Number.MAX_SAFE_INTEGER;
        return firstPosition !== secondPosition
          ? firstPosition - secondPosition
          : first.title.localeCompare(second.title);
      }),
    [units]
  );

  const filteredUnits = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return orderedUnits;
    return orderedUnits.filter(
      (unit) =>
        unit.title.toLowerCase().includes(query) ||
        unit.shortName.toLowerCase().includes(query)
    );
  }, [orderedUnits, search]);

  const refresh = () => {
    setRowSelection({});
    router.refresh();
  };

  const moveUnit = async (unit: MeasurementUnitRecord, direction: "up" | "down") => {
    const sourceIndex = orderedUnits.findIndex((item) => item.id === unit.id);
    const destinationIndex = direction === "up" ? sourceIndex - 1 : sourceIndex + 1;
    if (sourceIndex < 0 || destinationIndex < 0 || destinationIndex >= orderedUnits.length) return;

    const reordered = [...orderedUnits];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(destinationIndex, 0, moved);

    try {
      setReordering(true);
      const response = await fetch("/api/ingredients/units/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          list: reordered.map((item, index) => ({ id: item.id, position: index + 1 })),
        }),
      });
      if (!response.ok) throw new Error("Unable to update measurement unit order.");
      setSorting([]);
      toast.success("Measurement unit position updated");
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reorder measurement units.");
    } finally {
      setReordering(false);
    }
  };

  const columns = getMeasurementUnitColumns(
    (unit) => {
      setSelectedUnit(unit);
      setDrawerOpen(true);
    },
    (unit) => setDeleteSelection({ type: "single", unit }),
    (unit) => void moveUnit(unit, "up"),
    (unit) => void moveUnit(unit, "down"),
    (unit) => orderedUnits[0]?.id === unit.id,
    (unit) => orderedUnits[orderedUnits.length - 1]?.id === unit.id,
    reordering
  );

  // TanStack Table owns mutable callbacks and cannot be safely compiler-memoized.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredUnits,
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

  const selectedUnits = orderedUnits.filter((unit) => rowSelection[unit.id]);
  const deleteItems =
    deleteSelection?.type === "single"
      ? [deleteSelection.unit]
      : deleteSelection?.units ?? [];

  const confirmDelete = async () => {
    if (!deleteItems.length) return;
    try {
      setDeleting(true);
      for (const unit of deleteItems) {
        const response = await fetch(`/api/ingredients/units/${unit.id}`, { method: "DELETE" });
        if (!response.ok) {
          throw new Error(`Unable to delete "${unit.title}". Units in recipes or conversions must be retained.`);
        }
      }
      toast.success(
        deleteItems.length === 1
          ? "Measurement unit deleted successfully"
          : `${deleteItems.length} measurement units deleted successfully`
      );
      setDeleteSelection(null);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete measurement unit.");
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
              Nutrition Foundation
            </span>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Measurement units
              </h1>
              <p className="admin-taxonomy-hero-copy mt-2 text-sm sm:text-base">
                Control recipe quantity units and the gram conversions that keep nutrition totals dependable.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 sm:flex-nowrap xl:shrink-0">
            <Button variant="outline" className="admin-taxonomy-hero-action rounded-2xl" onClick={() => setImportOpen(true)}>
              <Upload />
              Import
            </Button>
            <Button variant="outline" className="admin-taxonomy-hero-action rounded-2xl" onClick={() => exportMeasurementUnits(filteredUnits, "measurement-units.csv")}>
              <Download />
              Export
            </Button>
            <Button className="rounded-2xl shadow-sm" onClick={() => { setSelectedUnit(null); setDrawerOpen(true); }}>
              <Sparkles />
              Add Unit
            </Button>
          </div>
        </div>
        <div className="relative z-[1] mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total Units", value: orderedUnits.length, icon: ArrowLeftRight },
            { label: "Recipe Uses", value: recipeUses, icon: UtensilsCrossed },
            { label: "Conversion Mappings", value: conversionMappings, icon: ArrowLeftRight },
            { label: "Missing Mappings", value: missingConversionRows, icon: AlertTriangle },
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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-lg">
            <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by unit name or symbol" className="h-12 rounded-2xl pl-11" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="rounded-2xl" disabled={!selectedUnits.length} onClick={() => exportMeasurementUnits(selectedUnits, "selected-measurement-units.csv")}>
              <Download />
              Export Selected
            </Button>
            <Button variant="outline" className="rounded-2xl" disabled={!selectedUnits.length} onClick={() => setDeleteSelection({ type: "bulk", units: selectedUnits })}>
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
                    <TableHead key={header.id} className={cn("h-14 px-4", header.column.id === "position" && "hidden sm:table-cell", header.column.id === "recipeUses" && "hidden md:table-cell", header.column.id === "mappings" && "hidden lg:table-cell")}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={cn("px-4 py-3", cell.column.id === "position" && "hidden sm:table-cell", cell.column.id === "recipeUses" && "hidden md:table-cell", cell.column.id === "mappings" && "hidden lg:table-cell")}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">No measurement units found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedUnits.length ? `${selectedUnits.length} selected` : `${filteredUnits.length} units`}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
              <span className="px-2 text-sm text-muted-foreground">Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}</span>
              <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
            </div>
          </div>
        </div>
      </section>
      <MeasurementUnitDrawer
        key={`${selectedUnit?.id ?? "new"}-${drawerOpen ? "open" : "closed"}`}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        unit={selectedUnit}
        onSaved={refresh}
      />
      <MeasurementUnitImportDialog open={importOpen} onOpenChange={setImportOpen} onImported={refresh} />
      <AlertDialog open={Boolean(deleteSelection)} onOpenChange={(open) => !open && setDeleteSelection(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteItems.length === 1 ? "unit" : "selected units"}?</AlertDialogTitle>
            <AlertDialogDescription>
              Units used in recipe quantities or ingredient conversions cannot be deleted. This action removes unused units permanently.
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
