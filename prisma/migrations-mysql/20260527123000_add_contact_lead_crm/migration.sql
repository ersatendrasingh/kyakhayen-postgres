ALTER TABLE `ContactUsQueries`
  ADD COLUMN `status` ENUM('NEW', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'CONVERTED', 'NOT_INTERESTED', 'CLOSED') NOT NULL DEFAULT 'NEW',
  ADD COLUMN `lastContactedAt` DATETIME(3) NULL,
  ADD COLUMN `closedReason` TEXT NULL,
  ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

CREATE TABLE `ContactQueryActivity` (
  `id` VARCHAR(191) NOT NULL,
  `queryId` VARCHAR(191) NOT NULL,
  `previousStatus` ENUM('NEW', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'CONVERTED', 'NOT_INTERESTED', 'CLOSED') NULL,
  `status` ENUM('NEW', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'CONVERTED', 'NOT_INTERESTED', 'CLOSED') NOT NULL,
  `contactMethod` VARCHAR(191) NULL,
  `note` TEXT NOT NULL,
  `contactedAt` DATETIME(3) NOT NULL,
  `createdById` VARCHAR(191) NULL,
  `createdByName` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `ContactQueryActivity_queryId_contactedAt_idx`(`queryId`, `contactedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ContactQueryActivity`
  ADD CONSTRAINT `ContactQueryActivity_queryId_fkey`
  FOREIGN KEY (`queryId`) REFERENCES `ContactUsQueries`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
