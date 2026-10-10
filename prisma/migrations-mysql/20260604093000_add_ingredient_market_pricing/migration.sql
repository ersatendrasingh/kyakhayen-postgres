ALTER TABLE `Ingredients`
  ADD COLUMN `marketPriceInr` DOUBLE NULL,
  ADD COLUMN `marketPriceBasisGrams` DOUBLE NOT NULL DEFAULT 100,
  ADD COLUMN `marketPriceSource` VARCHAR(191) NULL,
  ADD COLUMN `marketPriceUpdatedAt` DATETIME(3) NULL;

CREATE INDEX `Ingredients_marketPriceInr_idx` ON `Ingredients`(`marketPriceInr`);
