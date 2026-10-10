ALTER TABLE `PushSubscription` DROP FOREIGN KEY `PushSubscription_userId_fkey`;
ALTER TABLE `NotificationDelivery` DROP FOREIGN KEY `NotificationDelivery_userId_fkey`;

ALTER TABLE `PushSubscription`
  MODIFY `userId` VARCHAR(191) NULL,
  ADD COLUMN `deviceId` VARCHAR(191) NULL,
  ADD COLUMN `platform` ENUM('ANDROID', 'IOS', 'DESKTOP', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN `os` VARCHAR(120) NULL,
  ADD COLUMN `browser` VARCHAR(120) NULL,
  ADD COLUMN `displayMode` VARCHAR(60) NULL,
  ADD COLUMN `notificationPermission` VARCHAR(40) NULL,
  ADD COLUMN `lastSeenAt` DATETIME(3) NULL;

ALTER TABLE `NotificationDelivery`
  MODIFY `userId` VARCHAR(191) NULL;

CREATE TABLE `PwaDevice` (
  `id` VARCHAR(191) NOT NULL,
  `deviceKey` VARCHAR(80) NOT NULL,
  `userId` VARCHAR(191) NULL,
  `platform` ENUM('ANDROID', 'IOS', 'DESKTOP', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
  `os` VARCHAR(120) NULL,
  `browser` VARCHAR(120) NULL,
  `displayMode` VARCHAR(60) NULL,
  `userAgent` TEXT NULL,
  `installState` ENUM('BROWSING', 'PROMPTED', 'INSTALLED', 'INFERRED') NOT NULL DEFAULT 'BROWSING',
  `pushPermission` VARCHAR(40) NULL,
  `promptShownAt` DATETIME(3) NULL,
  `promptAcceptedAt` DATETIME(3) NULL,
  `installedAt` DATETIME(3) NULL,
  `standaloneFirstSeenAt` DATETIME(3) NULL,
  `pushSubscribedAt` DATETIME(3) NULL,
  `pushUnsubscribedAt` DATETIME(3) NULL,
  `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `PwaDevice_deviceKey_key`(`deviceKey`),
  INDEX `PwaDevice_platform_installState_idx`(`platform`, `installState`),
  INDEX `PwaDevice_userId_idx`(`userId`),
  INDEX `PwaDevice_installedAt_idx`(`installedAt`),
  INDEX `PwaDevice_lastSeenAt_idx`(`lastSeenAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PwaInstallEvent` (
  `id` VARCHAR(191) NOT NULL,
  `deviceId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NULL,
  `eventType` ENUM('VISITED', 'PROMPT_SHOWN', 'PROMPT_ACCEPTED', 'PROMPT_DISMISSED', 'APP_INSTALLED', 'STANDALONE_OPENED', 'PUSH_PERMISSION_GRANTED', 'PUSH_PERMISSION_DENIED', 'PUSH_PERMISSION_BLOCKED', 'PUSH_SUBSCRIBED', 'PUSH_UNSUBSCRIBED') NOT NULL,
  `platform` ENUM('ANDROID', 'IOS', 'DESKTOP', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
  `os` VARCHAR(120) NULL,
  `browser` VARCHAR(120) NULL,
  `displayMode` VARCHAR(60) NULL,
  `userAgent` TEXT NULL,
  `metadata` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `PwaInstallEvent_deviceId_createdAt_idx`(`deviceId`, `createdAt`),
  INDEX `PwaInstallEvent_eventType_createdAt_idx`(`eventType`, `createdAt`),
  INDEX `PwaInstallEvent_platform_createdAt_idx`(`platform`, `createdAt`),
  INDEX `PwaInstallEvent_userId_createdAt_idx`(`userId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `PushSubscription_deviceId_idx` ON `PushSubscription`(`deviceId`);
CREATE INDEX `PushSubscription_platform_isActive_idx` ON `PushSubscription`(`platform`, `isActive`);

ALTER TABLE `PushSubscription`
  ADD CONSTRAINT `PushSubscription_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `PushSubscription_deviceId_fkey` FOREIGN KEY (`deviceId`) REFERENCES `PwaDevice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `NotificationDelivery`
  ADD CONSTRAINT `NotificationDelivery_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `PwaDevice`
  ADD CONSTRAINT `PwaDevice_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `PwaInstallEvent`
  ADD CONSTRAINT `PwaInstallEvent_deviceId_fkey` FOREIGN KEY (`deviceId`) REFERENCES `PwaDevice`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `PwaInstallEvent_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
