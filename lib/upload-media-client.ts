import axios, { AxiosError, AxiosProgressEvent } from "axios";

import type { MediaAsset } from "@/types/media";

export type MediaDestination = {
  categoryId?: string | null;
  postCategoryId?: string | null;
  recipeId?: string | null;
  postId?: string | null;
  methodId?: string | null;
  cookingMethodId?: string | null;
  bodyTypeId?: string | null;
  cuisineId?: string | null;
  allergyId?: string | null;
  mealTimeId?: string | null;
  nutrientId?: string | null;
  dietTypeId?: string | null;
  recipeTypeId?: string | null;
  ingredientId?: string | null;
  ingredientCategoryId?: string | null;
  contentPipeline?: boolean;
  library?: boolean;
};

const uploadErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    const message = error.response?.data;
    if (typeof message === "string") return message;
    if (error.code === "ERR_NETWORK") {
      return "Direct storage upload was blocked. Check the active media provider settings and CORS permissions.";
    }
  }

  return error instanceof Error ? error.message : "Unable to upload media.";
};

const registerMedia = async (
  file: File,
  upload: {
    publicUrl: string;
    key: string;
    provider?: "CLOUDINARY" | "S3";
    resourceType?: "image" | "video" | "raw";
  },
) => {
  const { data } = await axios.post<MediaAsset>("/api/media", {
    name: file.name,
    key: upload.key,
    mimeType: file.type,
    fileSize: file.size,
    provider: upload.provider,
    url: upload.publicUrl,
    resourceType: upload.resourceType,
  });

  return data;
};

const uploadVideoMultipart = async (
  file: File,
  destination: MediaDestination,
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void
) => {
  const partSize = 10 * 1024 * 1024;
  const partCount = Math.ceil(file.size / partSize);
  const uploadedBytes = new Map<number, number>();
  let session: { uploadId: string; key: string; publicUrl: string } | undefined;

  try {
    const { data } = await axios.post<typeof session>("/api/media/multipart", {
      action: "create",
      fileName: file.name,
      fileType: file.type,
      ...destination,
    });
    session = data;

    if (!session) {
      throw new Error("Unable to start multipart video upload.");
    }

    const parts: Array<{ ETag: string; PartNumber: number }> = [];
    const numbers = Array.from({ length: partCount }, (_, index) => index + 1);

    for (let index = 0; index < numbers.length; index += 3) {
      const batch = numbers.slice(index, index + 3);
      const uploaded = await Promise.all(
        batch.map(async (partNumber) => {
          const start = (partNumber - 1) * partSize;
          const end = Math.min(start + partSize, file.size);
          const { data: signedPart } = await axios.post<{ uploadUrl: string }>(
            "/api/media/multipart",
            {
              action: "sign-part",
              key: session?.key,
              uploadId: session?.uploadId,
              partNumber,
            }
          );
          const response = await axios.put(signedPart.uploadUrl, file.slice(start, end), {
            onUploadProgress: (event) => {
              uploadedBytes.set(partNumber, event.loaded);
              const loaded = Array.from(uploadedBytes.values()).reduce(
                (total, bytes) => total + bytes,
                0
              );
              onUploadProgress?.({ loaded, total: file.size } as AxiosProgressEvent);
            },
          });
          const etag = response.headers.etag as string | undefined;
          if (!etag) {
            throw new Error("S3 upload response is missing ETag. Expose ETag in bucket CORS.");
          }
          return { ETag: etag, PartNumber: partNumber };
        })
      );
      parts.push(...uploaded);
    }

    const { data: completed } = await axios.post<{ publicUrl: string; key: string }>(
      "/api/media/multipart",
      {
        action: "complete",
        key: session.key,
        uploadId: session.uploadId,
        parts: parts.sort((left, right) => left.PartNumber - right.PartNumber),
      }
    );

    return registerMedia(file, completed);
  } catch (error) {
    if (session) {
      await axios
        .post("/api/media/multipart", {
          action: "abort",
          key: session.key,
          uploadId: session.uploadId,
        })
        .catch(() => undefined);
    }
    throw error;
  }
};

export const uploadMediaAsset = async (
  file: File,
  destination: MediaDestination = { library: true },
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void
) => {
  try {
    const { data } = await axios.post<{
      provider: "CLOUDINARY" | "S3";
      uploadUrl: string;
      publicUrl?: string;
      key: string;
      fields?: Record<string, string>;
    }>("/api/media/presign", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      ...destination,
    });

    if (data.provider === "CLOUDINARY") {
      const form = new FormData();
      Object.entries(data.fields || {}).forEach(([name, value]) => form.append(name, value));
      form.append("file", file);
      const { data: uploaded } = await axios.post<{
        public_id: string;
        secure_url: string;
        resource_type: "image" | "video" | "raw";
      }>(data.uploadUrl, form, { onUploadProgress });

      return await registerMedia(file, {
        provider: "CLOUDINARY",
        key: uploaded.public_id,
        publicUrl: uploaded.secure_url,
        resourceType: uploaded.resource_type,
      });
    }

    if (file.type.startsWith("video/")) {
      return await uploadVideoMultipart(file, destination, onUploadProgress);
    }

    await axios.put(data.uploadUrl, file, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": file.type,
      },
      onUploadProgress,
    });

    return await registerMedia(file, {
      provider: "S3",
      key: data.key,
      publicUrl: data.publicUrl || "",
    });
  } catch (error) {
    throw new Error(uploadErrorMessage(error));
  }
};

export const uploadMediaDirect = async (
  file: File,
  destination: MediaDestination,
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void
) => (await uploadMediaAsset(file, destination, onUploadProgress)).url;
