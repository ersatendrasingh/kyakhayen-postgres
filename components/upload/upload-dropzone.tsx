"use client";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import FilePreviewList from "@/components/upload/file-preview-list";

interface UploadDropZoneProps {
  updatePrewiewUrls: (previewUrl: string[]) => void;
  multiple?: boolean;
  acceptedFileTypes: string[];
  updateFile: (file: File[]) => void;
}

const UploadDropZone = ({
  updatePrewiewUrls,
  updateFile,
  multiple,
  acceptedFileTypes,
}: UploadDropZoneProps) => {
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const onFileUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileInput = e.target;

    if (!fileInput.files) {
      toast.error("No file was chosen", {
        duration: 5000,
      });
      return;
    }

    if (!fileInput.files || fileInput.files.length === 0) {
      toast.error("Files list is empty", {
        duration: 5000,
      });
      return;
    }
    const validFiles: File[] = [];
    for (let i = 0; i < fileInput.files.length; i++) {
      const file = fileInput.files[i];

      if (
        !file.type.startsWith("image") &&
        !file.type.startsWith("video") &&
        file.type !== "application/pdf"
      ) {
        toast.error(`File with idx: ${i} is invalid`, {
          duration: 5000,
        });
        continue;
      }
      validFiles.push(file);
    }

    if (!validFiles.length) {
      toast.error("No valid files were chosen", {
        duration: 5000,
      });
      return;
    }

    setPreviewUrls(
      validFiles.map((validFile) => URL.createObjectURL(validFile))
    );
    updatePrewiewUrls(
      validFiles.map((validFile) => URL.createObjectURL(validFile))
    );
    updateFile(validFiles);
  };

  return (
    <div>
      {previewUrls.length > 0 ? (
        <>
          <div className="flex justify-end">
            <Button
              onClick={() => setPreviewUrls([])}
              variant="ghost"
              size="sm"
              className="text-right"
            >
              Clear Previews
            </Button>
          </div>
          <div>
            <FilePreviewList previewUrls={previewUrls} />
          </div>
        </>
      ) : (
        <div className="mt-2 aspect-video">
          <label className="flex flex-col items-center justify-center h-full py-3 transition-colors duration-150 cursor-pointer hover:text-gray-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-30 h-30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
              />
            </svg>
            <strong className="text-md font-medium">Select a file</strong>
            <input
              className="block w-0 h-0"
              name="file"
              type="file"
              accept={acceptedFileTypes.join(",")}
              onChange={onFileUploadChange}
              multiple={multiple}
            />
          </label>
        </div>
      )}
    </div>
  );
};

export default UploadDropZone;
