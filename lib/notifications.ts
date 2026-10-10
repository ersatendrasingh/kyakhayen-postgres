import {
  NotificationAudience,
  NotificationCampaignStatus,
  NotificationSource,
  Prisma,
} from "@prisma/client";

import { db } from "@/lib/db";
import { sendPushNotifications } from "@/lib/web-push";

export type NotificationCampaignInput = {
  title: string;
  body: string;
  url?: string | null;
  imageUrl?: string | null;
  audience?: NotificationAudience;
  source?: NotificationSource;
  targetUserId?: string | null;
  segmentType?: string | null;
  segmentId?: string | null;
  createdById?: string | null;
  createdByName?: string | null;
  scheduledAt?: Date | null;
  dedupeKey?: string | null;
  automationRuleId?: string | null;
};

function subscriptionWhere(campaign: {
  audience: NotificationAudience;
  targetUserId: string | null;
  segmentType: string | null;
  segmentId: string | null;
}) {
  if (campaign.audience === NotificationAudience.USER) {
    return { isActive: true, userId: campaign.targetUserId || "__missing__" };
  }
  if (campaign.audience === NotificationAudience.PREFERENCE_SEGMENT && campaign.segmentId) {
    if (campaign.segmentType === "CUISINE") {
      return {
        isActive: true,
        user: { is: { userCuisines: { some: { cuisineId: campaign.segmentId } } } },
      };
    }
    return {
      isActive: true,
      user: { is: { foodPreferenceId: campaign.segmentId } },
    };
  }
  return { isActive: true };
}

export async function createNotificationCampaign(input: NotificationCampaignInput) {
  const status =
    input.scheduledAt && input.scheduledAt > new Date()
      ? NotificationCampaignStatus.SCHEDULED
      : NotificationCampaignStatus.PROCESSING;
  try {
    return await db.notificationCampaign.create({
      data: {
        title: input.title,
        body: input.body,
        url: input.url || "/",
        imageUrl: input.imageUrl || null,
        audience: input.audience || NotificationAudience.USER,
        source: input.source || NotificationSource.ADMIN_TARGETED,
        status,
        targetUserId: input.targetUserId || null,
        segmentType: input.segmentType || null,
        segmentId: input.segmentId || null,
        createdById: input.createdById || null,
        createdByName: input.createdByName || null,
        scheduledAt: input.scheduledAt || null,
        dedupeKey: input.dedupeKey || null,
        automationRuleId: input.automationRuleId || null,
      },
    });
  } catch (error) {
    if (
      input.dedupeKey &&
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return db.notificationCampaign.findUniqueOrThrow({ where: { dedupeKey: input.dedupeKey } });
    }
    throw error;
  }
}

export async function sendNotificationCampaign(campaignId: string) {
  const campaign = await db.notificationCampaign.findUniqueOrThrow({ where: { id: campaignId } });
  if (campaign.status === NotificationCampaignStatus.SENT) return campaign;

  const subscriptions = await db.pushSubscription.findMany({
    where: subscriptionWhere(campaign),
    select: { id: true, userId: true, endpoint: true, p256dh: true, auth: true },
  });

  await db.notificationDelivery.createMany({
    data: subscriptions.map((subscription) => ({
      campaignId,
      userId: subscription.userId || null,
      subscriptionId: subscription.id,
    })),
    skipDuplicates: true,
  });
  await db.notificationCampaign.update({
    where: { id: campaignId },
    data: { status: NotificationCampaignStatus.PROCESSING, totalRecipients: subscriptions.length },
  });

  const pending = await db.notificationDelivery.findMany({
    where: { campaignId, status: "QUEUED", subscription: { isActive: true } },
    include: { subscription: true },
  });
  if (pending.length) {
    await sendPushNotifications(
      pending.flatMap((delivery) =>
        delivery.subscription
          ? [{
              id: delivery.subscription.id,
              endpoint: delivery.subscription.endpoint,
              p256dh: delivery.subscription.p256dh,
              auth: delivery.subscription.auth,
              deliveryId: delivery.id,
            }]
          : [],
      ),
      {
        title: campaign.title,
        body: campaign.body,
        url: campaign.url,
        imageUrl: campaign.imageUrl,
        tag: `campaign-${campaign.id}`,
      },
    );
  }

  const [delivered, failed, expired] = await Promise.all([
    db.notificationDelivery.count({ where: { campaignId, status: "DELIVERED" } }),
    db.notificationDelivery.count({ where: { campaignId, status: { in: ["FAILED", "EXPIRED"] } } }),
    db.notificationDelivery.count({ where: { campaignId, status: "EXPIRED" } }),
  ]);

  return db.notificationCampaign.update({
    where: { id: campaignId },
    data: {
      status: NotificationCampaignStatus.SENT,
      sentAt: new Date(),
      successfulDeliveries: delivered,
      failedDeliveries: failed,
      expiredSubscriptions: expired,
    },
  });
}

export async function notifyUser(
  input: Omit<NotificationCampaignInput, "audience"> & { targetUserId: string },
) {
  const campaign = await createNotificationCampaign({ ...input, audience: NotificationAudience.USER });
  if (campaign.status !== NotificationCampaignStatus.SENT) {
    await sendNotificationCampaign(campaign.id);
  }
  return campaign;
}

export async function recordDeliveryEngagement(deliveryId: string, event: "OPENED" | "CLICKED") {
  const delivery = await db.notificationDelivery.findUnique({
    where: { id: deliveryId },
    select: { campaignId: true, openedAt: true, clickedAt: true },
  });
  if (!delivery) return null;

  const now = new Date();
  await db.notificationDelivery.update({
    where: { id: deliveryId },
    data: {
      openedAt: delivery.openedAt || now,
      clickedAt: event === "CLICKED" ? delivery.clickedAt || now : delivery.clickedAt,
    },
  });

  const [openedCount, clickedCount] = await Promise.all([
    db.notificationDelivery.count({ where: { campaignId: delivery.campaignId, openedAt: { not: null } } }),
    db.notificationDelivery.count({ where: { campaignId: delivery.campaignId, clickedAt: { not: null } } }),
  ]);
  return db.notificationCampaign.update({
    where: { id: delivery.campaignId },
    data: { openedCount, clickedCount },
  });
}
