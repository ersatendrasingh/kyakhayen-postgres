CREATE TABLE `RecipeReaction` (
  `id` VARCHAR(191) NOT NULL,
  `type` ENUM('YUMMY', 'LOVE', 'WOW', 'MADE_IT', 'COMFORT') NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `recipeId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `RecipeReaction_userId_recipeId_key`(`userId`, `recipeId`),
  INDEX `RecipeReaction_recipeId_type_idx`(`recipeId`, `type`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `RecipeReaction`
  ADD CONSTRAINT `RecipeReaction_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `RecipeReaction`
  ADD CONSTRAINT `RecipeReaction_recipeId_fkey`
  FOREIGN KEY (`recipeId`) REFERENCES `Recipes`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
