"use client";

import Image from "next/image";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Gauge,
  ImageIcon,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

import type { RecipeListRecord } from "@/components/admin/recipes/recipe-types";
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

function recipeSeasonLabel(recipe: RecipeListRecord) {
  if (recipe.seasonality === "ALL_YEAR") return "All year";
  if (recipe.seasonality === "UNREVIEWED") return "Season review";
  if (recipe.seasons.length) return recipe.seasons.map((season) => season.title).join(", ");
  return "Season missing";
}

function auditTone(recipe: RecipeListRecord) {
  if (recipe.auditCriticalCount > 0 || recipe.auditGrade === "Weak") {
    return {
      label: "Fix first",
      dot: "bg-red-500",
      badge: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300",
      hint: `${recipe.auditCriticalCount} critical issue${recipe.auditCriticalCount === 1 ? "" : "s"}`,
    };
  }
  if (recipe.auditGrade === "Needs work" || recipe.auditWarningCount > 0) {
    return {
      label: "Improve",
      dot: "bg-amber-500",
      badge:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300",
      hint: `${recipe.auditWarningCount} warning${recipe.auditWarningCount === 1 ? "" : "s"}`,
    };
  }
  return {
    label: recipe.auditGrade,
    dot: "bg-emerald-500",
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300",
    hint: "Ready for periodic review",
  };
}

export function getRecipeColumns(
  onPublish: (recipe: RecipeListRecord, published: boolean) => void,
  onDelete: (recipe: RecipeListRecord) => void,
  publishingId: string | null
): ColumnDef<RecipeListRecord>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all recipes on this page"
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(checked) => table.toggleAllPageRowsSelected(Boolean(checked))}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={`Select ${row.original.title}`}
          checked={row.getIsSelected()}
          onCheckedChange={(checked) => row.toggleSelected(Boolean(checked))}
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="h-auto px-0 text-muted-foreground hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Recipe
          <ArrowUpDown className="size-3.5" />
        </Button>
      ),
      cell: ({ row }) => {
        const recipe = row.original;
        return (
          <div className="flex min-w-[270px] items-center gap-3">
            <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-muted/50">
              {recipe.imageUrl ? (
                <Image src={recipe.imageUrl} alt="" fill className="object-cover" sizes="56px" />
              ) : (
                <ImageIcon className="size-5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <Link
                href={`/admin/recipes/${recipe.id}`}
                className="line-clamp-2 font-semibold hover:text-primary"
              >
                {recipe.title}
              </Link>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {recipe.category?.name ?? "Category not assigned"}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "auditScore",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="h-auto px-0 text-muted-foreground hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Audit
          <ArrowUpDown className="size-3.5" />
        </Button>
      ),
      cell: ({ row }) => {
        const recipe = row.original;
        const tone = auditTone(recipe);

        return (
          <Link
            href={`/admin/recipes/${recipe.id}`}
            title={`${tone.label}: ${tone.hint}. Open recipe to see exact fixes.`}
            className={`inline-flex min-w-[82px] items-center gap-2 rounded-full border px-2.5 py-1.5 transition hover:opacity-85 ${tone.badge}`}
          >
            <span className={`size-2.5 rounded-full ${tone.dot}`} />
            <span className="flex items-center gap-1 text-sm font-semibold leading-none">
              <Gauge className="size-3.5" />
                {recipe.auditScore}/100
            </span>
          </Link>
        );
      },
    },
    {
      id: "tagging",
      header: "Tags",
      cell: ({ row }) => {
        const recipe = row.original;
        const missingDifficulty = !recipe.difficulty;
        const missingSeason =
          recipe.seasonality === "UNREVIEWED" ||
          (recipe.seasonality === "SEASONAL" && recipe.seasons.length === 0);

        return (
          <div className="min-w-[150px] space-y-1.5">
            <Badge variant={missingDifficulty ? "destructive" : "secondary"}>
              {recipe.difficulty?.title ?? "No difficulty"}
            </Badge>
            <div>
              <Badge variant={missingSeason ? "destructive" : "outline"}>
                {recipeSeasonLabel(recipe)}
              </Badge>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "isPublished",
      header: "Published",
      cell: ({ row }) => (
        <div className="flex min-w-[120px] items-center gap-2">
          <Switch
            aria-label={`${row.original.isPublished ? "Unpublish" : "Publish"} ${row.original.title}`}
            checked={row.original.isPublished}
            disabled={publishingId === row.original.id}
            onCheckedChange={(checked) => onPublish(row.original, checked)}
            className="cursor-pointer"
          />
          <Badge variant={row.original.isPublished ? "secondary" : "outline"}>
            {row.original.isPublished ? "Live" : "Draft"}
          </Badge>
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-xl" aria-label="Open recipe actions">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/admin/recipes/${row.original.id}`}>
                <Pencil />
                Edit recipe
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(row.original)}
            >
              <Trash2 />
              Delete recipe
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      enableSorting: false,
    },
  ];
}
