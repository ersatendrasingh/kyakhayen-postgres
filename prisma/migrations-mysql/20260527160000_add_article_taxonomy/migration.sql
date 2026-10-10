ALTER TABLE `Category`
    ADD COLUMN `position` INTEGER NULL,
    ADD COLUMN `isPublished` BOOLEAN NOT NULL DEFAULT false;

SET @article_category_position := 0;
UPDATE `Category`
SET `position` = (@article_category_position := @article_category_position + 1)
ORDER BY `title` ASC;

UPDATE `Category` SET `isPublished` = true;

CREATE TABLE `ArticleTag` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `position` INTEGER NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `ArticleTag_title_key`(`title`),
    UNIQUE INDEX `ArticleTag_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PostTag` (
    `id` VARCHAR(191) NOT NULL,
    `postId` VARCHAR(191) NOT NULL,
    `tagId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `PostTag_postId_tagId_key`(`postId`, `tagId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `PostTag` ADD CONSTRAINT `PostTag_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `PostTag` ADD CONSTRAINT `PostTag_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `ArticleTag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
