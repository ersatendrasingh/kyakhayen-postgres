"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Column, ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  EllipsisVertical,
  ImageIcon,
  Pencil,
  Trash2,
  TriangleAlert,
} from "lucide-react";

import type { IngredientRecord } from "@/components/admin/ingredients/ingredient-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

function SortHeader({
  column,
  children,
}: {
  column: Column<IngredientRecord>;
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

export function getIngredientColumns(
  onPublishedChange: (ingredient: IngredientRecord, isPublished: boolean) => void,
  onDelete: (ingredient: IngredientRecord) => void,
  publishingId: string | null
): ColumnDef<IngredientRecord>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all ingredients"
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
      header: ({ column }) => <SortHeader column={column}>Ingredient</SortHeader>,
      cell: ({ row }) => (
        <Link
          href={`/admin/ingredients/${row.original.id}`}
          className="flex min-w-52 cursor-pointer items-center gap-3"
        >
          {row.original.imageUrl ? (
            <Image
              src={row.original.imageUrl}
              alt=""
              width={44}
              height={44}
              className="size-11 shrink-0 rounded-xl border object-cover"
            />
          ) : (
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-muted/45 text-muted-foreground">
              <ImageIcon className="size-5" />
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate font-semibold">{row.original.name}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {row.original.category?.name ?? "Uncategorized"}
            </span>
          </span>
        </Link>
      ),
    },
    {
      id: "nutrition",
      accessorFn: (ingredient) => Number(ingredient.nutritionComplete),
      header: "Nutrition",
      cell: ({ row }) => (
        <Badge variant={row.original.nutritionComplete ? "secondary" : "outline"}>
          {row.original.nutritionComplete ? "Complete" : "Incomplete"}
        </Badge>
      ),
    },
    {
      id: "conversion",
      accessorFn: (ingredient) => ingredient.missingConversionCount,
      header: "Conversion",
      cell: ({ row }) =>
        row.original.missingConversionCount ? (
          <Badge variant="destructive" className="gap-1">
            <TriangleAlert />
            {row.original.missingConversionCount} missing
          </Badge>
        ) : (
          <Badge variant="outline">{row.original.unitMappingCount} mapped</Badge>
        ),
    },
    {
      id: "recipes",
      accessorFn: (ingredient) => ingredient.recipeUsageCount,
      header: ({ column }) => <SortHeader column={column}>Recipes</SortHeader>,
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.recipeUsageCount} uses</Badge>
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
            aria-label={`${row.original.isPublished ? "Unpublish" : "Publish"} ${row.original.name}`}
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
            <Button variant="ghost" size="icon-sm" aria-label="Open ingredient actions">
              <EllipsisVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/admin/ingredients/${row.original.id}`}>
                <Pencil />
                Edit nutrition
              </Link>
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
