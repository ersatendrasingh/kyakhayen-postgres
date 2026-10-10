import webPush, { type PushSubscription as WebPushSubscription } from "web-push";

import { db } from "@/lib/db";

export type PushPayload = {
  title: string;
  body: string;
  url?: string | null;
  imageUrl?: string | null;
  tag?: string;
};

type StoredSubscription = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  deliveryId?: string;
};

export function getPushPublicConfiguration() {
  const publicKey = process.env.VAPID_PUBLIC_KEY || "";
  return {
    enabled: Boolean(publicKey && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT),
    publicKey,
  };
}

function configureWebPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    throw new Error("VAPID push keys are not configured.");
  }
  if (!subject.startsWith("mailto:") && !subject.startsWith("https://")) {
    throw new Error("VAPID_SUBJECT must start with mailto: or https://.");
  }

  webPush.setVapidDetails(subject, publicKey, privateKey);
}

export async function sendPushNotifications(
  subscriptions: StoredSubscription[],
  payload: PushPayload,
) {
  configureWebPush();

  let sent = 0;
  let failed = 0;
  let expired = 0;
  await Promise.all(
    subscriptions.map(async (subscription) => {
      const target: WebPushSubscription = {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      };

      try {
        await webPush.sendNotification(
          target,
          JSON.stringify({ ...payload, deliveryId: subscription.deliveryId }),
          { TTL: 60 * 60 },
        );
        sent += 1;
        await Promise.all([
          db.pushSubscription.update({
            where: { id: subscription.id },
            data: { lastSentAt: new Date(), failureReason: null },
          }),
          subscription.deliveryId
            ? db.notificationDelivery.update({
                where: { id: subscription.deliveryId },
                data: { status: "DELIVERED", deliveredAt: new Date(), failureReason: null },
              })
            : Promise.resolve(),
        ]);
      } catch (error) {
        failed += 1;
        const statusCode =
          typeof error === "object" && error && "statusCode" in error
            ? Number(error.statusCode)
            : 0;
        const messageText = error instanceof Error ? error.message : "Push delivery failed.";

        if (statusCode === 404 || statusCode === 410) {
          expired += 1;
          await Promise.all([
            db.pushSubscription.update({
              where: { id: subscription.id },
              data: { isActive: false, failureReason: "Subscription expired or was removed." },
            }),
            subscription.deliveryId
              ? db.notificationDelivery.update({
                  where: { id: subscription.deliveryId },
                  data: { status: "EXPIRED", failureReason: "Subscription expired or was removed." },
                })
              : Promise.resolve(),
          ]);
        } else {
          await Promise.all([
            db.pushSubscription.update({
              where: { id: subscription.id },
              data: { failureReason: messageText.slice(0, 500) },
            }),
            subscription.deliveryId
              ? db.notificationDelivery.update({
                  where: { id: subscription.deliveryId },
                  data: { status: "FAILED", failureReason: messageText.slice(0, 500) },
                })
              : Promise.resolve(),
          ]);
        }
      }
    }),
  );

  return { recipients: subscriptions.length, sent, failed, expired };
}
