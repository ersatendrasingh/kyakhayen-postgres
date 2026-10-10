import { NextResponse } from "next/server";

import {
  deleteImageFromS3,
  getStorageKeyFromUrl,
  getVerifiedPublicMediaKey,
} from "@/lib/s3utils";
import { deleteCloudinaryAsset } from "@/lib/cloudinary-storage";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { imageUrl } = (await req.json()) as { imageUrl?: string };

    if (!imageUrl) {
      return NextResponse.json("Profile image URL is required.", {
        status: 400,
      });
    }

    const newImageKey = getVerifiedPublicMediaKey(imageUrl);
    if (!newImageKey.startsWith(`users/${user.id}/`)) {
      return NextResponse.json("Forbidden", { status: 403 });
    }

    const currentProfile = await db.user.findUnique({
      where: { id: user.id },
      select: { image: true },
    });

    await db.user.update({
      where: {
        id: user.id,
      },
      data: {
        image: imageUrl,
      },
    });

    if (currentProfile?.image && currentProfile.image !== imageUrl) {
      const oldKey = getStorageKeyFromUrl(currentProfile.image);
      if (new URL(currentProfile.image).hostname === "res.cloudinary.com") {
        await deleteCloudinaryAsset(getVerifiedPublicMediaKey(currentProfile.image), "image");
      } else {
        await deleteImageFromS3(oldKey);
      }
    }

    return NextResponse.json({ imageUrl }, { status: 200 });
  } catch (error) {
    console.log("[UPDATE_PROFILE_PIC]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
