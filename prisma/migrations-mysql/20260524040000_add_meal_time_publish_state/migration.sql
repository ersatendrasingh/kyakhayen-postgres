ALTER TABLE `MealTimes`
  ADD COLUMN `isPublished` BOOLEAN NOT NULL DEFAULT false;

-- Existing imported meal-time records are already used by the current catalog.
UPDATE `MealTimes` SET `isPublished` = true;
