"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { flexRender, getCoreRowModel, getSortedRowModel, type RowSelectionState, type SortingState, useReactTable } from "@tanstack/react-table";
import { BookText, CheckCircle2, Download, FilePenLine, Plus, RotateCcw, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { getArticleColumns } from "@/components/admin/articles/article-columns";
import { ArticleCreateDrawer } from "@/components/admin/articles/article-create-drawer";
import type { ArticleCategoryOption, ArticleFilters, ArticleListRecord, ArticleTagOption } from "@/components/admin/articles/article-types";
import { exportArticles } from "@/components/admin/articles/article-utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type DeleteSelection =
  | { type: "single"; article: ArticleListRecord }
  | { type: "bulk"; articles: ArticleListRecord[] }
  | null;

function hrefFor(filters: ArticleFilters, page: number) {
  const params = new URLSearchParams();
  if (filters.search) params.set("q", filters.search);
  if (filters.categoryId) params.set("category", filters.categoryId);
  if (filters.tagId) params.set("tag", filters.tagId);
  if (filters.status) params.set("status", filters.status);
  if (page > 1) params.set("page", String(page));
  return params.size ? `/admin/articles?${params.toString()}` : "/admin/articles";
}

export function ArticlesDashboard({
  articles,
  categories,
  tags,
  stats,
  filters,
  page,
  pageCount,
  totalFiltered,
}: {
  articles: ArticleListRecord[];
  categories: ArticleCategoryOption[];
  tags: ArticleTagOption[];
  stats: { total: number; published: number; drafts: number; contentReady: number };
  filters: ArticleFilters;
  page: number;
  pageCount: number;
  totalFiltered: number;
}) {
  const router = useRouter();
  const [filterValues, setFilterValues] = useState(filters);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteSelection, setDeleteSelection] = useState<DeleteSelection>(null);
  const [deleting, setDeleting] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const refresh = () => {
    setRowSelection({});
    router.refresh();
  };
  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.replace(hrefFor(filterValues, 1), { scroll: false });
  };
  const clearFilters = () => {
    const cleared = { search: "", categoryId: "", tagId: "", status: "" };
    setFilterValues(cleared);
    router.replace("/admin/articles", { scroll: false });
  };
  const updatePublished = async (article: ArticleListRecord, checked: boolean) => {
    try {
      setPublishingId(article.id);
      const response = await fetch(`/api/articles/${article.id}/${checked ? "publish" : "unpublish"}`, { method: "PATCH" });
      if (!response.ok) throw new Error(checked ? "Add body content and a cover image before publishing." : "Unable to unpublish article.");
      toast.success(`${article.title} ${checked ? "published" : "moved to drafts"}`);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update article.");
    } finally {
      setPublishingId(null);
    }
  };
  const columns = getArticleColumns(
    (article, checked) => void updatePublished(article, checked),
    (article) => setDeleteSelection({ type: "single", article }),
    publishingId
  );
  // TanStack Table owns mutable callbacks and cannot be safely compiler-memoized.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: articles,
    columns,
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting, rowSelection },
  });
  const selected = articles.filter((article) => rowSelection[article.id]);
  const deleteItems = deleteSelection?.type === "single" ? [deleteSelection.article] : deleteSelection?.articles ?? [];
  const confirmDelete = async () => {
    try {
      setDeleting(true);
      for (const article of deleteItems) {
        const response = await fetch(`/api/articles/${article.id}`, { method: "DELETE" });
        if (!response.ok) throw new Error(`Unable to delete "${article.title}".`);
      }
      toast.success(deleteItems.length === 1 ? "Article deleted" : "Articles deleted");
      setDeleteSelection(null);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete articles.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <section className="admin-taxonomy-hero rounded-[32px] p-5 sm:p-7 lg:p-9">
        <div className="relative z-[1] flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-3">
            <span className="admin-taxonomy-hero-badge inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]">Editorial Studio</span>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Articles workspace</h1>
              <p className="admin-taxonomy-hero-copy mt-2 text-sm sm:text-base">
                Create food stories with rich media, organized categories and publish-ready search previews.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="admin-taxonomy-hero-action rounded-2xl" onClick={() => exportArticles(articles, "articles-page.csv")}><Download /> Export Page</Button>
            <Button className="rounded-2xl shadow-sm" onClick={() => setCreateOpen(true)}><Plus /> Add Article</Button>
          </div>
        </div>
        <div className="relative z-[1] mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total Articles", value: stats.total, icon: BookText },
            { label: "Published", value: stats.published, icon: CheckCircle2 },
            { label: "Drafts", value: stats.drafts, icon: FilePenLine },
            { label: "Ready to Publish", value: stats.contentReady, icon: CheckCircle2 },
          ].map((stat) => (
            <div key={stat.label} className="admin-taxonomy-stat rounded-3xl px-5 py-5 backdrop-blur">
              <div className="flex items-center justify-between gap-4"><p className="admin-taxonomy-stat-label text-sm font-medium">{stat.label}</p><stat.icon className="admin-taxonomy-stat-icon size-5" /></div>
              <p className="admin-taxonomy-stat-value mt-3 text-3xl font-semibold">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="overflow-hidden rounded-[28px] border bg-card p-4 shadow-sm sm:p-5">
        <form onSubmit={applyFilters} className="grid gap-3 xl:grid-cols-[minmax(240px,1fr)_minmax(155px,200px)_minmax(155px,200px)_minmax(145px,175px)_3rem_3rem]">
          <div className="relative">
            <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-12 rounded-2xl pl-11" placeholder="Search article title or slug" value={filterValues.search} onChange={(event) => setFilterValues((current) => ({ ...current, search: event.target.value }))} />
          </div>
          <select value={filterValues.categoryId} onChange={(event) => setFilterValues((current) => ({ ...current, categoryId: event.target.value }))} className="h-12 cursor-pointer rounded-2xl border border-input bg-background px-4 text-sm">
            <option value="">All categories</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
          </select>
          <select value={filterValues.tagId} onChange={(event) => setFilterValues((current) => ({ ...current, tagId: event.target.value }))} className="h-12 cursor-pointer rounded-2xl border border-input bg-background px-4 text-sm">
            <option value="">All tags</option>
            {tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.label}</option>)}
          </select>
          <select value={filterValues.status} onChange={(event) => setFilterValues((current) => ({ ...current, status: event.target.value }))} className="h-12 cursor-pointer rounded-2xl border border-input bg-background px-4 text-sm">
            <option value="">All status</option><option value="published">Published</option><option value="draft">Draft</option><option value="incomplete">Needs content</option>
          </select>
          <div className="grid grid-cols-2 gap-3 xl:contents">
            <Button type="submit" className="h-12 rounded-2xl xl:size-12" aria-label="Apply filters"><SlidersHorizontal /></Button>
            <Button type="button" variant="outline" className="h-12 rounded-2xl xl:size-12" aria-label="Clear filters" onClick={clearFilters}><RotateCcw /></Button>
          </div>
        </form>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button variant="outline" className="rounded-2xl" disabled={!selected.length} onClick={() => exportArticles(selected, "selected-articles.csv")}><Download /> Export Selected</Button>
          <Button variant="outline" className="rounded-2xl" disabled={!selected.length} onClick={() => setDeleteSelection({ type: "bulk", articles: selected })}><Trash2 /> Delete Selected</Button>
        </div>
        <div className="mt-5 overflow-x-auto rounded-3xl border border-border/70">
          <Table>
            <TableHeader className="bg-muted/35">{table.getHeaderGroups().map((group) => <TableRow key={group.id} className="hover:bg-transparent">{group.headers.map((header) => <TableHead key={header.id} className={cn("h-14 px-4", header.column.id === "readiness" && "hidden lg:table-cell", header.column.id === "updatedAt" && "hidden xl:table-cell")}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>)}</TableRow>)}</TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>{row.getVisibleCells().map((cell) => <TableCell key={cell.id} className={cn("px-4 py-3", cell.column.id === "readiness" && "hidden lg:table-cell", cell.column.id === "updatedAt" && "hidden xl:table-cell")}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">No articles match these filters.</TableCell></TableRow>}
            </TableBody>
          </Table>
          <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-sm text-muted-foreground"><span>{totalFiltered} matching articles</span>{selected.length > 0 && <Badge variant="secondary">{selected.length} selected</Badge>}</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>{page > 1 ? <Link href={hrefFor(filters, page - 1)}>Previous</Link> : "Previous"}</Button>
              <span className="px-2 text-sm text-muted-foreground">Page {page} of {pageCount}</span>
              <Button variant="outline" size="sm" disabled={page >= pageCount} asChild={page < pageCount}>{page < pageCount ? <Link href={hrefFor(filters, page + 1)}>Next</Link> : "Next"}</Button>
            </div>
          </div>
        </div>
      </section>
      <ArticleCreateDrawer key={createOpen ? "open" : "closed"} open={createOpen} onOpenChange={setCreateOpen} categories={categories} />
      <AlertDialog open={Boolean(deleteSelection)} onOpenChange={(open) => !open && setDeleteSelection(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete {deleteItems.length === 1 ? "article" : "selected articles"}?</AlertDialogTitle><AlertDialogDescription>This permanently removes the article content and its category links.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={deleting} onClick={() => void confirmDelete()}>{deleting ? "Deleting..." : "Delete"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
