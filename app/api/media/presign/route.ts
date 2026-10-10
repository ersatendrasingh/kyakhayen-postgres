import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { createMediaUpload } from "@/lib/media-storage";

const allowedContentTypes = new Set([
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
]);

type PresignRequest = {
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  profile?: boolean;
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

const sanitizeFileName = (fileName: string) =>
  fileName
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

export async function POST(req: Request) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const values = (await req.json()) as PresignRequest;
    const { fileName, fileSize, fileType } = values;

    if (
      !fileName ||
      !fileType ||
      !fileSize ||
      !allowedContentTypes.has(fileType)
    ) {
      return NextResponse.json("Unsupported media file.", { status: 400 });
    }

    let prefix: string | null = null;

    if (values.profile) {
      if (!fileType.startsWith("image/")) {
        return NextResponse.json("Profile picture must be an image.", {
          status: 400,
        });
      }
      prefix = `users/${user.id}`;
    } else {
      if (user.role !== "ADMIN") {
        return NextResponse.json("Unauthorized", { status: 401 });
      }

      prefix = values.library
        ? "media"
        : values.contentPipeline
        ? "content-pipeline/reels"
        : values.categoryId
        ? `categories/${values.categoryId}`
        : values.cookingMethodId
        ? `cookingMethods/${values.cookingMethodId}`
        : values.bodyTypeId
        ? `bodyTypes/${values.bodyTypeId}`
        : values.cuisineId
        ? `cuisines/${values.cuisineId}`
        : values.allergyId
        ? `allergies/${values.allergyId}`
        : values.mealTimeId
        ? `mealTimes/${values.mealTimeId}`
        : values.nutrientId
        ? `nutrients/${values.nutrientId}`
        : values.dietTypeId
        ? `dietTypes/${values.dietTypeId}`
        : values.recipeTypeId
        ? `recipeTypes/${values.recipeTypeId}`
        : values.ingredientId
        ? `ingredients/${values.ingredientId}`
        : values.ingredientCategoryId
        ? `ingredientCategories/${values.ingredientCategoryId}`
        : values.methodId && values.recipeId
        ? `recipes/${values.recipeId}/methods/${values.methodId}`
        : values.postId
        ? `articles/${values.postId}`
        : values.postCategoryId
        ? `articles/categories/${values.postCategoryId}`
        : values.recipeId
        ? `recipes/${values.recipeId}`
        : null;
    }

    if (!prefix) {
      return NextResponse.json("Media destination is required.", {
        status: 400,
      });
    }

    const safeName = sanitizeFileName(fileName) || "upload";
    const key = `${prefix}/${randomUUID()}-${safeName}`;
    const signedUpload = await createMediaUpload(key, fileType);

    return NextResponse.json(signedUpload, { status: 200 });
  } catch (error) {
    console.error("[MEDIA_PRESIGN]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
