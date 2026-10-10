import { v2 as cloudinary } from "cloudinary";

import { getMediaStorageSettings } from "@/lib/media-storage-settings";

type CloudinaryResourceType = "image" | "video" | "raw";

async function configuredCloudinary() {
  const settings = await getMediaStorageSettings();
  const { cloudName, apiKey, apiSecret, configured } = settings.cloudinary;
  if (!configured || !cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary credentials are not configured in Site Settings.");
  }
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  return { cloudName, apiKey, apiSecret };
}

export async function createSignedCloudinaryUpload(key: string) {
  const { cloudName, apiKey, apiSecret } = await configuredCloudinary();
  const publicId = key.replace(/\.[a-z0-9]+$/i, "");
  const timestamp = Math.floor(Date.now() / 1000);
  const signed = { invalidate: true, overwrite: true, public_id: publicId, timestamp };

  return {
    provider: "CLOUDINARY" as const,
    key: publicId,
    uploadUrl: `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/auto/upload`,
    fields: {
      api_key: apiKey,
      invalidate: "true",
      overwrite: "true",
      public_id: publicId,
      signature: cloudinary.utils.api_sign_request(signed, apiSecret),
      timestamp: String(timestamp),
    },
  };
}

export async function verifyCloudinaryAsset(
  publicId: string,
  resourceType: CloudinaryResourceType,
) {
  await configuredCloudinary();
  const resource = await cloudinary.api.resource(publicId, { resource_type: resourceType });
  return {
    publicId: resource.public_id as string,
    secureUrl: resource.secure_url as string,
    bytes: Number(resource.bytes),
    resourceType,
  };
}

export async function deleteCloudinaryAsset(
  publicId: string,
  resourceType: CloudinaryResourceType,
) {
  await configuredCloudinary();
  return cloudinary.uploader.destroy(publicId, { invalidate: true, resource_type: resourceType });
}

export async function deleteCloudinaryFolderIfConfigured(prefix: string) {
  const settings = await getMediaStorageSettings();
  if (!settings.cloudinary.configured) return;
  await configuredCloudinary();
  const normalized = prefix.endsWith("/") ? prefix : `${prefix}/`;
  await Promise.all(
    (["image", "video", "raw"] as const).map((resourceType) =>
      cloudinary.api.delete_resources_by_prefix(normalized, {
        invalidate: true,
        resource_type: resourceType,
      }),
    ),
  );
}

export async function pingCloudinary() {
  await configuredCloudinary();
  await cloudinary.api.ping();
}
