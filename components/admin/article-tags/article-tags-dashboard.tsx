"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, EllipsisVertical, FileSpreadsheet, Hash, ImageOff, Link2, Pencil, Search, Sparkles, Trash2, Upload, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { ArticleTagDrawer } from "@/components/admin/article-tags/article-tag-drawer";
import type { ArticleTagRecord } from "@/components/admin/article-tags/article-tag-types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function csvEscape(value: unknown) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }
function download(content: string, fileName: string) { const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = fileName; link.click(); URL.revokeObjectURL(url); }
function exportTags(tags: ArticleTagRecord[], fileName = "article-tags.csv") { download([["title", "slug", "position", "published", "linkedArticles", "imageUrl"].map(csvEscape).join(","), ...tags.map((tag) => [tag.title, tag.slug, tag.position, tag.isPublished, tag.articleCount, tag.imageUrl].map(csvEscape).join(","))].join("\n"), fileName); }

export function ArticleTagsDashboard({ tags }: { tags: ArticleTagRecord[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTag, setActiveTag] = useState<ArticleTagRecord | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<string[]>([]);
  const [deleteTags, setDeleteTags] = useState<ArticleTagRecord[]>([]);
  const ordered = useMemo(() => [...tags].sort((a, b) => (a.position ?? 99999) - (b.position ?? 99999) || a.title.localeCompare(b.title)), [tags]);
  const filtered = ordered.filter((tag) => !search.trim() || `${tag.title} ${tag.slug}`.toLowerCase().includes(search.trim().toLowerCase()));
  const refresh = () => { setSelected([]); router.refresh(); };
  const move = async (tag: ArticleTagRecord, offset: number) => {
    const index = ordered.findIndex((item) => item.id === tag.id);
    if (index + offset < 0 || index + offset >= ordered.length) return;
    const next = [...ordered]; const [item] = next.splice(index, 1); next.splice(index + offset, 0, item);
    const response = await fetch("/api/articles/tags/reorder", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ list: next.map((row, position) => ({ id: row.id, position: position + 1 })) }) });
    if (response.ok) { toast.success("Tag position updated"); refresh(); } else toast.error("Unable to reorder tags.");
  };
  const publish = async (tag: ArticleTagRecord, isPublished: boolean) => {
    const response = await fetch(`/api/articles/tags/${tag.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPublished }) });
    if (response.ok) { toast.success(`${tag.title} ${isPublished ? "published" : "unpublished"}`); refresh(); } else toast.error("Unable to update tag.");
  };
  const confirmDelete = async () => {
    for (const tag of deleteTags) {
      const response = await fetch(`/api/articles/tags/${tag.id}`, { method: "DELETE" });
      if (!response.ok) return toast.error(`Unable to delete "${tag.title}". Remove linked articles first.`);
    }
    toast.success("Tag selection deleted"); setDeleteTags([]); refresh();
  };
  const importCsv = async (file: File | undefined) => {
    if (!file) return;
    const lines = (await file.text()).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines[0]?.toLowerCase().split(",")[0].replaceAll('"', "") !== "title") return toast.error('CSV first column must be "title".');
    setImportRows(lines.slice(1).map((line) => line.split(",")[0].replaceAll('"', "").trim()).filter(Boolean));
  };
  const applyImport = async () => {
    for (const title of importRows) {
      const response = await fetch("/api/articles/tags", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title }) });
      if (!response.ok) return toast.error(`Import stopped at "${title}".`);
    }
    toast.success(`${importRows.length} article tags imported`); setImportRows([]); setImportOpen(false); refresh();
  };

  return <div className="space-y-6">
    <section className="admin-taxonomy-hero rounded-[32px] p-5 sm:p-7 lg:p-9">
      <div className="relative z-[1] flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between"><div className="max-w-2xl space-y-3"><span className="admin-taxonomy-hero-badge inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]">Editorial Discovery</span><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Article tags dashboard</h1><p className="admin-taxonomy-hero-copy text-sm sm:text-base">Create cross-category themes for search, seasonal campaigns and related reading.</p></div><div className="flex flex-wrap gap-3"><Button variant="outline" className="admin-taxonomy-hero-action rounded-2xl" onClick={() => setImportOpen(true)}><Upload />Import</Button><Button variant="outline" className="admin-taxonomy-hero-action rounded-2xl" onClick={() => exportTags(filtered)}><Download />Export</Button><Button className="rounded-2xl" onClick={() => { setActiveTag(null); setDrawerOpen(true); }}><Sparkles />Add Tag</Button></div></div>
      <div className="relative z-[1] mt-7 grid gap-4 md:grid-cols-3">{[{ label: "Total Tags", value: tags.length, icon: Hash }, { label: "Published", value: tags.filter((tag) => tag.isPublished).length, icon: Sparkles }, { label: "Article Links", value: tags.reduce((sum, tag) => sum + tag.articleCount, 0), icon: Link2 }].map((stat) => <div key={stat.label} className="admin-taxonomy-stat rounded-3xl px-5 py-5"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{stat.label}</p><stat.icon className="size-5 text-primary" /></div><p className="mt-3 text-3xl font-semibold">{stat.value}</p></div>)}</div>
    </section>
    <section className="overflow-hidden rounded-[28px] border bg-card p-4 shadow-sm sm:p-5"><div className="flex flex-col justify-between gap-4 lg:flex-row"><div className="relative w-full max-w-lg"><Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tags" className="h-12 rounded-2xl pl-11" /></div><Button variant="outline" className="rounded-2xl" disabled={!selected.length} onClick={() => setDeleteTags(ordered.filter((tag) => selected.includes(tag.id)))}><Trash2 />Delete Selected</Button></div>
      <div className="mt-5 overflow-hidden rounded-3xl border"><Table><TableHeader className="bg-muted/35"><TableRow><TableHead className="w-12"><Checkbox checked={filtered.length > 0 && filtered.every((tag) => selected.includes(tag.id))} onCheckedChange={(checked) => setSelected(checked ? filtered.map((tag) => tag.id) : [])} /></TableHead><TableHead>Tag</TableHead><TableHead>Position</TableHead><TableHead>Articles</TableHead><TableHead>Published</TableHead><TableHead className="w-12" /></TableRow></TableHeader><TableBody>{filtered.map((tag, index) => <TableRow key={tag.id}><TableCell><Checkbox checked={selected.includes(tag.id)} onCheckedChange={(checked) => setSelected((items) => checked ? [...items, tag.id] : items.filter((id) => id !== tag.id))} /></TableCell><TableCell><button className="flex cursor-pointer items-center gap-3 text-left" onClick={() => { setActiveTag(tag); setDrawerOpen(true); }}>{tag.imageUrl ? <Image src={tag.imageUrl} alt={tag.title} width={48} height={48} className="size-12 rounded-2xl object-cover" /> : <span className="flex size-12 items-center justify-center rounded-2xl border bg-muted/40"><ImageOff className="size-5 text-muted-foreground" /></span>}<span><span className="block font-semibold">{tag.title}</span><span className="text-xs text-muted-foreground">/{tag.slug}</span></span></button></TableCell><TableCell><Badge variant="outline">#{tag.position ?? "-"}</Badge></TableCell><TableCell><Badge variant="secondary">{tag.articleCount} linked</Badge></TableCell><TableCell><div className="flex items-center gap-2"><Switch checked={tag.isPublished} onCheckedChange={(value) => void publish(tag, value)} /><span className="text-xs text-muted-foreground">{tag.isPublished ? "Live" : "Draft"}</span></div></TableCell><TableCell><DropdownMenu><DropdownMenuTrigger asChild><Button size="icon-sm" variant="ghost"><EllipsisVertical /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => { setActiveTag(tag); setDrawerOpen(true); }}><Pencil />Edit</DropdownMenuItem><DropdownMenuItem disabled={index === 0} onClick={() => void move(tag, -1)}>Move up</DropdownMenuItem><DropdownMenuItem disabled={index === ordered.length - 1} onClick={() => void move(tag, 1)}>Move down</DropdownMenuItem><DropdownMenuItem variant="destructive" onClick={() => setDeleteTags([tag])}><Trash2 />Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>)}</TableBody></Table></div>
    </section>
    <ArticleTagDrawer key={`${activeTag?.id ?? "new"}-${drawerOpen}`} open={drawerOpen} onOpenChange={setDrawerOpen} tag={activeTag} onSaved={refresh} />
    <Dialog open={importOpen} onOpenChange={setImportOpen}><DialogContent className="rounded-3xl"><DialogHeader><DialogTitle>Import article tags</DialogTitle><DialogDescription>Upload CSV with a `title` column. Images can be added from media after import.</DialogDescription></DialogHeader><label className="flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border border-dashed px-5"><UploadCloud className="text-primary" />Choose CSV file<input className="sr-only" type="file" accept=".csv,text/csv" onChange={(event) => void importCsv(event.target.files?.[0])} /></label><Button type="button" variant="outline" onClick={() => download("title\nSeasonal Cooking\nQuick Meals", "article-tags-import-template.csv")}><FileSpreadsheet />Download Template</Button><p className="text-sm text-muted-foreground">{importRows.length ? `${importRows.length} tags ready for import.` : "No rows loaded."}</p><DialogFooter><Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button><Button disabled={!importRows.length} onClick={() => void applyImport()}>Import Tags</Button></DialogFooter></DialogContent></Dialog>
    <AlertDialog open={deleteTags.length > 0} onOpenChange={(open) => !open && setDeleteTags([])}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete selected tags?</AlertDialogTitle><AlertDialogDescription>Tags linked to articles cannot be deleted until those links are removed.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => void confirmDelete()}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
