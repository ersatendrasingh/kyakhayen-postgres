"use client";

import Image from "next/image";
import { useState } from "react";
import { FileVideo2, ImageIcon, Images, X } from "lucide-react";

import { MediaLibraryDialog } from "@/components/admin/media/media-library-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function MediaField({
  label,
  value,
  onChange,
  accept = "image",
  disabled = false,
  description,
  className,
}: {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  accept?: "image" | "video";
  disabled?: boolean;
  description?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      <div className="overflow-hidden rounded-2xl border bg-muted/15">
        <div className="relative flex aspect-video items-center justify-center overflow-hidden">
          {value && accept === "image" ? (
            <Image src={value} alt="" fill className="object-cover" sizes="480px" loading="eager" />
          ) : value ? (
            <video src={value} controls className="h-full w-full object-cover" />
          ) : accept === "image" ? (
            <ImageIcon className="size-10 text-muted-foreground" />
          ) : (
            <FileVideo2 className="size-10 text-muted-foreground" />
          )}
        </div>
        <div className="flex items-center justify-between gap-2 border-t p-3">
          <p className="truncate text-xs text-muted-foreground">
            {description ?? (value ? "Selected from media library" : "No media selected")}
          </p>
          <div className="flex shrink-0 gap-2">
            {value ? (
              <Button type="button" size="icon-sm" variant="ghost" disabled={disabled} aria-label={`Remove ${label}`} onClick={() => onChange(null)}>
                <X />
              </Button>
            ) : null}
            <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => setOpen(true)}>
              <Images /> {value ? "Replace" : "Choose"}
            </Button>
          </div>
        </div>
      </div>
      <MediaLibraryDialog
        open={open}
        onOpenChange={setOpen}
        accept={accept}
        title={`Choose ${label.toLowerCase()}`}
        onSelect={(asset) => {
          onChange(asset.url);
          setOpen(false);
        }}
      />
    </div>
  );
}
