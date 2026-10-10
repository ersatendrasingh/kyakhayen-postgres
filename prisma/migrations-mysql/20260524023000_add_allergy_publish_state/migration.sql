ALTER TABLE `Allergies`
  ADD COLUMN `isPublished` BOOLEAN NOT NULL DEFAULT false;

-- Existing imported allergy content has already been reviewed and is currently visible.
UPDATE `Allergies` SET `isPublished` = true;
