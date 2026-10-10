"use client";

import type { ReactNode } from "react";
import type { Column, ColumnDef } from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  EllipsisVertical,
  Pencil,
  Trash2,
} from "lucide-react";

import type { MeasurementUnitRecord } from "@/components/admin/measurement-units/measurement-unit-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function SortHeader({
  column,
  children,
}: {
  column: Column<MeasurementUnitRecord>;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="-ml-3 h-8 px-3 text-muted-foreground hover:text-foreground"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {children}
      <ArrowUpDown className="size-3.5" />
    </Button>
  );
}

export function getMeasurementUnitColumns(
  onEdit: (unit: MeasurementUnitRecord) => void,
  onDelete: (unit: MeasurementUnitRecord) => void,
  onMoveUp: (unit: MeasurementUnitRecord) => void,
  onMoveDown: (unit: MeasurementUnitRecord) => void,
  isFirst: (unit: MeasurementUnitRecord) => boolean,
  isLast: (unit: MeasurementUnitRecord) => boolean,
  reordering: boolean
): ColumnDef<MeasurementUnitRecord>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all measurement units"
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          className="cursor-pointer"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={`Select ${row.original.title}`}
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          className="cursor-pointer"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "title",
      header: ({ column }) => <SortHeader column={column}>Measurement Unit</SortHeader>,
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => onEdit(row.original)}
          className="flex min-w-44 cursor-pointer flex-col text-left"
        >
          <span className="font-semibold">{row.original.title}</span>
          <span className="text-xs text-muted-foreground">
            Used for quantity-to-gram conversion
          </span>
        </button>
      ),
    },
    {
      accessorKey: "shortName",
      header: ({ column }) => <SortHeader column={column}>Symbol</SortHeader>,
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono">
          {row.original.shortName}
        </Badge>
      ),
    },
    {
      accessorKey: "position",
      header: "Position",
      cell: ({ row }) => <Badge variant="outline">#{row.original.position ?? "-"}</Badge>,
    },
    {
      id: "recipeUses",
      accessorFn: (unit) => unit._count.RecipeIngredients,
      header: ({ column }) => <SortHeader column={column}>Recipe Uses</SortHeader>,
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original._count.RecipeIngredients} uses</Badge>
      ),
    },
    {
      id: "mappings",
      accessorFn: (unit) => unit._count.IngredientUnitMeasurements,
      header: ({ column }) => <SortHeader column={column}>Mappings</SortHeader>,
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original._count.IngredientUnitMeasurements} mapped</Badge>
      ),
    },
    {
      id: "actions",
      enableSorting: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Open unit actions">
              <EllipsisVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              <Pencil />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem disabled={reordering || isFirst(row.original)} onClick={() => onMoveUp(row.original)}>
              <ArrowUp />
              Move up
            </DropdownMenuItem>
            <DropdownMenuItem disabled={reordering || isLast(row.original)} onClick={() => onMoveDown(row.original)}>
              <ArrowDown />
              Move down
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => onDelete(row.original)}>
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
