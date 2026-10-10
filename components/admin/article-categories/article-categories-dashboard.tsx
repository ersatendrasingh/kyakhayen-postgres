"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, type RowSelectionState, type SortingState, useReactTable } from "@tanstack/react-table";
import { BookOpen, Download, FileText, FolderTree, Search, Sparkles, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { ArticleCategoryDrawer } from "@/components/admin/article-categories/article-category-drawer";
import { getArticleCategoryColumns } from "@/components/admin/article-categories/article-category-columns";
import { ArticleCategoryImportDialog } from "@/components/admin/article-categories/article-category-import-dialog";
import type { ArticleCategoryRecord } from "@/components/admin/article-categories/article-category-types";
import { exportArticleCategories } from "@/components/admin/article-categories/article-category-utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type DeleteSelection = { type: "single"; category: ArticleCategoryRecord } | { type: "bulk"; categories: ArticleCategoryRecord[] } | null;

export function ArticleCategoriesDashboard({ categories, totalArticles, uncategorizedArticles }: { categories: ArticleCategoryRecord[]; totalArticles: number; uncategorizedArticles: number }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [selectedCategory, setSelectedCategory] = useState<ArticleCategoryRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteSelection, setDeleteSelection] = useState<DeleteSelection>(null);
  const [deleting, setDeleting] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const orderedCategories = useMemo(() => [...categories].sort((a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER) || a.title.localeCompare(b.title)), [categories]);
  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? orderedCategories.filter((item) => item.title.toLowerCase().includes(query) || item.slug.toLowerCase().includes(query)) : orderedCategories;
  }, [orderedCategories, search]);
  const refresh = () => { setRowSelection({}); router.refresh(); };

  const moveCategory = async (category: ArticleCategoryRecord, direction: "up" | "down") => {
    const sourceIndex = orderedCategories.findIndex((item) => item.id === category.id);
    const destinationIndex = direction === "up" ? sourceIndex - 1 : sourceIndex + 1;
    if (sourceIndex < 0 || destinationIndex < 0 || destinationIndex >= orderedCategories.length) return;
    const reordered = [...orderedCategories];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(destinationIndex, 0, moved);
    try {
      setReordering(true);
      const response = await fetch("/api/articles/categories/reorder", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ list: reordered.map((item, index) => ({ id: item.id, position: index + 1 })) }) });
      if (!response.ok) throw new Error("Unable to update category order.");
      setSorting([]);
      toast.success("Category position updated");
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reorder categories.");
    } finally {
      setReordering(false);
    }
  };
  const updatePublishedState = async (category: ArticleCategoryRecord, isPublished: boolean) => {
    try {
      setPublishingId(category.id);
      const response = await fetch(`/api/articles/categories/${category.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPublished }) });
      if (!response.ok) throw new Error("Unable to update category visibility.");
      toast.success(`${category.title} ${isPublished ? "published" : "unpublished"}`);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update category.");
    } finally {
      setPublishingId(null);
    }
  };
  const columns = getArticleCategoryColumns(
    (category) => { setSelectedCategory(category); setDrawerOpen(true); },
    (category, value) => void updatePublishedState(category, value),
    (category) => setDeleteSelection({ type: "single", category }),
    (category) => void moveCategory(category, "up"),
    (category) => void moveCategory(category, "down"),
    (category) => orderedCategories[0]?.id === category.id,
    (category) => orderedCategories[orderedCategories.length - 1]?.id === category.id,
    reordering,
    publishingId
  );
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({ data: filteredCategories, columns, getRowId: (row) => row.id, enableRowSelection: true, onSortingChange: setSorting, onRowSelectionChange: setRowSelection, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getPaginationRowModel: getPaginationRowModel(), initialState: { pagination: { pageSize: 8 } }, state: { sorting, rowSelection } });
  const selectedCategories = orderedCategories.filter((category) => rowSelection[category.id]);
  const deleteItems = deleteSelection?.type === "single" ? [deleteSelection.category] : deleteSelection?.categories ?? [];
  const liveCategories = categories.filter((item) => item.isPublished).length;
  const confirmDelete = async () => {
    try {
      setDeleting(true);
      for (const category of deleteItems) {
        const response = await fetch(`/api/articles/categories/${category.id}`, { method: "DELETE" });
        if (!response.ok) throw new Error(`Unable to delete "${category.title}". It may still be linked to an article.`);
      }
      toast.success(deleteItems.length === 1 ? "Category deleted successfully" : `${deleteItems.length} categories deleted successfully`);
      setDeleteSelection(null);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete category.");
    } finally {
      setDeleting(false);
    }
  };

  return <div className="space-y-6">
    <section className="admin-taxonomy-hero rounded-[32px] p-5 sm:p-7 lg:p-9">
      <div className="relative z-[1] flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-2xl space-y-3"><span className="admin-taxonomy-hero-badge inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]">Editorial Taxonomy</span><div><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Article categories dashboard</h1><p className="admin-taxonomy-hero-copy mt-2 text-sm sm:text-base">Organize published stories into clear, visual collections for readers.</p></div></div>
        <div className="flex flex-wrap gap-3 sm:flex-nowrap"><Button variant="outline" className="admin-taxonomy-hero-action rounded-2xl" onClick={() => setImportOpen(true)}><Upload />Import</Button><Button variant="outline" className="admin-taxonomy-hero-action rounded-2xl" onClick={() => exportArticleCategories(filteredCategories)}><Download />Export</Button><Button className="rounded-2xl shadow-sm" onClick={() => { setSelectedCategory(null); setDrawerOpen(true); }}><Sparkles />Add Category</Button></div>
      </div>
      <div className="relative z-[1] mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[
        { label: "Total Categories", value: categories.length, icon: FolderTree },
        { label: "Published", value: liveCategories, icon: Sparkles },
        { label: "Total Articles", value: totalArticles, icon: FileText },
        { label: "Uncategorized", value: uncategorizedArticles, icon: BookOpen },
      ].map((stat) => <div key={stat.label} className="admin-taxonomy-stat rounded-3xl px-5 py-5 backdrop-blur"><div className="flex items-center justify-between gap-4"><p className="admin-taxonomy-stat-label text-sm font-medium">{stat.label}</p><stat.icon className="admin-taxonomy-stat-icon size-5" /></div><p className="admin-taxonomy-stat-value mt-3 text-3xl font-semibold">{stat.value}</p></div>)}</div>
    </section>
    <section className="overflow-hidden rounded-[28px] border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="relative w-full max-w-lg"><Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by title or slug" className="h-12 rounded-2xl pl-11" /></div><div className="flex flex-wrap items-center gap-2"><Button variant="outline" className="rounded-2xl" disabled={!selectedCategories.length} onClick={() => exportArticleCategories(selectedCategories, "selected-article-categories.csv")}><Download />Export Selected</Button><Button variant="outline" className="rounded-2xl" disabled={!selectedCategories.length} onClick={() => setDeleteSelection({ type: "bulk", categories: selectedCategories })}><Trash2 />Delete Selected</Button></div></div>
      <div className="mt-5 overflow-hidden rounded-3xl border border-border/70"><Table><TableHeader className="bg-muted/35">{table.getHeaderGroups().map((group) => <TableRow key={group.id} className="hover:bg-transparent">{group.headers.map((header) => <TableHead key={header.id} className={cn("h-14 px-4", header.column.id === "position" && "hidden sm:table-cell", header.column.id === "slug" && "hidden lg:table-cell")}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>)}</TableRow>)}</TableHeader><TableBody>{table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>{row.getVisibleCells().map((cell) => <TableCell key={cell.id} className={cn("px-4 py-3", cell.column.id === "position" && "hidden sm:table-cell", cell.column.id === "slug" && "hidden lg:table-cell")}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">No categories found.</TableCell></TableRow>}</TableBody></Table><div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted-foreground">{selectedCategories.length ? `${selectedCategories.length} selected` : `${filteredCategories.length} categories`}</p><div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button><span className="px-2 text-sm text-muted-foreground">Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}</span><Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button></div></div></div>
    </section>
    <ArticleCategoryDrawer key={`${selectedCategory?.id ?? "new"}-${drawerOpen ? "open" : "closed"}`} open={drawerOpen} onOpenChange={setDrawerOpen} category={selectedCategory} onSaved={refresh} />
    <ArticleCategoryImportDialog open={importOpen} onOpenChange={setImportOpen} onImported={refresh} />
    <AlertDialog open={Boolean(deleteSelection)} onOpenChange={(open) => !open && setDeleteSelection(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete {deleteItems.length === 1 ? "category" : "selected categories"}?</AlertDialogTitle><AlertDialogDescription>Categories linked to articles cannot be removed until those assignments are cleared.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => void confirmDelete()} disabled={deleting}>{deleting ? "Deleting..." : "Delete"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
