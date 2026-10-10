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

import type { AllergyRecord } from "@/components/admin/recipe-allergies/allergy-types";
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
  column: Column<AllergyRecord>;
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

export function getAllergyColumns(
  onEdit: (allergy: AllergyRecord) => void,
  onPublishedChange: (allergy: AllergyRecord, isPublished: boolean) => void,
  onDelete: (allergy: AllergyRecord) => void,
  onMoveUp: (allergy: AllergyRecord) => void,
  onMoveDown: (allergy: AllergyRecord) => void,
  isFirst: (allergy: AllergyRecord) => boolean,
  isLast: (allergy: AllergyRecord) => boolean,
  reordering: boolean,
  publishingId: string | null
): ColumnDef<AllergyRecord>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all allergies"
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
      header: ({ column }) => <SortHeader column={column}>Allergy</SortHeader>,
      cell: ({ row }) => {
        const allergy = row.original;

        return (
          <button
            type="button"
            onClick={() => onEdit(allergy)}
            className="flex min-w-56 cursor-pointer items-center gap-3 text-left"
          >
            {allergy.imageUrl ? (
              <Image
                src={allergy.imageUrl}
                alt={allergy.title}
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
              <span className="block truncate font-semibold">{allergy.title}</span>
              <span className="block truncate text-xs text-muted-foreground">
                /{allergy.slug}
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
      accessorFn: (allergy) => allergy._count.recipeAllergies,
      header: ({ column }) => <SortHeader column={column}>Recipes</SortHeader>,
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original._count.recipeAllergies} linked</Badge>
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
            <Button variant="ghost" size="icon-sm" aria-label="Open allergy actions">
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
