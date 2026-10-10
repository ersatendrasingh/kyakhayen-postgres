import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { db } from "@/lib/db";

export type MediaStorageProvider = "CLOUDINARY" | "S3";

function encryptionSecret() {
  return process.env.SITE_SETTINGS_ENCRYPTION_KEY || process.env.SOCIAL_TOKEN_ENCRYPTION_KEY || "";
}

function encryptionKey() {
  const secret = encryptionSecret();
  if (!secret) {
    throw new Error("Set SITE_SETTINGS_ENCRYPTION_KEY before saving Cloudinary credentials.");
  }
  return createHash("sha256").update(secret).digest();
}

function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${ciphertext.toString("base64url")}`;
}

function decryptSecret(value: string | null | undefined) {
  if (!value) return null;
  const [version, ivValue, tagValue, ciphertextValue] = value.split(":");
  if (version !== "v1" || !ivValue || !tagValue || !ciphertextValue) {
    throw new Error("Saved Cloudinary secret is not in a supported format.");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivValue, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export async function getMediaStorageSettings() {
  const row = await db.siteMediaSetting.findUnique({ where: { id: "media" } });
  const primaryProvider =
    row?.primaryProvider === "S3" ? ("S3" as const) : ("CLOUDINARY" as const);
  const cloudName = row?.cloudinaryCloudName || process.env.CLOUDINARY_CLOUD_NAME || null;
  const apiKey = row?.cloudinaryApiKey || process.env.CLOUDINARY_API_KEY || null;
  const apiSecret = row?.cloudinaryApiSecretCiphertext
    ? decryptSecret(row.cloudinaryApiSecretCiphertext)
    : process.env.CLOUDINARY_API_SECRET || null;

  return {
    primaryProvider,
    cloudinary: {
      cloudName,
      apiKey,
      apiSecret,
      configured: Boolean(cloudName && apiKey && apiSecret),
      secretStored: Boolean(row?.cloudinaryApiSecretCiphertext),
    },
  };
}

export async function saveMediaStorageSettings(input: {
  primaryProvider: MediaStorageProvider;
  cloudinaryCloudName: string;
  cloudinaryApiKey: string;
  cloudinaryApiSecret?: string;
}) {
  const current = await db.siteMediaSetting.findUnique({ where: { id: "media" } });
  const suppliedSecret = input.cloudinaryApiSecret?.trim();

  return db.siteMediaSetting.upsert({
    where: { id: "media" },
    create: {
      id: "media",
      primaryProvider: input.primaryProvider,
      cloudinaryCloudName: input.cloudinaryCloudName.trim() || null,
      cloudinaryApiKey: input.cloudinaryApiKey.trim() || null,
      cloudinaryApiSecretCiphertext: suppliedSecret ? encryptSecret(suppliedSecret) : null,
    },
    update: {
      primaryProvider: input.primaryProvider,
      cloudinaryCloudName: input.cloudinaryCloudName.trim() || null,
      cloudinaryApiKey: input.cloudinaryApiKey.trim() || null,
      cloudinaryApiSecretCiphertext: suppliedSecret
        ? encryptSecret(suppliedSecret)
        : current?.cloudinaryApiSecretCiphertext,
    },
  });
}

export function canEncryptSiteSettings() {
  return Boolean(encryptionSecret());
}
