import React, { useState, useEffect } from "react";
import { toast } from "sonner";

import ImagePreview from "@/components/upload/image-preview";
import VideoPreview from "@/components/upload/video-preview";
import PdfPreview from "@/components/upload/pdf-preview";

interface FilePreviewListProps {
  previewUrls: string[];
}
const getFileTypeFromUrl = async (previewUrl: string) => {
  try {
    const blob = await fetch(previewUrl).then((r) => r.blob());
    const fileType = blob.type;
    if (fileType.startsWith("image/")) {
      return "image";
    } else if (fileType.startsWith("video/")) {
      return "video";
    } else if (fileType.startsWith("application/pdf")) {
      return "pdf";
    } else {
      return null;
    }
  } catch (error) {
    toast.error(`Error getting file type: ${error}`, {
      duration: 5000,
    });
    return null;
  }
};

const FilePreviewList = ({ previewUrls }: FilePreviewListProps) => {
  const [components, setComponents] = useState<(React.ReactNode | null)[]>([]);

  useEffect(() => {
    const fetchFileTypes = async () => {
      const componentsArray = await Promise.all(
        previewUrls.map(async (previewUrl, idx) => {
          const fileType = await getFileTypeFromUrl(previewUrl);
          if (fileType === "image") {
            return <ImagePreview key={idx} previewUrl={previewUrl} />;
          } else if (fileType === "video") {
            return <VideoPreview key={idx} previewUrl={previewUrl} />;
          } else if (fileType === "pdf") {
            return <PdfPreview key={idx} />;
          } else {
            return null;
          }
        })
      );
      setComponents(componentsArray);
    };

    fetchFileTypes();
  }, [previewUrls]);

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {components.map((component, idx) => (
        <div key={idx} className="relative w-32 h-32">
          {component}
        </div>
      ))}
    </div>
  );
};

export default FilePreviewList;
