INSERT INTO `PwaDevice` (
  `id`,
  `deviceKey`,
  `userId`,
  `platform`,
  `os`,
  `browser`,
  `displayMode`,
  `userAgent`,
  `installState`,
  `pushPermission`,
  `installedAt`,
  `pushSubscribedAt`,
  `lastSeenAt`,
  `createdAt`,
  `updatedAt`
)
SELECT
  CONCAT('legacy_', `PushSubscription`.`id`),
  CONCAT('legacy-', `PushSubscription`.`id`),
  `PushSubscription`.`userId`,
  `PushSubscription`.`platform`,
  `PushSubscription`.`os`,
  `PushSubscription`.`browser`,
  `PushSubscription`.`displayMode`,
  `PushSubscription`.`userAgent`,
  'INFERRED',
  COALESCE(`PushSubscription`.`notificationPermission`, 'granted'),
  `PushSubscription`.`createdAt`,
  `PushSubscription`.`createdAt`,
  COALESCE(`PushSubscription`.`lastSeenAt`, `PushSubscription`.`createdAt`),
  `PushSubscription`.`createdAt`,
  NOW(3)
FROM `PushSubscription`
WHERE `PushSubscription`.`isActive` = true
  AND `PushSubscription`.`deviceId` IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM `PwaDevice`
    WHERE `PwaDevice`.`deviceKey` = CONCAT('legacy-', `PushSubscription`.`id`)
  );

UPDATE `PushSubscription`
INNER JOIN `PwaDevice`
  ON `PwaDevice`.`deviceKey` = CONCAT('legacy-', `PushSubscription`.`id`)
SET
  `PushSubscription`.`deviceId` = `PwaDevice`.`id`,
  `PushSubscription`.`notificationPermission` = COALESCE(`PushSubscription`.`notificationPermission`, 'granted'),
  `PushSubscription`.`lastSeenAt` = COALESCE(`PushSubscription`.`lastSeenAt`, `PushSubscription`.`createdAt`)
WHERE `PushSubscription`.`isActive` = true
  AND `PushSubscription`.`deviceId` IS NULL;

INSERT INTO `PwaInstallEvent` (
  `id`,
  `deviceId`,
  `userId`,
  `eventType`,
  `platform`,
  `os`,
  `browser`,
  `displayMode`,
  `userAgent`,
  `metadata`,
  `createdAt`
)
SELECT
  CONCAT('legacy_push_', `PushSubscription`.`id`),
  `PushSubscription`.`deviceId`,
  `PushSubscription`.`userId`,
  'PUSH_SUBSCRIBED',
  `PushSubscription`.`platform`,
  `PushSubscription`.`os`,
  `PushSubscription`.`browser`,
  `PushSubscription`.`displayMode`,
  `PushSubscription`.`userAgent`,
  JSON_OBJECT('source', 'legacy_push_subscription'),
  `PushSubscription`.`createdAt`
FROM `PushSubscription`
WHERE `PushSubscription`.`isActive` = true
  AND `PushSubscription`.`deviceId` IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM `PwaInstallEvent`
    WHERE `PwaInstallEvent`.`id` = CONCAT('legacy_push_', `PushSubscription`.`id`)
  );
