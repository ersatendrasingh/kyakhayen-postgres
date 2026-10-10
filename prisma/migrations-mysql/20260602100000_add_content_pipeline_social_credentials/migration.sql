CREATE TABLE `ContentPipelineSocialCredential` (
  `id` VARCHAR(191) NOT NULL,
  `provider` VARCHAR(64) NOT NULL,
  `environment` VARCHAR(32) NOT NULL,
  `boardId` VARCHAR(191) NULL,
  `accessTokenCiphertext` TEXT NULL,
  `refreshTokenCiphertext` TEXT NULL,
  `tokenType` VARCHAR(64) NULL,
  `scope` VARCHAR(700) NULL,
  `accessTokenExpiresAt` DATETIME(3) NULL,
  `refreshTokenExpiresAt` DATETIME(3) NULL,
  `connectedAccountId` VARCHAR(191) NULL,
  `connectedAccountName` VARCHAR(191) NULL,
  `connectedById` VARCHAR(191) NULL,
  `connectedByName` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `ContentPipelineSocialCredential_provider_key`(`provider`),
  INDEX `ContentPipelineSocialCredential_provider_environment_idx`(`provider`, `environment`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
