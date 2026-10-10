"use client";
import Image from "next/image";

interface ImagePreviewProps {
  previewUrl: string;
}
const ImagePreview = ({ previewUrl }: ImagePreviewProps) => {
  return (
    <Image
      alt="file uploader preview"
      src={previewUrl}
      sizes="100%"
      fill
      priority
      className="object-cover rounded-md"
    />
  );
};

export default ImagePreview;
