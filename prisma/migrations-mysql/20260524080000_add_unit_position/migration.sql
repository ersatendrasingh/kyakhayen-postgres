ALTER TABLE `Units`
  ADD COLUMN `position` INTEGER NULL;

SET @unit_position := 0;
UPDATE `Units`
SET `position` = (@unit_position := @unit_position + 1)
ORDER BY `title` ASC;
