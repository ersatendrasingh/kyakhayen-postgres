"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PreferenceConfirmationModalProps {
  title: string;
  description: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
}

const PreferenceConfirmationModal = ({
  title,
  description,
  isOpen,
  onClose,
  onConfirm,
  confirmText = "Check Meal Plan",
  cancelText = "Close",
}: PreferenceConfirmationModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-r from-yellow-500 via-red-500 to-pink-500 border-none rounded-lg p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="text-center text-white text-2xl font-bold">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 text-center">
          <p className="text-white text-lg">{description}</p>
        </div>
        <DialogFooter className="flex flex-col md:flex-row justify-center items-center space-y-3 md:space-y-0 md:space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full md:w-auto border-white bg-transparent text-white hover:bg-white hover:text-black transition-colors"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className="w-full md:w-auto bg-white text-black hover:bg-gray-200 transition-colors"
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PreferenceConfirmationModal;
