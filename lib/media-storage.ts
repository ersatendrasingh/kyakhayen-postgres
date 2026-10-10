import { createSignedCloudinaryUpload, deleteCloudinaryAsset } from "@/lib/cloudinary-storage";
import { getMediaStorageSettings, type MediaStorageProvider } from "@/lib/media-storage-settings";
import {
  createPresignedMediaUpload,
  deleteImageFromS3,
  isS3MediaConfigured,
} from "@/lib/s3utils";

export async function getMediaStorageStatus() {
  const settings = await getMediaStorageSettings();
  const s3Configured = isS3MediaConfigured();
  const effectiveProvider =
    settings.primaryProvider === "CLOUDINARY" && settings.cloudinary.configured
      ? "CLOUDINARY"
      : settings.primaryProvider === "S3" && s3Configured
        ? "S3"
        : settings.cloudinary.configured
          ? "CLOUDINARY"
          : s3Configured
            ? "S3"
            : null;

  return { ...settings, s3Configured, effectiveProvider };
}

export async function createMediaUpload(key: string, contentType: string) {
  const status = await getMediaStorageStatus();
  if (status.effectiveProvider === "CLOUDINARY") {
    return createSignedCloudinaryUpload(key);
  }
  if (status.effectiveProvider === "S3") {
    return { provider: "S3" as const, ...(await createPresignedMediaUpload(key, contentType)) };
  }
  throw new Error("Configure Cloudinary or S3 media storage in Site Settings.");
}

export async function deleteMediaAsset(input: {
  provider: MediaStorageProvider;
  key: string;
  mediaType: string;
}) {
  if (input.provider === "CLOUDINARY") {
    const resourceType = input.mediaType === "video" ? "video" : input.mediaType === "image" ? "image" : "raw";
    return deleteCloudinaryAsset(input.key, resourceType);
  }
  return deleteImageFromS3(input.key);
}
