"use client";

import Image from "next/image";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, ImageIcon, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import type { ArticleListRecord } from "@/components/admin/articles/article-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

export function getArticleColumns(
  onPublish: (article: ArticleListRecord, published: boolean) => void,
  onDelete: (article: ArticleListRecord) => void,
  publishingId: string | null
): ColumnDef<ArticleListRecord>[] {
  return [
    {
      id: "select",
      header: ({ table }) => <Checkbox aria-label="Select all articles on this page" checked={table.getIsAllPageRowsSelected()} onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))} />,
      cell: ({ row }) => <Checkbox aria-label={`Select ${row.original.title}`} checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(Boolean(value))} />,
      enableSorting: false,
    },
    {
      accessorKey: "title",
      header: ({ column }) => <Button variant="ghost" className="h-auto px-0 text-muted-foreground hover:bg-transparent" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Article <ArrowUpDown className="size-3.5" /></Button>,
      cell: ({ row }) => (
        <div className="flex min-w-[290px] items-center gap-3">
          <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-muted/40">
            {row.original.imageUrl ? <Image src={row.original.imageUrl} alt="" fill className="object-cover" sizes="56px" /> : <ImageIcon className="size-5 text-muted-foreground" />}
          </div>
          <div className="min-w-0">
            <Link href={`/admin/articles/${row.original.id}`} className="line-clamp-2 font-semibold hover:text-primary">{row.original.title}</Link>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {row.original.categories.map((category) => category.label).join(", ") || "Uncategorized"}
              {row.original.tags.length > 0 ? ` | ${row.original.tags.map((tag) => `#${tag.label}`).join(", ")}` : ""}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "readiness",
      header: "Content",
      cell: ({ row }) => {
        const article = row.original;
        const completed = [article.content, article.imageUrl, article.metaTitle, article.categories.length, article.tags.length].filter(Boolean).length;
        return <div className="min-w-[120px]"><p className="text-sm font-medium">{completed}/5 complete</p><p className="text-xs text-muted-foreground">{article.content ? "Body written" : "Body missing"}</p></div>;
      },
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }) => <Button variant="ghost" className="h-auto px-0 text-muted-foreground hover:bg-transparent" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Updated <ArrowUpDown className="size-3.5" /></Button>,
      cell: ({ row }) => <span className="whitespace-nowrap text-sm text-muted-foreground">{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(row.original.updatedAt))}</span>,
    },
    {
      accessorKey: "isPublished",
      header: "Published",
      cell: ({ row }) => (
        <div className="flex min-w-[120px] items-center gap-2">
          <Switch checked={row.original.isPublished} disabled={publishingId === row.original.id} onCheckedChange={(checked) => onPublish(row.original, checked)} aria-label={`${row.original.isPublished ? "Unpublish" : "Publish"} ${row.original.title}`} className="cursor-pointer" />
          <Badge variant={row.original.isPublished ? "secondary" : "outline"}>{row.original.isPublished ? "Live" : "Draft"}</Badge>
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-xl" aria-label="Open article actions"><MoreHorizontal /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild><Link href={`/admin/articles/${row.original.id}`}><Pencil /> Edit article</Link></DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => onDelete(row.original)}><Trash2 /> Delete article</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      enableSorting: false,
    },
  ];
}
