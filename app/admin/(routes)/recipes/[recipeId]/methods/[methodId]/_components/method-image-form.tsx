"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, PlusCircleIcon, ImageIcon } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import FileUpload from "@/components/upload/file-upload";
import { RecipeMethods } from "@prisma/client";

interface MethodImageFormProps {
  initialData: RecipeMethods;
  recipeId: string;
  methodId: string;
}

export const MethodImageForm = ({
  initialData,
  recipeId,
  methodId,
}: MethodImageFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const toggleEdit = () => setIsEditing((current) => !current);

  const router = useRouter();

  const onSubmit = async (fileUrl: string) => {
    const imageUrl = { imageUrl: fileUrl.toString() };
    try {
      await axios.patch(
        `/api/recipes/${recipeId}/methods/${methodId}`,
        imageUrl
      );
      toast.success("Method image updated successfully", {
        duration: 5000,
      });
      toggleEdit();
      router.refresh();
      return true;
    } catch {
      toast.error("Something went wrong while updating method image", {
        duration: 5000,
      });
      return false;
    }
  };

  return (
    <div className="mt-6 border rounded-md p-4 bg-slate-100">
      <div className="flex items-center justify-between font-medium">
        Method image
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing && <>Cancel</>}
          {!isEditing && !initialData.imageUrl && (
            <>
              <PlusCircleIcon className="w-6 h-6 pr-2" />
              Add a image
            </>
          )}
          {!isEditing && initialData.imageUrl && (
            <>
              <Pencil className="w-6 h-6 pr-2" />
              Edit image
            </>
          )}
        </Button>
      </div>
      {!isEditing && initialData.imageUrl && (
        <div className="relative aspect-video mt-2">
          <Image
            alt={initialData.title}
            src={initialData.imageUrl}
            fill
            sizes="100%"
            priority
            className="object-cover rounded-md"
          />
        </div>
      )}
      {!isEditing && !initialData.imageUrl && (
        <>
          <div className="h-60 flex items-center justify-center bg-slate-200 rounded-md">
            <ImageIcon className="w-12 h-12 text-slate-500" />
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            16x9 aspect ratio recommended
          </div>
        </>
      )}
      {isEditing && (
        <>
          <FileUpload
            previousImageUrl={initialData.imageUrl}
            recipeId={recipeId}
            methodId={methodId}
            acceptedFileTypes={["image/*"]}
            onChange={onSubmit}
          />
          <div className="text-xs text-muted-foreground mt-2">
            Upload this method&apos;s image
          </div>
        </>
      )}
    </div>
  );
};
