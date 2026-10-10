"use client";

import { useState } from "react";
import { toast } from "sonner";
import axios, { AxiosProgressEvent } from "axios";

import { Progress } from "@/components/ui/progress";
import UploadDropZone from "@/components/upload/upload-dropzone";
import UploadButton from "@/components/upload/upload-button";
import { uploadMediaDirect } from "@/lib/upload-media-client";

interface FileUploadProps {
  previousImageUrl?: string | null;
  categoryId?: string | null;
  postCategoryId?: string | null;
  recipeId?: string | null;
  postId?: string | null;
  methodId?: string | null;
  cookingMethodId?: string | null;
  cuisineId?: string | null;
  allergyId?: string | null;
  mealTimeId?: string | null;
  nutrientId?: string | null;
  dietTypeId?: string | null;
  recipeTypeId?: string | null;
  acceptedFileTypes: string[];
  multiple?: boolean;
  onChange: (fileUrl: string) => Promise<boolean>;
}

const FileUpload = ({
  previousImageUrl,
  categoryId,
  postCategoryId,
  recipeId,
  postId,
  methodId,
  cookingMethodId,
  cuisineId,
  allergyId,
  mealTimeId,
  nutrientId,
  dietTypeId,
  recipeTypeId,
  acceptedFileTypes,
  multiple,
  onChange,
}: FileUploadProps) => {
  const [files, setFiles] = useState<File[] | null>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const updateProgressBar = (percent: number): void => {
    setProgress(+percent.toFixed(2));
  };
  const updatePrewiewUrls = (previewUrls: string[]) => {
    setPreviewUrls(previewUrls);
  };
  const updateFile = (files: File[]) => {
    setFiles(files);
  };
  const uploadFileWithProgressBar = async (
    e: React.MouseEvent<HTMLButtonElement>
  ): Promise<void> => {
    e.preventDefault();
    setIsUploading(true);

    if (!files || files.length === 0) {
      setIsUploading(false);
      return;
    }
    try {
      for (const file of files) {
        const publicUrl = await uploadMediaDirect(file, {
          categoryId,
          postCategoryId,
          recipeId,
          postId,
          methodId,
          cookingMethodId,
          cuisineId,
          allergyId,
          mealTimeId,
          nutrientId,
          dietTypeId,
          recipeTypeId,
        }, (progressEvent: AxiosProgressEvent) => {
            const { loaded, total } = progressEvent;
            if (total !== null && total !== undefined) {
              updateProgressBar(Math.floor((loaded * 100) / total));
            }
          });

        const isSaved = await onChange(publicUrl);
        if (isSaved && previousImageUrl) {
          try {
            await axios.delete("/api/media", {
              data: { url: previousImageUrl },
            });
          } catch {
            toast.warning("New media saved, but old file cleanup failed.", {
              duration: 5000,
            });
          }
        }
      }
      setIsUploading(false);
    } catch {
      setIsUploading(false);
      toast.error("Something went wrong while uploading file", {
        duration: 5000,
      });
    }
  };
  return (
    <div>
      <form className="w-full p-3 border border-gray-500 border-dashed rounded-md">
        <UploadDropZone
          updatePrewiewUrls={updatePrewiewUrls}
          multiple={multiple}
          acceptedFileTypes={acceptedFileTypes}
          updateFile={updateFile}
        />
        <div className="flex items-center justify-center mt-2">
          {progress > 0 && (
            <Progress value={progress} className="w-full bg-emerald-500" />
          )}
        </div>
        <div className="flex items-center mt-4  justify-center">
          <UploadButton
            previewUrls={previewUrls}
            onClick={uploadFileWithProgressBar}
            isUploading={isUploading}
          />
        </div>
      </form>
    </div>
  );
};

export default FileUpload;
