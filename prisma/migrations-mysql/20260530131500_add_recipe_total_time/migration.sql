ALTER TABLE `RecipeCookingTime`
  ADD COLUMN `totalTime` INTEGER NOT NULL DEFAULT 0 AFTER `restTime`;

UPDATE `RecipeCookingTime`
SET `totalTime` = `prepTime` + `cookTime` + `restTime`;

CREATE INDEX `RecipeCookingTime_totalTime_idx` ON `RecipeCookingTime`(`totalTime`);
