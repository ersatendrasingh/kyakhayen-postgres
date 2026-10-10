ALTER TABLE `Recipes`
  ADD COLUMN `publishedAt` DATETIME(3) NULL,
  ADD COLUMN `contentUpdatedAt` DATETIME(3) NULL;

CREATE INDEX `Recipes_isPublished_publishedAt_idx` ON `Recipes`(`isPublished`, `publishedAt`);
CREATE INDEX `Recipes_contentUpdatedAt_idx` ON `Recipes`(`contentUpdatedAt`);
