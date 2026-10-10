ALTER TABLE `NotificationCampaign`
  MODIFY `audience` ENUM('ALL_SUBSCRIBERS', 'USER', 'PREFERENCE_SEGMENT') NOT NULL DEFAULT 'ALL_SUBSCRIBERS',
  ADD COLUMN `source` ENUM('ADMIN_BROADCAST', 'ADMIN_TARGETED', 'MEAL_PLAN_READY', 'MEAL_REMINDER', 'MEMBERSHIP_EXPIRY', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'PREFERENCE_PROMOTION') NOT NULL DEFAULT 'ADMIN_BROADCAST',
  ADD COLUMN `status` ENUM('SCHEDULED', 'PROCESSING', 'SENT', 'FAILED') NOT NULL DEFAULT 'PROCESSING',
  ADD COLUMN `segmentType` VARCHAR(191) NULL,
  ADD COLUMN `segmentId` VARCHAR(191) NULL,
  ADD COLUMN `dedupeKey` VARCHAR(191) NULL,
  ADD COLUMN `openedCount` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `clickedCount` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `scheduledAt` DATETIME(3) NULL,
  MODIFY `sentAt` DATETIME(3) NULL;

CREATE UNIQUE INDEX `NotificationCampaign_dedupeKey_key` ON `NotificationCampaign`(`dedupeKey`);
CREATE INDEX `NotificationCampaign_status_scheduledAt_idx` ON `NotificationCampaign`(`status`, `scheduledAt`);

CREATE TABLE `NotificationDelivery` (
  `id` VARCHAR(191) NOT NULL,
  `campaignId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `subscriptionId` VARCHAR(191) NULL,
  `status` ENUM('QUEUED', 'DELIVERED', 'FAILED', 'EXPIRED') NOT NULL DEFAULT 'QUEUED',
  `deliveredAt` DATETIME(3) NULL,
  `openedAt` DATETIME(3) NULL,
  `clickedAt` DATETIME(3) NULL,
  `failureReason` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `NotificationDelivery_campaignId_subscriptionId_key`(`campaignId`, `subscriptionId`),
  INDEX `NotificationDelivery_campaignId_status_idx`(`campaignId`, `status`),
  INDEX `NotificationDelivery_userId_createdAt_idx`(`userId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `NotificationDelivery`
  ADD CONSTRAINT `NotificationDelivery_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `NotificationCampaign`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `NotificationDelivery_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `NotificationDelivery_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `PushSubscription`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
