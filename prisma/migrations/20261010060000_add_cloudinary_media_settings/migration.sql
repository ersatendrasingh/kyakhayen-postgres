ALTER TABLE "MediaAsset"
ADD COLUMN "storageProvider" VARCHAR(32) NOT NULL DEFAULT 'S3';

CREATE INDEX "MediaAsset_storageProvider_createdAt_idx"
ON "MediaAsset"("storageProvider", "createdAt");

CREATE TABLE "SiteMediaSetting" (
    "id" VARCHAR(32) NOT NULL DEFAULT 'media',
    "primaryProvider" VARCHAR(32) NOT NULL DEFAULT 'CLOUDINARY',
    "cloudinaryCloudName" VARCHAR(255),
    "cloudinaryApiKey" VARCHAR(255),
    "cloudinaryApiSecretCiphertext" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteMediaSetting_pkey" PRIMARY KEY ("id")
);

INSERT INTO "SiteMediaSetting" ("id", "primaryProvider", "createdAt", "updatedAt")
VALUES ('media', 'CLOUDINARY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
