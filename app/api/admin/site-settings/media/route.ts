import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { pingCloudinary } from "@/lib/cloudinary-storage";
import {
  canEncryptSiteSettings,
  saveMediaStorageSettings,
  type MediaStorageProvider,
} from "@/lib/media-storage-settings";
import { getMediaStorageStatus } from "@/lib/media-storage";

async function requireAdmin() {
  const user = await currentUser();
  return Boolean(user && user.role === "ADMIN");
}

async function publicSettings() {
  const status = await getMediaStorageStatus();
  return {
    primaryProvider: status.primaryProvider,
    effectiveProvider: status.effectiveProvider,
    cloudinaryCloudName: status.cloudinary.cloudName || "",
    cloudinaryApiKey: status.cloudinary.apiKey || "",
    cloudinarySecretConfigured: Boolean(status.cloudinary.apiSecret),
    cloudinaryConfigured: status.cloudinary.configured,
    s3Configured: status.s3Configured,
    encryptionConfigured: canEncryptSiteSettings(),
  };
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json("Unauthorized", { status: 401 });
  return NextResponse.json(await publicSettings());
}

export async function PATCH(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json("Unauthorized", { status: 401 });
  const body = (await req.json()) as {
    primaryProvider?: MediaStorageProvider;
    cloudinaryCloudName?: string;
    cloudinaryApiKey?: string;
    cloudinaryApiSecret?: string;
  };
  if (body.primaryProvider !== "CLOUDINARY" && body.primaryProvider !== "S3") {
    return NextResponse.json("Choose a valid primary media provider.", { status: 400 });
  }
  if (body.cloudinaryApiSecret?.trim() && !canEncryptSiteSettings()) {
    return NextResponse.json("Set SITE_SETTINGS_ENCRYPTION_KEY before saving the Cloudinary secret.", { status: 400 });
  }
  await saveMediaStorageSettings({
    primaryProvider: body.primaryProvider,
    cloudinaryCloudName: body.cloudinaryCloudName || "",
    cloudinaryApiKey: body.cloudinaryApiKey || "",
    cloudinaryApiSecret: body.cloudinaryApiSecret,
  });
  return NextResponse.json(await publicSettings());
}

export async function POST() {
  if (!(await requireAdmin())) return NextResponse.json("Unauthorized", { status: 401 });
  try {
    await pingCloudinary();
    return NextResponse.json({ connected: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cloudinary connection failed.";
    return NextResponse.json(message, { status: 400 });
  }
}
