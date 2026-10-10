import dynamic from "next/dynamic";
import type { MouseEvent } from "react";

interface VideoPlayerProps {
  videoUrl: string;
}

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

const VideoPlayer = ({ videoUrl }: VideoPlayerProps) => {
  return (
    <div className="w-full h-full rounded-md">
      <ReactPlayer
        url={videoUrl}
        config={{
          file: {
            attributes: {
              controlsList: "nodownload",
              onContextMenu: (event: MouseEvent) => event.preventDefault(),
            },
          },
        }}
        width="100%"
        height="100%"
        controls={true}
        light={false}
        pip={true}
      />
    </div>
  );
};

export default VideoPlayer;
