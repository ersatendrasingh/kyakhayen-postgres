ALTER TABLE `Recipes`
    ADD COLUMN `sourceSystem` VARCHAR(191) NULL,
    ADD COLUMN `sourceId` INTEGER NULL;

CREATE UNIQUE INDEX `Recipes_sourceSystem_sourceId_key`
    ON `Recipes`(`sourceSystem`, `sourceId`);

CREATE TABLE `RecipeDifficultyAssignment` (
    `id` VARCHAR(191) NOT NULL,
    `recipeId` VARCHAR(191) NOT NULL,
    `recipeDifficultyId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `RecipeDifficultyAssignment_recipeId_recipeDifficultyId_key`(`recipeId`, `recipeDifficultyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `RecipeSeasonAssignment` (
    `id` VARCHAR(191) NOT NULL,
    `recipeId` VARCHAR(191) NOT NULL,
    `recipeSeasonsId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `RecipeSeasonAssignment_recipeId_recipeSeasonsId_key`(`recipeId`, `recipeSeasonsId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `RecipeDifficultyAssignment`
    ADD CONSTRAINT `RecipeDifficultyAssignment_recipeId_fkey`
    FOREIGN KEY (`recipeId`) REFERENCES `Recipes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `RecipeDifficultyAssignment`
    ADD CONSTRAINT `RecipeDifficultyAssignment_recipeDifficultyId_fkey`
    FOREIGN KEY (`recipeDifficultyId`) REFERENCES `RecipeDifficulty`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `RecipeSeasonAssignment`
    ADD CONSTRAINT `RecipeSeasonAssignment_recipeId_fkey`
    FOREIGN KEY (`recipeId`) REFERENCES `Recipes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `RecipeSeasonAssignment`
    ADD CONSTRAINT `RecipeSeasonAssignment_recipeSeasonsId_fkey`
    FOREIGN KEY (`recipeSeasonsId`) REFERENCES `RecipeSeasons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
