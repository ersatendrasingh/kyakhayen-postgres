"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, PlusCircleIcon, Video } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import FileUpload from "@/components/upload/file-upload";

import { RecipeMethods } from "@prisma/client";
import VideoPlayer from "@/components/video-player";

interface MethodVideoFormProps {
  initialData: RecipeMethods;
  recipeId: string;
  methodId: string;
}

export const MethodVideoForm = ({
  initialData,
  recipeId,
  methodId,
}: MethodVideoFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const toggleEdit = () => setIsEditing((current) => !current);

  const router = useRouter();

  const onSubmit = async (fileUrl: string) => {
    const videoUrl = { videoUrl: fileUrl.toString() };
    try {
      await axios.patch(
        `/api/recipes/${recipeId}/methods/${methodId}`,
        videoUrl
      );
      toast.success("Method video updated successfully", {
        duration: 5000,
      });
      toggleEdit();
      router.refresh();
      return true;
    } catch {
      toast.error("Something went wrong while updating method video", {
        duration: 5000,
      });
      return false;
    }
  };

  return (
    <div className="mt-6 border rounded-md p-4 bg-slate-100">
      <div className="flex items-center justify-between font-medium">
        Method Video
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing && <>Cancel</>}
          {!isEditing && !initialData.videoUrl && (
            <>
              <PlusCircleIcon className="w-6 h-6 pr-2" />
              Add a video
            </>
          )}
          {!isEditing && initialData.videoUrl && (
            <>
              <Pencil className="w-6 h-6 pr-2" />
              Edit video
            </>
          )}
        </Button>
      </div>
      {!isEditing && initialData.videoUrl && (
        <div className="relative aspect-video mt-2">
          <VideoPlayer videoUrl={initialData.videoUrl} />
        </div>
      )}
      {!isEditing && !initialData.videoUrl && (
        <>
          <div className="h-60 flex items-center justify-center bg-slate-200 rounded-md">
            <Video className="w-12 h-12 text-slate-500" />
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Videos can take a few minutes to ptocess and upload. Please refresh
            the page if you don&apos;t see the video
          </div>
        </>
      )}
      {isEditing && (
        <>
          <FileUpload
            previousImageUrl={initialData.videoUrl}
            recipeId={recipeId}
            methodId={methodId}
            acceptedFileTypes={["video/mp4"]}
            onChange={onSubmit}
          />
          <div className="text-xs text-muted-foreground mt-2">
            Upload this method&apos;s video
          </div>
        </>
      )}
    </div>
  );
};
