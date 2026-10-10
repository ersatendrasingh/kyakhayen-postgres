import { NotificationsDashboard } from "@/components/admin/notifications/notifications-dashboard";
import { db } from "@/lib/db";

const NotificationsPage = async () => {
  const [
    activeDevices,
    customers,
    campaigns,
    reachedRecently,
    deliveryTotals,
    scheduledCampaigns,
    foodStyles,
    cuisines,
    mealTimes,
    automationRules,
  ] = await Promise.all([
    db.pushSubscription.count({ where: { isActive: true } }),
    db.user.findMany({
      where: { PushSubscription: { some: { isActive: true } } },
      select: {
        id: true,
        name: true,
        email: true,
        _count: { select: { PushSubscription: { where: { isActive: true } } } },
      },
      orderBy: { name: "asc" },
    }),
    db.notificationCampaign.findMany({
      include: { targetUser: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.$queryRaw<Array<{ total: bigint }>>`
      SELECT COUNT(*) AS total
      FROM "NotificationDelivery"
      WHERE "deliveredAt" >= NOW() - INTERVAL '30 days'
    `,
    Promise.all([
      db.notificationDelivery.count(),
      db.notificationDelivery.count({ where: { status: "DELIVERED" } }),
      db.notificationDelivery.count({ where: { openedAt: { not: null } } }),
      db.notificationDelivery.count({ where: { clickedAt: { not: null } } }),
    ]),
    db.notificationCampaign.count({ where: { status: "SCHEDULED" } }),
    db.recipeCategories.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.cuisines.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
    db.mealTimes.findMany({ select: { id: true, title: true }, orderBy: [{ position: "asc" }, { title: "asc" }] }),
    db.notificationAutomationRule.findMany({ orderBy: [{ isSystem: "desc" }, { createdAt: "desc" }] }),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <NotificationsDashboard
        subscribers={customers}
        campaigns={campaigns}
        automationRules={automationRules}
        segments={{ foodStyles, cuisines, mealTimes }}
        activeDevices={activeDevices}
        reachedRecently={Number(reachedRecently[0]?.total || 0)}
        scheduledCampaigns={scheduledCampaigns}
        deliveryTotals={{
          total: deliveryTotals[0],
          delivered: deliveryTotals[1],
          opened: deliveryTotals[2],
          clicked: deliveryTotals[3],
        }}
      />
    </div>
  );
};

export default NotificationsPage;
