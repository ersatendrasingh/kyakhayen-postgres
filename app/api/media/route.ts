import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteMediaAsset } from "@/lib/media-storage";
import { verifyCloudinaryAsset } from "@/lib/cloudinary-storage";
import {
  getPublicMediaUrl,
  getStorageKeyFromUrl,
} from "@/lib/s3utils";

type RegisterMediaBody = {
  name?: string;
  key?: string;
  mimeType?: string;
  fileSize?: number;
  altText?: string | null;
  provider?: "CLOUDINARY" | "S3";
  url?: string;
  resourceType?: "image" | "video" | "raw";
};

type UpdateMediaBody = {
  id?: string;
  altText?: string | null;
};

const getMediaType = (mimeType: string) => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "file";
};

const defaultAltText = (fileName: string) =>
  fileName
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ")
    .trim();

const serializeMedia = <T extends { fileSize: bigint }>(media: T) => ({
  ...media,
  fileSize: Number(media.fileSize),
});

const permittedMediaPrefixes = [
  "media/",
  "categories/",
  "cookingMethods/",
  "bodyTypes/",
  "cuisines/",
  "allergies/",
  "mealTimes/",
  "nutrients/",
  "dietTypes/",
  "recipeTypes/",
  "ingredients/",
  "ingredientCategories/",
  "recipes/",
  "articles/",
  "users/",
  "content-pipeline/",
];

const validUploadedKey = (key: string) =>
  permittedMediaPrefixes.some((prefix) => key.startsWith(prefix)) &&
  !key.includes("..");

async function isReferenced(url: string) {
  const [
    recipes,
    steps,
    methodVideos,
    categories,
    difficulties,
    cookingMethods,
    bodyTypes,
    cuisines,
    allergies,
    mealTimes,
    nutrients,
    dietTypes,
    recipeTypes,
    ingredients,
    ingredientCategories,
    genders,
    posts,
    postCategories,
    users,
  ] = await Promise.all([
    db.recipes.count({ where: { imageUrl: url } }),
    db.recipeMethods.count({ where: { imageUrl: url } }),
    db.recipeMethods.count({ where: { videoUrl: url } }),
    db.recipeCategories.count({ where: { imageUrl: url } }),
    db.recipeDifficulty.count({ where: { imageUrl: url } }),
    db.cookingMethods.count({ where: { imageUrl: url } }),
    db.bodyTypes.count({ where: { imageUrl: url } }),
    db.cuisines.count({ where: { imageUrl: url } }),
    db.allergies.count({ where: { imageUrl: url } }),
    db.mealTimes.count({ where: { imageUrl: url } }),
    db.nutrient.count({ where: { imageUrl: url } }),
    db.dietTypes.count({ where: { imageUrl: url } }),
    db.recipeTypes.count({ where: { imageUrl: url } }),
    db.ingredients.count({ where: { imageUrl: url } }),
    db.ingredientCategories.count({ where: { imageUrl: url } }),
    db.gender.count({ where: { imageUrl: url } }),
    db.post.count({ where: { imageUrl: url } }),
    db.category.count({ where: { imageUrl: url } }),
    db.user.count({ where: { image: url } }),
  ]);

  return (
    recipes +
      steps +
      methodVideos +
      categories +
      difficulties +
      cookingMethods +
      bodyTypes +
      cuisines +
      allergies +
      mealTimes +
      nutrients +
      dietTypes +
      recipeTypes +
      ingredients +
      ingredientCategories +
      genders +
      posts +
      postCategories +
      users >
    0
  );
}

export async function GET() {
  try {
    const user = await currentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const media = await db.mediaAsset.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(media.map(serializeMedia));
  } catch (error) {
    console.error("[MEDIA_LIST]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await currentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const body = (await req.json()) as RegisterMediaBody;
    const name = body.name?.trim();
    const key = body.key?.trim().replace(/^\/+/, "");
    const mimeType = body.mimeType?.trim();
    let fileSize = Number(body.fileSize);
    const provider = body.provider === "CLOUDINARY" ? "CLOUDINARY" : "S3";

    if (
      !name ||
      !key ||
      !validUploadedKey(key) ||
      !mimeType ||
      !Number.isFinite(fileSize) ||
      fileSize < 1
    ) {
      return NextResponse.json("Complete media details are required.", { status: 400 });
    }

    let url = provider === "S3" ? getPublicMediaUrl(key) : "";
    if (provider === "CLOUDINARY") {
      if (!body.resourceType) {
        return NextResponse.json("Cloudinary resource type is required.", { status: 400 });
      }
      const verified = await verifyCloudinaryAsset(key, body.resourceType);
      url = verified.secureUrl;
      fileSize = verified.bytes;
      if (body.url && body.url !== verified.secureUrl) {
        return NextResponse.json("Cloudinary media URL could not be verified.", { status: 400 });
      }
    }

    const media = await db.mediaAsset.upsert({
      where: { url },
      create: {
        name,
        url,
        storageKey: key,
        storageProvider: provider,
        mimeType,
        mediaType: getMediaType(mimeType),
        fileSize: BigInt(fileSize),
        altText:
          body.altText?.trim() ||
          (getMediaType(mimeType) === "image" ? defaultAltText(name) : null),
      },
      update: {
        name,
        storageProvider: provider,
        mimeType,
        mediaType: getMediaType(mimeType),
        fileSize: BigInt(fileSize),
        altText:
          body.altText?.trim() ||
          (getMediaType(mimeType) === "image" ? defaultAltText(name) : undefined),
      },
    });

    return NextResponse.json(serializeMedia(media), { status: 201 });
  } catch (error) {
    console.error("[MEDIA_REGISTER]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await currentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const body = (await req.json()) as UpdateMediaBody;
    if (!body.id) {
      return NextResponse.json("Media id is required.", { status: 400 });
    }

    const media = await db.mediaAsset.update({
      where: { id: body.id },
      data: { altText: body.altText?.trim() || null },
    });

    return NextResponse.json(serializeMedia(media));
  } catch (error) {
    console.error("[MEDIA_UPDATE]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await currentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const { id, url } = (await req.json()) as { id?: string; url?: string };
    const asset = id
      ? await db.mediaAsset.findUnique({ where: { id } })
      : url
        ? await db.mediaAsset.findUnique({ where: { url } })
        : null;
    const mediaUrl = asset?.url ?? url;

    if (!mediaUrl) {
      return NextResponse.json("Media URL is required.", { status: 400 });
    }

    if (await isReferenced(mediaUrl)) {
      return NextResponse.json(
        "This media is currently used by content. Replace it there before deleting.",
        { status: 409 }
      );
    }

    const provider = asset?.storageProvider === "CLOUDINARY" ? "CLOUDINARY" : "S3";
    await deleteMediaAsset({
      provider,
      key: asset?.storageKey ?? getStorageKeyFromUrl(mediaUrl),
      mediaType: asset?.mediaType ?? "image",
    });
    if (asset) {
      await db.mediaAsset.delete({ where: { id: asset.id } });
    }

    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (error) {
    console.error("[MEDIA_DELETE]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
