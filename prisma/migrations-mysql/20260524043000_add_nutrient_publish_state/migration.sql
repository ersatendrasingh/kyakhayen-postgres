ALTER TABLE `Nutrient`
  ADD COLUMN `isPublished` BOOLEAN NOT NULL DEFAULT false;

-- Existing imported nutrient tags are part of the current published recipe catalog.
UPDATE `Nutrient` SET `isPublished` = true;
