"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

interface CommentDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemLabel?: "comment" | "review";
  isDeleting?: boolean;
}

export const CommentDeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  itemLabel = "comment",
  isDeleting = false,
}: CommentDeleteConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="mx-auto max-w-md gap-5 rounded-[1.4rem] border-[#ead8bc] bg-[#fffaf1] p-6 shadow-2xl dark:border-white/10 dark:bg-[#12251f]">
        <AlertDialogHeader>
          <AlertDialogMedia className="rounded-full bg-[#f9e9dc] text-[#b83324] dark:bg-[#b83324]/15 dark:text-[#ef786a]">
            <Trash2 className="size-7" />
          </AlertDialogMedia>
          <AlertDialogTitle className="text-[#30261f] dark:text-[#f1f2ee]">
            Delete this {itemLabel}?
          </AlertDialogTitle>
          <AlertDialogDescription className="leading-6 text-[#75665a] dark:text-[#aab8b1]">
            This will permanently remove the {itemLabel} from the recipe
            conversation.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-full border-[#e2d1b5] bg-transparent px-5 dark:border-white/12"
          >
            Keep it
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-full bg-[#b83324] px-5 text-white hover:bg-[#9c2d21]"
          >
            {isDeleting ? "Deleting..." : `Delete ${itemLabel}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
