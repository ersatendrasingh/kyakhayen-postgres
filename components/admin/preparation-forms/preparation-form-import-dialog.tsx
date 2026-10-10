"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet, LoaderCircle, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import type { PreparationFormImportRow } from "@/components/admin/preparation-forms/preparation-form-types";
import {
  downloadPreparationFormTemplate,
  parsePreparationFormCsv,
} from "@/components/admin/preparation-forms/preparation-form-utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function PreparationFormImportDialog({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}) {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<PreparationFormImportRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const previewRows = useMemo(() => rows.slice(0, 8), [rows]);

  const onFileChange = async (file: File | undefined) => {
    if (!file) return;
    try {
      setParsing(true);
      setFileName(file.name);
      const parsed = await parsePreparationFormCsv(file);
      setRows(parsed);
      toast.success(`${parsed.length} preparation forms ready for import`);
    } catch (error) {
      setRows([]);
      toast.error(error instanceof Error ? error.message : "Unable to parse CSV file.");
    } finally {
      setParsing(false);
    }
  };

  const onImport = async () => {
    if (!rows.length) return;
    let imported = 0;
    try {
      setImporting(true);
      for (const row of rows) {
        const response = await fetch("/api/ingredients/ingredients-form", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(row),
        });
        if (!response.ok) {
          throw new Error(`Import stopped at "${row.name}". Check for duplicates.`);
        }
        imported += 1;
      }
      toast.success(`${imported} preparation forms imported successfully`);
      setRows([]);
      setFileName("");
      onOpenChange(false);
      onImported();
    } catch (error) {
      if (imported) onImported();
      toast.error(error instanceof Error ? error.message : "Unable to import preparation forms.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] gap-0 overflow-hidden rounded-3xl border-border/70 p-0 sm:max-w-2xl">
        <DialogHeader className="border-b bg-card/75 px-6 py-6">
          <DialogTitle className="text-xl">Import preparation forms</DialogTitle>
          <DialogDescription>Upload a CSV file with a `name` column.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 overflow-y-auto p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex min-h-14 flex-1 cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-primary/25 bg-primary/[0.03] px-5 text-sm transition hover:border-primary/45">
              <UploadCloud className="size-5 text-primary" />
              <span className="truncate text-muted-foreground">{fileName || "Choose CSV file"}</span>
              <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => onFileChange(event.target.files?.[0])} />
            </label>
            <Button type="button" variant="outline" className="min-h-14 rounded-2xl" onClick={downloadPreparationFormTemplate}>
              <FileSpreadsheet />
              Download Template
            </Button>
          </div>
          <div className="overflow-hidden rounded-2xl border">
            <div className="border-b bg-muted/35 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Form name
            </div>
            <div className="max-h-72 divide-y overflow-y-auto">
              {previewRows.length ? (
                previewRows.map((row, index) => (
                  <div key={`${row.name}-${index}`} className="px-4 py-3 text-sm font-medium">
                    {row.name}
                  </div>
                ))
              ) : (
                <p className="px-5 py-14 text-center text-sm text-muted-foreground">
                  {parsing ? "Reading CSV..." : "Upload a CSV file to preview rows."}
                </p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter className="border-t bg-background px-6 py-5">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>Cancel</Button>
          <Button type="button" onClick={onImport} disabled={!rows.length || parsing || importing}>
            {importing && <LoaderCircle className="animate-spin" />}
            Import {rows.length || ""} Forms
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
