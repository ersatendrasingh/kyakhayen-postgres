import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import {
  abortMultipartMediaUpload,
  completeMultipartMediaUpload,
  createMultipartMediaUpload,
  createPresignedMediaPartUpload,
} from "@/lib/s3utils";

const supportedVideoTypes = new Set(["video/mp4", "video/webm"]);

type MultipartRequest = {
  action?: "create" | "sign-part" | "complete" | "abort";
  fileName?: string;
  fileType?: string;
  library?: boolean;
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
  key?: string;
  uploadId?: string;
  partNumber?: number;
  parts?: Array<{ ETag: string; PartNumber: number }>;
};

const sanitizeFileName = (fileName: string) =>
  fileName
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

const uploadPrefixes = [
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
  "content-pipeline/",
];

const validAdminKey = (key: string | undefined) =>
  Boolean(key && uploadPrefixes.some((prefix) => key.startsWith(prefix)) && !key.includes(".."));

const normalizeVideoType = (fileType: string | undefined) =>
  fileType?.split(";")[0]?.trim().toLowerCase() ?? "";

const resolvePrefix = (values: MultipartRequest) =>
  values.library
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

export async function POST(req: Request) {
  try {
    const user = await currentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const values = (await req.json()) as MultipartRequest;

    if (values.action === "create") {
      const fileType = normalizeVideoType(values.fileType);
      if (
        !values.fileName ||
        !supportedVideoTypes.has(fileType)
      ) {
        return NextResponse.json("Multipart video upload is not supported for this request.", {
          status: 400,
        });
      }

      const prefix = resolvePrefix(values);
      if (!prefix) {
        return NextResponse.json("Media destination is required.", { status: 400 });
      }

      const safeName = sanitizeFileName(values.fileName) || "video";
      const key = `${prefix}/${randomUUID()}-${safeName}`;

      return NextResponse.json(
        await createMultipartMediaUpload(key, fileType),
        { status: 201 }
      );
    }

    if (!values.key || !values.uploadId || !validAdminKey(values.key)) {
      return NextResponse.json("Multipart upload session is invalid.", { status: 400 });
    }

    if (values.action === "sign-part") {
      if (
        !Number.isInteger(values.partNumber) ||
        Number(values.partNumber) < 1 ||
        Number(values.partNumber) > 10000
      ) {
        return NextResponse.json("Multipart part number is invalid.", { status: 400 });
      }

      return NextResponse.json({
        uploadUrl: await createPresignedMediaPartUpload(
          values.key,
          values.uploadId,
          Number(values.partNumber)
        ),
      });
    }

    if (values.action === "complete") {
      if (!values.parts?.length) {
        return NextResponse.json("Multipart parts are required.", { status: 400 });
      }

      return NextResponse.json(
        await completeMultipartMediaUpload(values.key, values.uploadId, values.parts),
        { status: 200 }
      );
    }

    if (values.action === "abort") {
      await abortMultipartMediaUpload(values.key, values.uploadId);
      return NextResponse.json({ aborted: true });
    }

    return NextResponse.json("Multipart action is required.", { status: 400 });
  } catch (error) {
    console.error("[MEDIA_MULTIPART]", error);
    return NextResponse.json("Unable to process multipart upload.", { status: 500 });
  }
}
