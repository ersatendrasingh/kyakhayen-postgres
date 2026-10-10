"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet, LoaderCircle, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import type { BodyTypeImportRow } from "@/components/admin/recipe-body-types/body-type-types";
import {
  downloadBodyTypeTemplate,
  parseBodyTypeCsv,
} from "@/components/admin/recipe-body-types/body-type-utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type BodyTypeImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
};

export function BodyTypeImportDialog({
  open,
  onOpenChange,
  onImported,
}: BodyTypeImportDialogProps) {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<BodyTypeImportRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const previewRows = useMemo(() => rows.slice(0, 8), [rows]);

  const onFileChange = async (file: File | undefined) => {
    if (!file) return;

    try {
      setParsing(true);
      setFileName(file.name);
      const parsed = await parseBodyTypeCsv(file);
      setRows(parsed);
      toast.success(`${parsed.length} body types ready for import`);
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
        const response = await fetch("/api/recipes/body-types", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(row),
        });

        if (!response.ok) {
          throw new Error(`Import stopped at "${row.title}". Check for duplicate titles.`);
        }

        imported += 1;
      }

      toast.success(`${imported} body types imported successfully`);
      setRows([]);
      setFileName("");
      onOpenChange(false);
      onImported();
    } catch (error) {
      if (imported) onImported();
      toast.error(error instanceof Error ? error.message : "Unable to import body types.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] gap-0 overflow-hidden rounded-3xl border-border/70 p-0 sm:max-w-3xl">
        <DialogHeader className="border-b bg-card/75 px-6 py-6">
          <DialogTitle className="text-xl">Import body types</DialogTitle>
          <DialogDescription>
            Upload a CSV file with `title` and optional `imageUrl` columns.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 overflow-y-auto p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex min-h-14 flex-1 cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-primary/25 bg-primary/[0.03] px-5 text-sm transition hover:border-primary/45">
              <UploadCloud className="size-5 text-primary" />
              <span className="truncate text-muted-foreground">
                {fileName || "Choose CSV file"}
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(event) => onFileChange(event.target.files?.[0])}
              />
            </label>
            <Button
              type="button"
              variant="outline"
              className="min-h-14 rounded-2xl"
              onClick={downloadBodyTypeTemplate}
            >
              <FileSpreadsheet />
              Download Template
            </Button>
          </div>

          <div className="overflow-hidden rounded-2xl border">
            <div className="grid grid-cols-[1fr_1.35fr] border-b bg-muted/35 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <span>Title</span>
              <span>Image URL</span>
            </div>
            <div className="max-h-72 divide-y overflow-y-auto">
              {previewRows.length ? (
                previewRows.map((row, index) => (
                  <div
                    key={`${row.title}-${index}`}
                    className="grid grid-cols-[1fr_1.35fr] gap-4 px-4 py-3 text-sm"
                  >
                    <span className="font-medium">{row.title}</span>
                    <span className="truncate text-muted-foreground">
                      {row.imageUrl ?? "-"}
                    </span>
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
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={importing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onImport}
            disabled={!rows.length || parsing || importing}
          >
            {importing && <LoaderCircle className="animate-spin" />}
            Import {rows.length || ""} Body Types
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
