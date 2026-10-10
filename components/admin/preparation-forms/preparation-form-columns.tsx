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

import type { PreparationFormRecord } from "@/components/admin/preparation-forms/preparation-form-types";
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
  column: Column<PreparationFormRecord>;
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

export function getPreparationFormColumns(
  onEdit: (form: PreparationFormRecord) => void,
  onDelete: (form: PreparationFormRecord) => void,
  onMoveUp: (form: PreparationFormRecord) => void,
  onMoveDown: (form: PreparationFormRecord) => void,
  isFirst: (form: PreparationFormRecord) => boolean,
  isLast: (form: PreparationFormRecord) => boolean,
  reordering: boolean
): ColumnDef<PreparationFormRecord>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all preparation forms"
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          className="cursor-pointer"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={`Select ${row.original.name}`}
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          className="cursor-pointer"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => <SortHeader column={column}>Preparation Form</SortHeader>,
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => onEdit(row.original)}
          className="flex min-w-44 cursor-pointer flex-col text-left"
        >
          <span className="font-semibold">{row.original.name}</span>
          <span className="text-xs text-muted-foreground">Ingredient preparation label</span>
        </button>
      ),
    },
    {
      accessorKey: "position",
      header: "Position",
      cell: ({ row }) => <Badge variant="outline">#{row.original.position ?? "-"}</Badge>,
    },
    {
      id: "recipeUses",
      accessorFn: (form) => form._count.RecipeIngredients,
      header: ({ column }) => <SortHeader column={column}>Recipe Uses</SortHeader>,
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original._count.RecipeIngredients} uses</Badge>
      ),
    },
    {
      id: "status",
      header: "Usage",
      cell: ({ row }) => (
        <Badge variant={row.original._count.RecipeIngredients ? "secondary" : "outline"}>
          {row.original._count.RecipeIngredients ? "In use" : "Unused"}
        </Badge>
      ),
    },
    {
      id: "actions",
      enableSorting: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Open form actions">
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
