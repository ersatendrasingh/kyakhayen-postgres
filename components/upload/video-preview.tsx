import { useEffect, useRef } from "react";

interface VideoPreviewProps {
  previewUrl: string;
}

const VideoPreview = ({ previewUrl }: VideoPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.src = previewUrl;
    }
  }, [previewUrl]);
  return (
    <div className="w-full h-auto">
      <video controls ref={videoRef} className="w-32 h-32" />
    </div>
  );
};

export default VideoPreview;
