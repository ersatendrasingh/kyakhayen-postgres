import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CircleDashed } from "lucide-react";

interface UploadButtonProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  previewUrls: string[] | null;
  isUploading: boolean;
}

const UploadButton = ({
  onClick,
  previewUrls,
  isUploading,
}: UploadButtonProps) => {
  return (
    <div>
      <Button
        variant="destructive"
        onClick={onClick}
        disabled={!previewUrls?.length || isUploading}
        className={cn("", isUploading ? "bg-emerald-500 text-white" : "")}
      >
        {isUploading ? (
          <>
            <CircleDashed className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Upload"
        )}
      </Button>
    </div>
  );
};

export default UploadButton;
