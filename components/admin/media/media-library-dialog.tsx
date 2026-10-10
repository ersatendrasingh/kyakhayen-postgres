"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Copy,
  File,
  FolderOpen,
  ImageIcon,
  Loader,
  Search,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadMediaAsset } from "@/lib/upload-media-client";
import { cn } from "@/lib/utils";
import type { MediaAsset, MediaType } from "@/types/media";

type MediaAccept = "image" | "video" | "all";
type WorkspaceVariant = "modal" | "page";
type PendingUpload = {
  id: string;
  file: File;
  preview: string;
  progress: number;
  status: "uploading" | "failed";
};

type MediaWorkspaceProps = {
  accept?: MediaAccept;
  onSelect?: (asset: MediaAsset, altText: string) => void;
  selectLabel?: string;
  variant?: WorkspaceVariant;
};

function formatBytes(size: number) {
  if (!size) return "Size unavailable";
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function acceptedFiles(accept: MediaAccept) {
  if (accept === "image") return "image/*";
  if (accept === "video") return "video/*";
  return "image/*,video/*";
}

function uploadDescription(accept: MediaAccept) {
  if (accept === "video") return "MP4 or WebM - large uploads supported";
  if (accept === "image") return "PNG, JPG, AVIF, GIF or WebP";
  return "Images or video - large videos upload in parts";
}

function allowedForPicker(asset: MediaAsset, accept: MediaAccept) {
  return accept === "all" || asset.mediaType === accept;
}

export function MediaLibraryWorkspace({
  accept = "all",
  onSelect,
  selectLabel = "Select media",
  variant = "page",
}: MediaWorkspaceProps) {
  const uploadRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef(new Set<string>());
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [selected, setSelected] = useState<MediaAsset | null>(null);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [query, setQuery] = useState("");
  const [mediaType, setMediaType] = useState<MediaAccept>(accept);
  const [altText, setAltText] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savingAlt, setSavingAlt] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;

    fetch("/api/media", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load media library.");
        return response.json() as Promise<MediaAsset[]>;
      })
      .then((media) => {
        if (active) setAssets(media);
      })
      .catch((error: unknown) => {
        if (active)
          toast.error(
            error instanceof Error ? error.message : "Unable to load media.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(
    () => () => {
      previewUrlsRef.current.forEach((preview) => URL.revokeObjectURL(preview));
      previewUrlsRef.current.clear();
    },
    [],
  );

  const filtered = useMemo(
    () =>
      assets.filter((asset) => {
        const matchesType =
          mediaType === "all" || asset.mediaType === (mediaType as MediaType);
        const matchesQuery = asset.name
          .toLowerCase()
          .includes(query.toLowerCase());
        return allowedForPicker(asset, accept) && matchesType && matchesQuery;
      }),
    [accept, assets, mediaType, query],
  );

  const uploadOne = async (pending: PendingUpload) => {
    try {
      const asset = await uploadMediaAsset(
        pending.file,
        { library: true },
        (event) => {
          const total = event.total ?? pending.file.size;
          setPendingUploads((current) =>
            current.map((upload) =>
              upload.id === pending.id
                ? {
                    ...upload,
                    progress: Math.round((event.loaded / total) * 100),
                  }
                : upload,
            ),
          );
        },
      );
      setAssets((current) => [
        asset,
        ...current.filter((item) => item.id !== asset.id),
      ]);
      setSelected(asset);
      setAltText(asset.altText ?? "");
      setPendingUploads((current) =>
        current.filter((upload) => upload.id !== pending.id),
      );
      URL.revokeObjectURL(pending.preview);
      previewUrlsRef.current.delete(pending.preview);
      toast.success(`${pending.file.name} uploaded`);
    } catch (error) {
      setPendingUploads((current) =>
        current.map((upload) =>
          upload.id === pending.id ? { ...upload, status: "failed" } : upload,
        ),
      );
      toast.error(
        error instanceof Error
          ? error.message
          : `Unable to upload ${pending.file.name}.`,
      );
    }
  };

  const chooseFiles = (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (!files.length) return;

    const validFiles = files.filter((file) => {
      if (accept === "image" && !file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image file.`);
        return false;
      }
      if (accept === "video" && !file.type.startsWith("video/")) {
        toast.error(`${file.name} is not a video file.`);
        return false;
      }
      return true;
    });
    const queued = validFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: "uploading" as const,
    }));
    queued.forEach((upload) => previewUrlsRef.current.add(upload.preview));

    setPendingUploads((current) => [...queued, ...current]);
    if (uploadRef.current) uploadRef.current.value = "";
    queued.forEach((upload) => void uploadOne(upload));
  };

  const persistAltText = async () => {
    if (!selected || selected.mediaType !== "image") return selected;
    if ((selected.altText ?? "") === altText.trim()) return selected;

    try {
      setSavingAlt(true);
      const response = await fetch("/api/media", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected.id,
          altText: altText.trim() || null,
        }),
      });
      if (!response.ok) throw new Error("Unable to save alt text.");
      const updated = (await response.json()) as MediaAsset;
      setAssets((current) =>
        current.map((asset) => (asset.id === updated.id ? updated : asset)),
      );
      setSelected(updated);
      return updated;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save alt text.",
      );
      return null;
    } finally {
      setSavingAlt(false);
    }
  };

  const removeSelected = async () => {
    if (!selected) return;
    try {
      setDeleting(true);
      const response = await fetch("/api/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id }),
      });
      const message = await response.json();
      if (!response.ok)
        throw new Error(
          typeof message === "string" ? message : "Unable to delete media.",
        );
      setAssets((current) =>
        current.filter((asset) => asset.id !== selected.id),
      );
      setSelected(null);
      setDeleteOpen(false);
      toast.success("Media deleted successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete media.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className={cn(
        "grid min-h-0",
        variant === "modal"
          ? "h-full overflow-hidden md:grid-cols-[2fr_1fr]"
          : "gap-5 lg:grid-cols-[minmax(0,1fr)_360px]",
      )}
    >
      <div
        className={cn(
          "flex min-h-0 flex-col",
          variant === "modal" && "border-r",
        )}
      >
        <div
          className={cn(
            variant === "modal"
              ? "bg-card"
              : "z-10 mb-3 shrink-0 bg-card lg:sticky lg:top-28 lg:rounded-2xl lg:border lg:p-3 lg:shadow-sm",
          )}
        >
          <div
            className={cn("shrink-0", variant === "modal" ? "p-4 pb-0" : "")}
          >
            <input
              ref={uploadRef}
              className="sr-only"
              type="file"
              accept={acceptedFiles(accept)}
              multiple
              onChange={(event) =>
                event.target.files && chooseFiles(event.target.files)
              }
            />
            <button
              type="button"
              className="flex h-[88px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed text-center transition hover:bg-muted/40"
              onClick={() => uploadRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                chooseFiles(event.dataTransfer.files);
              }}
            >
              <UploadCloud className="mb-1.5 size-6 text-muted-foreground" />
              <span className="text-sm font-medium">
                Click or drag {accept === "all" ? "media files" : `${accept}s`}{" "}
                to upload
              </span>
              <span className="mt-1 text-xs text-muted-foreground">
                {uploadDescription(accept)}
              </span>
            </button>
          </div>

          <div
            className={cn(
              "flex shrink-0 flex-col gap-2 sm:flex-row",
              variant === "modal" ? "px-4 pb-1 pt-3" : "pt-3",
            )}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search media"
                className="h-10 rounded-xl pl-9"
              />
            </div>
            {accept === "all" ? (
              <div className="flex gap-2">
                {(["all", "image", "video"] as const).map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={mediaType === type ? "default" : "outline"}
                    onClick={() => setMediaType(type)}
                    className="h-10 rounded-xl px-5 capitalize"
                  >
                    {type}
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div
          className={cn(
            "min-h-0",
            variant === "modal"
              ? "flex-1 overflow-y-auto overscroll-contain p-4 pt-3"
              : "max-h-[calc(100dvh-23rem)] overflow-y-auto overscroll-contain rounded-2xl border bg-muted/10 p-3",
          )}
        >
          {loading ? (
            <div
              className="flex h-[300px] items-center justify-center text-muted-foreground"
              aria-label="Loading media"
            >
              <Loader className="size-6 animate-spin" />
            </div>
          ) : !filtered.length && !pendingUploads.length ? (
            <div className="flex h-[300px] items-center justify-center">
              <div className="w-full max-w-xs rounded-xl border border-dashed bg-muted/30 p-8 text-center">
                <ImageIcon className="mx-auto mb-3 size-8 text-muted-foreground" />
                <p className="text-sm font-medium">No media uploaded yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Upload your first file to get started
                </p>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                "grid gap-3",
                variant === "modal"
                  ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
                  : "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4",
              )}
            >
              {pendingUploads.map((upload) => (
                <div
                  key={upload.id}
                  className="group relative aspect-square overflow-hidden rounded-xl border"
                >
                  <PendingPreview upload={upload} />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    {upload.status === "failed" ? (
                      <button
                        type="button"
                        onClick={() => {
                          setPendingUploads((current) =>
                            current.map((item) =>
                              item.id === upload.id
                                ? { ...item, status: "uploading", progress: 0 }
                                : item,
                            ),
                          );
                          void uploadOne(upload);
                        }}
                        className="flex cursor-pointer flex-col items-center gap-1 rounded-lg bg-black/60 px-3 py-2 text-xs text-white transition hover:bg-black/80"
                      >
                        <UploadCloud className="size-5" />
                        Retry
                      </button>
                    ) : (
                      <div
                        className="flex size-12 items-center justify-center rounded-full bg-black/35 text-white"
                        aria-label={`Uploading ${upload.file.name}`}
                      >
                        <Loader className="size-6 animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {filtered.map((asset, index) => (
                <button
                  type="button"
                  key={asset.id}
                  aria-label={`Select ${asset.name}`}
                  onClick={() => {
                    setSelected(asset);
                    setAltText(asset.altText ?? "");
                  }}
                  className={cn(
                    "group relative aspect-square cursor-pointer overflow-hidden rounded-xl border transition hover:ring-1 hover:ring-border",
                    selected?.id === asset.id && "ring-2 ring-primary",
                  )}
                >
                  <MediaPreview
                    asset={asset}
                    className="h-full w-full"
                    eager={index < 8}
                  />
                  {selected?.id === asset.id ? (
                    <span className="absolute right-2 top-2 rounded-full bg-primary p-1 text-primary-foreground">
                      <Check className="size-3.5" />
                    </span>
                  ) : null}
                  <span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/15" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <aside
        className={cn(
          "flex min-h-0 flex-col self-start",
          variant === "modal"
            ? "h-full p-4"
            : "rounded-2xl border bg-card p-4 lg:sticky lg:top-28 lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto",
        )}
      >
        {selected ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
              <MediaPreview
                asset={selected}
                className="aspect-video rounded-lg border"
              />
              <div className="space-y-1 text-xs">
                <p>
                  <strong>File Name:</strong>{" "}
                  <span className="break-all">{selected.name}</span>
                </p>
                <p>
                  <strong>Type:</strong> {selected.mediaType}
                </p>
                <p>
                  <strong>Mime:</strong> {selected.mimeType}
                </p>
                <p>
                  <strong>Size:</strong> {formatBytes(selected.fileSize)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="flex cursor-pointer items-center gap-1 text-xs text-destructive hover:underline"
              >
                <Trash2 className="size-3" /> Delete permanently
              </button>
              <div className="space-y-1">
                <Label className="text-xs">Media URL</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={selected.url}
                    readOnly
                    className="h-9 text-xs"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    aria-label="Copy media URL"
                    onClick={async () => {
                      await navigator.clipboard.writeText(selected.url);
                      setCopied(true);
                      toast.success("Media URL copied to clipboard");
                      window.setTimeout(() => setCopied(false), 1500);
                    }}
                  >
                    {copied ? <Check className="text-emerald-500" /> : <Copy />}
                  </Button>
                </div>
              </div>
              {selected.mediaType === "image" ? (
                <div className="space-y-1">
                  <Label
                    htmlFor={`media-alt-${selected.id}`}
                    className="text-xs"
                  >
                    Alt Text
                  </Label>
                  <div className="relative">
                    <Input
                      id={`media-alt-${selected.id}`}
                      value={altText}
                      onChange={(event) => setAltText(event.target.value)}
                      placeholder="Accessible image description"
                      className={cn("h-9 text-xs", !onSelect && "pr-10")}
                    />
                    {!onSelect ? (
                      <button
                        type="button"
                        aria-label="Save alt text"
                        disabled={
                          savingAlt ||
                          (selected.altText ?? "") === altText.trim()
                        }
                        onClick={() => void persistAltText()}
                        className="absolute right-1 top-1/2 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-primary transition hover:bg-primary/10 disabled:cursor-default disabled:text-muted-foreground"
                      >
                        {savingAlt ? (
                          <Loader className="size-4 animate-spin" />
                        ) : (
                          <Check className="size-4" />
                        )}
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
            {onSelect ? (
              <Button
                type="button"
                className="mt-4 w-full"
                disabled={!allowedForPicker(selected, accept) || savingAlt}
                onClick={async () => {
                  const saved = await persistAltText();
                  if (selected.mediaType === "image" && !saved) return;
                  onSelect(saved ?? selected, altText.trim());
                }}
              >
                {savingAlt ? <Loader className="animate-spin" /> : <Check />}{" "}
                {selectLabel}
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="flex h-full items-start justify-center lg:pt-3">
            <div className="w-full rounded-xl border border-dashed bg-muted/30 p-6 text-center">
              <span className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
                <FolderOpen className="size-5 text-muted-foreground" />
              </span>
              <p className="text-sm font-medium">No media selected</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Select a media from the grid to preview details
              </p>
            </div>
          </div>
        )}
      </aside>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete media permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              Assets used by existing content are protected and cannot be
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              variant="destructive"
              onClick={(event) => {
                event.preventDefault();
                void removeSelected();
              }}
            >
              {deleting ? <Loader className="animate-spin" /> : <Trash2 />}{" "}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PendingPreview({ upload }: { upload: PendingUpload }) {
  if (upload.file.type.startsWith("image/")) {
    return (
      <Image
        src={upload.preview}
        alt=""
        fill
        className="object-cover opacity-85"
        sizes="220px"
        unoptimized
      />
    );
  }

  return (
    <video
      src={upload.preview}
      muted
      className="h-full w-full object-cover opacity-85"
    />
  );
}

function MediaPreview({
  asset,
  className,
  eager = false,
}: {
  asset: MediaAsset;
  className?: string;
  eager?: boolean;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-muted/25", className)}>
      {asset.mediaType === "image" ? (
        <Image
          src={asset.url}
          alt={asset.altText ?? ""}
          fill
          className="object-cover"
          sizes="260px"
          loading={eager ? "eager" : "lazy"}
        />
      ) : asset.mediaType === "video" ? (
        <video
          src={asset.url}
          controls
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <File className="size-10 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

export function MediaLibraryDialog({
  open,
  onOpenChange,
  onSelect,
  accept = "all",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (asset: MediaAsset, altText: string) => void;
  accept?: MediaAccept;
  title?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[min(650px,calc(100vh-2rem))] gap-0 overflow-hidden p-0 sm:max-w-[1100px]!">
        <DialogTitle className="sr-only">Media Library</DialogTitle>
        <DialogDescription className="sr-only">
          Upload media or choose an existing asset from the library.
        </DialogDescription>
        <MediaLibraryWorkspace
          accept={accept}
          onSelect={onSelect}
          selectLabel={`Select ${accept === "all" ? "media" : accept}`}
          variant="modal"
        />
      </DialogContent>
    </Dialog>
  );
}
