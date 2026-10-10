CREATE TABLE `BodyTypes` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `position` INTEGER NULL,

    UNIQUE INDEX `BodyTypes_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `RecipeBodyType` (
    `id` VARCHAR(191) NOT NULL,
    `recipeId` VARCHAR(191) NOT NULL,
    `bodyTypeId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `RecipeBodyType_recipeId_bodyTypeId_key`(`recipeId`, `bodyTypeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `RecipeBodyType` ADD CONSTRAINT `RecipeBodyType_recipeId_fkey` FOREIGN KEY (`recipeId`) REFERENCES `Recipes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `RecipeBodyType` ADD CONSTRAINT `RecipeBodyType_bodyTypeId_fkey` FOREIGN KEY (`bodyTypeId`) REFERENCES `BodyTypes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
