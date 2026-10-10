"use client";

import axios from "axios";
import { Trash } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmModal } from "@/components/modals/confirm-modal";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface MethodActionProps {
  recipeId: string;
  methodId: string;
  disabled?: boolean;
  isPublished?: boolean;
}

export const MethodActions = ({
  recipeId,
  methodId,
  disabled,
  isPublished,
}: MethodActionProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onClick = async () => {
    try {
      setIsLoading(true);

      if (isPublished) {
        await axios.patch(
          `/api/recipes/${recipeId}/methods/${methodId}/unpublish`
        );
        toast.success("Method unpublished successfully", {
          duration: 5000,
        });
      } else {
        await axios.patch(
          `/api/recipes/${recipeId}/methods/${methodId}/publish`
        );
        toast.success("Method published successfully", {
          duration: 5000,
        });
      }

      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };
  const onDelete = async () => {
    try {
      setIsLoading(true);
      await axios.delete(`/api/recipes/${recipeId}/methods/${methodId}`);
      toast.success("Method deleted successfully", {
        duration: 5000,
      });

      router.push(`/admin/recipes/${recipeId}`);
      router.refresh();
    } catch {
      toast.error("Something went wrong while deleting method", {
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-x-2">
      <Button
        variant="outline"
        size="sm"
        disabled={disabled || isLoading}
        onClick={onClick}
      >
        {isPublished ? "Unpublish" : "Publish"}
      </Button>
      <ConfirmModal onConfirm={onDelete}>
        <Button variant="destructive" size="sm" disabled={isLoading}>
          <Trash className="w-4 h-4" />
        </Button>
      </ConfirmModal>
    </div>
  );
};
