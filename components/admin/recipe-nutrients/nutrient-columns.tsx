"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import type { Column, ColumnDef } from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  EllipsisVertical,
  ImageOff,
  Pencil,
  Trash2,
} from "lucide-react";

import type { NutrientRecord } from "@/components/admin/recipe-nutrients/nutrient-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
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
  column: Column<NutrientRecord>;
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

export function getNutrientColumns(
  onEdit: (nutrient: NutrientRecord) => void,
  onPublishedChange: (nutrient: NutrientRecord, isPublished: boolean) => void,
  onDelete: (nutrient: NutrientRecord) => void,
  onMoveUp: (nutrient: NutrientRecord) => void,
  onMoveDown: (nutrient: NutrientRecord) => void,
  isFirst: (nutrient: NutrientRecord) => boolean,
  isLast: (nutrient: NutrientRecord) => boolean,
  reordering: boolean,
  publishingId: string | null
): ColumnDef<NutrientRecord>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all nutrients"
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
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
      header: ({ column }) => <SortHeader column={column}>Nutrient</SortHeader>,
      cell: ({ row }) => {
        const nutrient = row.original;

        return (
          <button
            type="button"
            onClick={() => onEdit(nutrient)}
            className="flex min-w-56 cursor-pointer items-center gap-3 text-left"
          >
            {nutrient.imageUrl ? (
              <Image
                src={nutrient.imageUrl}
                alt={nutrient.title}
                width={48}
                height={48}
                className="size-12 rounded-2xl border bg-muted object-cover"
              />
            ) : (
              <span className="flex size-12 items-center justify-center rounded-2xl border bg-muted/40">
                <ImageOff className="size-5 text-muted-foreground" />
              </span>
            )}
            <span className="min-w-0">
              <span className="block truncate font-semibold">{nutrient.title}</span>
              <span className="block truncate text-xs text-muted-foreground">
                /{nutrient.slug}
              </span>
            </span>
          </button>
        );
      },
    },
    {
      accessorKey: "position",
      header: "Position",
      cell: ({ row }) => (
        <Badge variant="outline">#{row.original.position ?? "-"}</Badge>
      ),
    },
    {
      accessorKey: "slug",
      header: ({ column }) => <SortHeader column={column}>Slug</SortHeader>,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.slug}</span>
      ),
    },
    {
      id: "recipes",
      accessorFn: (nutrient) => nutrient._count.recipeNutrient,
      header: ({ column }) => <SortHeader column={column}>Recipes</SortHeader>,
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original._count.recipeNutrient} linked</Badge>
      ),
    },
    {
      accessorKey: "isPublished",
      header: "Published",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={row.original.isPublished}
            disabled={publishingId === row.original.id}
            onCheckedChange={(checked) => onPublishedChange(row.original, checked)}
            aria-label={`${row.original.isPublished ? "Unpublish" : "Publish"} ${row.original.title}`}
            className="cursor-pointer"
          />
          <span className="text-xs text-muted-foreground">
            {row.original.isPublished ? "Live" : "Draft"}
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      enableSorting: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Open nutrient actions">
              <EllipsisVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              <Pencil />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={reordering || isFirst(row.original)}
              onClick={() => onMoveUp(row.original)}
            >
              <ArrowUp />
              Move up
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={reordering || isLast(row.original)}
              onClick={() => onMoveDown(row.original)}
            >
              <ArrowDown />
              Move down
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(row.original)}
            >
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
