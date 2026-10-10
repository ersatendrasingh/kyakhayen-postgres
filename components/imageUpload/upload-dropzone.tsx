"use client";
import { useState } from "react";
import { toast } from "sonner";

import ImagePreview from "./image-preview";

interface UploadDropZoneProps {
  acceptedFileTypes: string;
  onImageUpload: (imageUrl: File) => void;
}

const UploadDropZone = ({
  acceptedFileTypes,
  onImageUpload,
}: UploadDropZoneProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const onFileUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileInput = e.target;

    if (!fileInput.files) {
      toast.error("No file was chosen", {
        duration: 5000,
      });
      return;
    }
    const file = fileInput.files[0];

    if (!file.type.startsWith("image")) {
      toast.error(`Selected File is invalid`, {
        duration: 5000,
      });
      return;
    }
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
      onImageUpload(file);
    }
  };

  return (
    <div className="w-full p-3 border border-gray-500 border-dashed rounded-md">
      {previewUrl ? (
        <ImagePreview previewUrl={previewUrl} />
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
              accept={acceptedFileTypes}
              onChange={onFileUploadChange}
            />
          </label>
        </div>
      )}
    </div>
  );
};

export default UploadDropZone;
