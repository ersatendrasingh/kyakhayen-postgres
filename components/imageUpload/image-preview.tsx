"use client";
import Image from "next/image";

interface ImagePreviewProps {
  previewUrl: string;
}

const ImagePreview = ({ previewUrl }: ImagePreviewProps) => {
  return (
    <div className="flex items-center justify-center">
      <div className="relative aspect-video w-full h-80 mt-2">
        <Image
          alt="Image Preview"
          src={previewUrl}
          fill
          sizes="100%"
          priority
          className="object-cover rounded-md"
        />
      </div>
    </div>
  );
};

export default ImagePreview;
