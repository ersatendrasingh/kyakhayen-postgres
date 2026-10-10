import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { deleteCloudinaryFolderIfConfigured } from "@/lib/cloudinary-storage";

export const isS3MediaConfigured = () =>
  Boolean(
    process.env.AWS_MEDIA_BUCKET_NAME &&
      process.env.AWS_REGION &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY,
  );

const getMediaBucket = () => {
  const bucket = process.env.AWS_MEDIA_BUCKET_NAME;

  if (!bucket) {
    throw new Error("AWS media bucket is not configured.");
  }

  return bucket;
};

const getS3Client = () => {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error("AWS S3 credentials are not configured.");
  }

  return new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
};

export const getPublicMediaUrl = (key: string) => {
  const mediaUrl = process.env.NEXT_PUBLIC_MEDIA_URL?.replace(/\/+$/, "");

  if (!mediaUrl) {
    throw new Error("Public media delivery URL is not configured.");
  }

  return `${mediaUrl}/${key.replace(/^\/+/, "")}`;
};

export const getStorageKeyFromUrl = (urlOrKey: string) => {
  if (!urlOrKey) {
    throw new Error("A media URL or object key is required.");
  }

  try {
    return decodeURIComponent(new URL(urlOrKey).pathname.replace(/^\/+/, ""));
  } catch {
    return urlOrKey.replace(/^\/+/, "");
  }
};

export const getVerifiedPublicMediaKey = (url: string) => {
  const parsedUrl = new URL(url);
  if (parsedUrl.hostname === "res.cloudinary.com") {
    const parts = decodeURIComponent(parsedUrl.pathname).split("/").filter(Boolean);
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex < 2) throw new Error("Invalid Cloudinary media URL.");
    const publicIdParts = parts.slice(uploadIndex + 1);
    if (/^v\d+$/.test(publicIdParts[0] || "")) publicIdParts.shift();
    const publicId = publicIdParts.join("/").replace(/\.[a-z0-9]+$/i, "");
    if (!publicId || publicId.includes("..")) throw new Error("Invalid Cloudinary public id.");
    return publicId;
  }

  const mediaBaseUrl = process.env.NEXT_PUBLIC_MEDIA_URL;

  if (!mediaBaseUrl) {
    throw new Error("Public media delivery URL is not configured.");
  }

  const mediaBase = new URL(mediaBaseUrl);
  const mediaObjectUrl = new URL(url);
  const basePath = mediaBase.pathname.replace(/\/+$/, "");

  if (
    mediaObjectUrl.origin !== mediaBase.origin ||
    !mediaObjectUrl.pathname.startsWith(`${basePath}/`)
  ) {
    throw new Error("Media URL does not belong to configured delivery domain.");
  }

  return decodeURIComponent(
    mediaObjectUrl.pathname.slice(`${basePath}/`.length)
  );
};

export const createPresignedMediaUpload = async (
  key: string,
  contentType: string
) => {
  const command = new PutObjectCommand({
    Bucket: getMediaBucket(),
    Key: key,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  });

  return {
    key,
    publicUrl: getPublicMediaUrl(key),
    uploadUrl: await getSignedUrl(getS3Client(), command, { expiresIn: 300 }),
  };
};

export const createMultipartMediaUpload = async (
  key: string,
  contentType: string
) => {
  const upload = await getS3Client().send(
    new CreateMultipartUploadCommand({
      Bucket: getMediaBucket(),
      Key: key,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  if (!upload.UploadId) {
    throw new Error("S3 did not return a multipart upload id.");
  }

  return {
    key,
    publicUrl: getPublicMediaUrl(key),
    uploadId: upload.UploadId,
  };
};

export const createPresignedMediaPartUpload = async (
  key: string,
  uploadId: string,
  partNumber: number
) =>
  getSignedUrl(
    getS3Client(),
    new UploadPartCommand({
      Bucket: getMediaBucket(),
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    }),
    { expiresIn: 900 }
  );

export const completeMultipartMediaUpload = async (
  key: string,
  uploadId: string,
  parts: Array<{ ETag: string; PartNumber: number }>
) => {
  await getS3Client().send(
    new CompleteMultipartUploadCommand({
      Bucket: getMediaBucket(),
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    })
  );

  return {
    key,
    publicUrl: getPublicMediaUrl(key),
  };
};

export const abortMultipartMediaUpload = async (
  key: string,
  uploadId: string
) =>
  getS3Client().send(
    new AbortMultipartUploadCommand({
      Bucket: getMediaBucket(),
      Key: key,
      UploadId: uploadId,
    })
  );

export const deleteImageFromS3 = async (key: string) => {
  try {
    return await getS3Client().send(
      new DeleteObjectCommand({
        Bucket: getMediaBucket(),
        Key: key,
      })
    );
  } catch (error) {
    console.error("[S3_MEDIA_DELETE]", error);
    throw error;
  }
};

export const deleteFolderFromS3 = async (folderKey: string) => {
  const prefix = folderKey.endsWith("/") ? folderKey : `${folderKey}/`;
  let s3Error: unknown;
  if (isS3MediaConfigured()) {
    const bucket = getMediaBucket();
    const client = getS3Client();
    let continuationToken: string | undefined;
    try {
      do {
        const listedObjects = await client.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: prefix,
            ContinuationToken: continuationToken,
          }),
        );
        const objects =
          listedObjects.Contents?.flatMap((object) =>
            object.Key ? [{ Key: object.Key }] : [],
          ) ?? [];

        if (objects.length > 0) {
          await client.send(
            new DeleteObjectsCommand({
              Bucket: bucket,
              Delete: { Objects: objects },
            }),
          );
        }

        continuationToken = listedObjects.IsTruncated
          ? listedObjects.NextContinuationToken
          : undefined;
      } while (continuationToken);
    } catch (error) {
      console.error("[S3_MEDIA_FOLDER_DELETE]", error);
      s3Error = error;
    }
  }

  try {
    await deleteCloudinaryFolderIfConfigured(folderKey);
  } catch (error) {
    console.error("[CLOUDINARY_MEDIA_FOLDER_DELETE]", error);
    if (!s3Error) throw error;
  }

  if (s3Error) throw s3Error;
};
