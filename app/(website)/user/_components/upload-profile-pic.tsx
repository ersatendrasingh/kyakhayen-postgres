import axios from "axios";
import { CameraIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
interface UploadProfilePicProps {
  setImagePreview: React.Dispatch<React.SetStateAction<string | null>>;
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
}

const UploadProfilePic = ({
  setImagePreview,
  setIsUploading,
}: UploadProfilePicProps) => {
  const router = useRouter();
  const { update } = useSession();
  async function resizeAndPreviewImage(
    file: File,
    width: number,
    height: number
  ): Promise<Blob> {
    return new Promise<Blob>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };

      reader.onerror = (error) => {
        reject(error);
      };

      reader.readAsDataURL(file);

      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context is not supported"));
          return;
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to create blob"));
              return;
            }
            resolve(blob);
          },
          "image/jpeg",
          1
        ); // Change format and quality as needed
      };
      img.onerror = (error) => {
        reject(error);
      };
    });
  }
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsUploading(true);
    const fileInput = e.target;

    if (!fileInput.files) {
      setIsUploading(false);
      toast.error("No file was chosen", {
        duration: 5000,
      });
      return;
    }
    const file = fileInput.files[0];

    if (!file.type.startsWith("image")) {
      setIsUploading(false);
      toast.error(`Selected File is invalid`, {
        duration: 5000,
      });
      return;
    }
    const resizedFile = await resizeAndPreviewImage(file, 200, 200);
    try {
      const { data } = await axios.post<{
        provider: "CLOUDINARY" | "S3";
        uploadUrl: string;
        publicUrl?: string;
        fields?: Record<string, string>;
      }>("/api/media/presign", {
        fileName: "profile.jpg",
        fileSize: resizedFile.size,
        fileType: "image/jpeg",
        profile: true,
      });

      let imageUrl = data.publicUrl || "";
      if (data.provider === "CLOUDINARY") {
        const form = new FormData();
        Object.entries(data.fields || {}).forEach(([name, value]) => form.append(name, value));
        form.append("file", resizedFile, "profile.jpg");
        const { data: uploaded } = await axios.post<{ secure_url: string }>(data.uploadUrl, form);
        imageUrl = uploaded.secure_url;
      } else {
        await axios.put(data.uploadUrl, resizedFile, {
          headers: {
            "Cache-Control": "public, max-age=31536000, immutable",
            "Content-Type": "image/jpeg",
          },
        });
      }

      const response = await axios.post("/api/user/update-profile-pic", {
        imageUrl,
      });
      update();
      if (response.status !== 200) {
        toast.error("Something went wrong while uploading file", {
          duration: 5000,
        });
        return;
      } else if (response.status === 200) {
        router.refresh();
        setIsUploading(false);
        toast.success("Profile picture updated successfully", {
          duration: 5000,
        });
      }
    } catch {
      setIsUploading(false);
      toast.error("Something went wrong while uploading file", {
        duration: 5000,
      });
    }
  };
  return (
    <div className="absolute -bottom-2 -right-2">
      <label
        htmlFor="image-upload"
        title="Change profile photo"
        className="flex size-9 cursor-pointer items-center justify-center rounded-full border-2 border-[#fffdf8] bg-[#bd382a] text-white shadow-md transition hover:bg-[#a92f23] dark:border-[#10231c]"
      >
          <input
            id="image-upload"
            type="file"
            className="hidden"
            onChange={handleImageChange}
          />
          <CameraIcon className="size-4" />
      </label>
    </div>
  );
};

export default UploadProfilePic;
