ALTER TABLE `DietTypes`
  ADD COLUMN `isPublished` BOOLEAN NOT NULL DEFAULT false;

-- Existing imported diet-type tags belong to the current visible recipe catalog.
UPDATE `DietTypes` SET `isPublished` = true;
