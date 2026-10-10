import {
  ContactLeadStatus,
  PaymentStatus,
  PwaInstallEventType,
  PwaInstallState,
  PwaPlatform,
  type PushSubscription,
} from "@prisma/client";

import {
  AdminDashboard,
  type AdminDashboardData,
} from "@/components/admin/dashboard/admin-dashboard";
import { db } from "@/lib/db";

function monthsUntilNow(value: Date, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const offset = count - index - 1;
    return new Date(value.getFullYear(), value.getMonth() - offset, 1);
  });
}

function weeksUntilNow(value: Date, count: number) {
  const weekStart = new Date(value);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  return Array.from({ length: count }, (_, index) => {
    const start = new Date(weekStart);
    start.setDate(weekStart.getDate() - (count - index - 1) * 7);
    return start;
  });
}

type PwaDashboardDevice = {
  id: string;
  userId: string | null;
  platform: PwaPlatform;
  os: string | null;
  browser: string | null;
  displayMode: string | null;
  installState: PwaInstallState;
  pushPermission: string | null;
  installedAt: Date | null;
  lastSeenAt: Date;
};

type PwaDashboardEvent = {
  eventType: PwaInstallEventType;
  platform: PwaPlatform;
  createdAt: Date;
};

async function pwaDashboardRows(thisWeekStart: Date) {
  const [deviceResult, pushSubscriptions, eventResult] = await Promise.all([
    db.pwaDevice
      .findMany({
        select: {
          id: true,
          userId: true,
          platform: true,
          os: true,
          browser: true,
          displayMode: true,
          installState: true,
          pushPermission: true,
          installedAt: true,
          lastSeenAt: true,
        },
        orderBy: { lastSeenAt: "desc" },
      })
      .then((rows) => ({ rows, ready: true }))
      .catch(() => ({ rows: [] as PwaDashboardDevice[], ready: false })),
    db.pushSubscription
      .findMany({
        select: {
          id: true,
          isActive: true,
          createdAt: true,
        },
      })
      .catch(() => [] as Pick<PushSubscription, "id" | "isActive" | "createdAt">[]),
    db.pwaInstallEvent
      .findMany({
        where: { createdAt: { gte: thisWeekStart } },
        select: { eventType: true, platform: true, createdAt: true },
      })
      .then((rows) => ({ rows, ready: true }))
      .catch(() => ({ rows: [] as PwaDashboardEvent[], ready: false })),
  ]);

  return {
    pwaDevices: deviceResult.rows,
    pushSubscriptions,
    pwaEventsThisWeek: eventResult.rows,
    pwaTrackingReady: deviceResult.ready && eventResult.ready,
  };
}

const DashboardPage = async () => {
  const now = new Date();
  const monthBuckets = monthsUntilNow(now, 6);
  const weekBuckets = weeksUntilNow(now, 8);
  const since = monthBuckets[0];
  const thisWeekStart = weekBuckets[weekBuckets.length - 1] || now;

  const [
    recipes,
    articles,
    ingredients,
    users,
    memberships,
    orders,
    comments,
    reviews,
    leads,
    mediaAssets,
  ] = await Promise.all([
    db.recipes.findMany({
      select: {
        id: true,
        title: true,
        views: true,
        imageUrl: true,
        isPublished: true,
        _count: {
          select: {
            Favorite: true,
            Review: true,
            recipeIngredients: true,
            recipeMethods: true,
          },
        },
      },
    }),
    db.post.findMany({
      select: { id: true, title: true, imageUrl: true, isPublished: true, createdAt: true },
    }),
    db.ingredients.findMany({
      select: { isPublished: true, calories: true, protein: true },
    }),
    db.user.findMany({
      select: {
        id: true,
        createdAt: true,
        isActive: true,
        isPersonalised: true,
        emailVerified: true,
      },
    }),
    db.userPlan.findMany({
      where: {
        user: { isActive: true },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      select: {
        userId: true,
        endDate: true,
        plan: { select: { name: true, priceInr: true } },
      },
    }),
    db.order.findMany({
      select: {
        id: true,
        orderId: true,
        totalAmount: true,
        currency: true,
        paymentStatus: true,
        createdAt: true,
        user: { select: { name: true } },
        items: { take: 1, select: { itemName: true, plan: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.comment.findMany({
      select: { isPublished: true, createdAt: true },
    }),
    db.review.findMany({
      select: { isPublished: true, rating: true, createdAt: true },
    }),
    db.contactUsQueries.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        lastContactedAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.mediaAsset.count(),
  ]);
  const { pwaDevices, pushSubscriptions, pwaEventsThisWeek, pwaTrackingReady } =
    await pwaDashboardRows(thisWeekStart);

  const paidOrders = orders.filter(
    (order) =>
      (order.paymentStatus === PaymentStatus.Paid || order.paymentStatus === PaymentStatus.Success) &&
      (!order.currency || order.currency === "INR"),
  );
  const paidRevenue = paidOrders.reduce((total, order) => total + (order.totalAmount || 0), 0);
  const publishedRecipes = recipes.filter((recipe) => recipe.isPublished);
  const activeUsers = users.filter((user) => user.isActive);
  const activeMemberUsers = new Set(memberships.map((membership) => membership.userId)).size;
  const membershipExpiryWindow = new Date(now.getTime() + 7 * 86_400_000);
  const publishingReadyDrafts = recipes.filter(
    (recipe) =>
      !recipe.isPublished &&
      Boolean(recipe.imageUrl) &&
      recipe._count.recipeIngredients > 0 &&
      recipe._count.recipeMethods > 0,
  ).length;

  const planCounts = memberships.reduce<Record<string, { value: number; paid: boolean }>>((result, membership) => {
    result[membership.plan.name] = {
      value: (result[membership.plan.name]?.value || 0) + 1,
      paid: Boolean(membership.plan.priceInr && membership.plan.priceInr > 0),
    };
    return result;
  }, {});
  const pwaInstallStates = new Set<PwaInstallState>([PwaInstallState.INSTALLED, PwaInstallState.INFERRED]);
  const installedPwaDevices = pwaDevices.filter((device) => pwaInstallStates.has(device.installState));
  const activePushSubscriptions = pushSubscriptions.filter((subscription) => subscription.isActive);
  const platformLabels: Record<PwaPlatform, string> = {
    ANDROID: "Android",
    IOS: "iOS",
    DESKTOP: "Desktop",
    UNKNOWN: "Unknown",
  };

  const dashboardData: AdminDashboardData = {
    generatedAt: now.toISOString(),
    stats: {
      paidRevenue,
      paidOrders: paidOrders.length,
      totalUsers: users.length,
      activeMembers: activeMemberUsers,
      publishedRecipes: publishedRecipes.length,
      totalRecipes: recipes.length,
      actionItems:
        comments.filter((comment) => !comment.isPublished).length +
        reviews.filter((review) => !review.isPublished).length +
        leads.filter((lead) => lead.status === ContactLeadStatus.NEW || lead.status === ContactLeadStatus.FOLLOW_UP)
          .length +
        orders.filter((order) => order.paymentStatus === PaymentStatus.Processing).length,
    },
    revenue: monthBuckets.map((start, index) => {
      const end = monthBuckets[index + 1] || new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const monthOrders = paidOrders.filter(
        (order) => order.createdAt >= start && order.createdAt < end && order.createdAt >= since,
      );
      return {
        label: start.toLocaleDateString("en-IN", { month: "short" }),
        value: monthOrders.reduce((total, order) => total + (order.totalAmount || 0), 0),
        orders: monthOrders.length,
      };
    }),
    registrations: weekBuckets.map((start, index) => {
      const end = weekBuckets[index + 1] || new Date(now.getTime() + 86_400_000);
      return {
        label: start.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        value: users.filter((user) => user.createdAt >= start && user.createdAt < end).length,
      };
    }),
    audience: {
      active: activeUsers.length,
      personalised: users.filter((user) => user.isPersonalised).length,
      verified: users.filter((user) => Boolean(user.emailVerified)).length,
      setupPending: users.filter((user) => !user.isPersonalised).length,
    },
    health: [
      {
        label: "Recipes live",
        value: publishedRecipes.length,
        total: recipes.length,
        href: "/admin/recipes",
      },
      {
        label: "Recipe build complete",
        value: recipes.filter(
          (recipe) => recipe._count.recipeIngredients > 0 && recipe._count.recipeMethods > 0,
        ).length,
        total: recipes.length,
        href: "/admin/recipes",
      },
      {
        label: "Articles live",
        value: articles.filter((article) => article.isPublished).length,
        total: articles.length,
        href: "/admin/articles",
      },
      {
        label: "Nutrition catalog ready",
        value: ingredients.filter(
          (ingredient) => ingredient.isPublished && ingredient.calories !== null && ingredient.protein !== null,
        ).length,
        total: ingredients.length,
        href: "/admin/ingredients",
      },
    ],
    publishing: {
      readyDrafts: publishingReadyDrafts,
    },
    subscriptions: {
      assignments: memberships.length,
      memberUsers: activeMemberUsers,
      pricedAccess: memberships.filter((membership) => Boolean(membership.plan.priceInr && membership.plan.priceInr > 0))
        .length,
      expiringSoon: memberships.filter(
        (membership) => membership.endDate && membership.endDate >= now && membership.endDate <= membershipExpiryWindow,
      ).length,
      noExpiry: memberships.filter((membership) => !membership.endDate).length,
      plans: Object.entries(planCounts)
        .map(([label, plan]) => ({ label, value: plan.value, paid: plan.paid }))
        .sort((first, second) => second.value - first.value),
    },
    pwa: {
      downloadsTotal: installedPwaDevices.length,
      downloadsThisWeek: installedPwaDevices.filter((device) => device.installedAt && device.installedAt >= thisWeekStart)
        .length,
      registeredThisWeek: users.filter((user) => user.createdAt >= thisWeekStart).length,
      activeSubscribers: activePushSubscriptions.length,
      subscribersThisWeek: activePushSubscriptions.filter((subscription) => subscription.createdAt >= thisWeekStart).length,
      linkedDevices: pwaDevices.filter((device) => Boolean(device.userId)).length,
      anonymousDevices: pwaDevices.filter((device) => !device.userId).length,
      activeDevicesThisWeek: pwaDevices.filter((device) => device.lastSeenAt >= thisWeekStart).length,
      promptShownThisWeek: pwaEventsThisWeek.filter((event) => event.eventType === PwaInstallEventType.PROMPT_SHOWN).length,
      promptAcceptedThisWeek: pwaEventsThisWeek.filter((event) => event.eventType === PwaInstallEventType.PROMPT_ACCEPTED)
        .length,
      promptDismissedThisWeek: pwaEventsThisWeek.filter((event) => event.eventType === PwaInstallEventType.PROMPT_DISMISSED)
        .length,
      trackingReady: pwaTrackingReady,
      platformDownloads: Object.values(PwaPlatform).map((platform) => ({
        label: platformLabels[platform],
        value: installedPwaDevices.filter((device) => device.platform === platform).length,
      })),
      weeklyDownloads: weekBuckets.map((start, index) => {
        const end = weekBuckets[index + 1] || new Date(now.getTime() + 86_400_000);
        return {
          label: start.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
          value: installedPwaDevices.filter(
            (device) => device.installedAt && device.installedAt >= start && device.installedAt < end,
          ).length,
        };
      }),
      recentDevices: pwaDevices.slice(0, 6).map((device) => ({
        id: device.id,
        platform: device.platform,
        browser: device.browser,
        os: device.os,
        installState: device.installState,
        displayMode: device.displayMode,
        pushPermission: device.pushPermission,
        hasUser: Boolean(device.userId),
        lastSeenAt: device.lastSeenAt.toISOString(),
        installedAt: device.installedAt?.toISOString() || null,
      })),
    },
    inventory: {
      articles: articles.length,
      ingredients: ingredients.length,
      media: mediaAssets,
    },
    topRecipes: recipes
      .slice()
      .filter((recipe) => recipe.views > 0 || recipe._count.Favorite > 0 || recipe._count.Review > 0)
      .sort(
        (first, second) =>
          second.views + second._count.Favorite * 3 + second._count.Review * 5 -
          (first.views + first._count.Favorite * 3 + first._count.Review * 5),
      )
      .slice(0, 5)
      .map((recipe) => ({
        id: recipe.id,
        title: recipe.title,
        views: recipe.views,
        favorites: recipe._count.Favorite,
        reviews: recipe._count.Review,
        published: recipe.isPublished,
      })),
    pipeline: [
      { label: "New", value: leads.filter((lead) => lead.status === ContactLeadStatus.NEW).length },
      {
        label: "Talking",
        value: leads.filter(
          (lead) =>
            lead.status === ContactLeadStatus.CONTACTED ||
            lead.status === ContactLeadStatus.INTERESTED ||
            lead.status === ContactLeadStatus.FOLLOW_UP,
        ).length,
      },
      {
        label: "Converted",
        value: leads.filter((lead) => lead.status === ContactLeadStatus.CONVERTED).length,
      },
      {
        label: "Closed",
        value: leads.filter(
          (lead) => lead.status === ContactLeadStatus.CLOSED || lead.status === ContactLeadStatus.NOT_INTERESTED,
        ).length,
      },
    ],
    queue: [
      {
        label: "Comments awaiting approval",
        value: comments.filter((comment) => !comment.isPublished).length,
        href: "/admin/community?tab=comments",
        tone: "amber",
      },
      {
        label: "Reviews awaiting approval",
        value: reviews.filter((review) => !review.isPublished).length,
        href: "/admin/community?tab=reviews",
        tone: "amber",
      },
      {
        label: "Fresh or follow-up leads",
        value: leads.filter((lead) => lead.status === ContactLeadStatus.NEW || lead.status === ContactLeadStatus.FOLLOW_UP)
          .length,
        href: "/admin/contact-queries",
        tone: "blue",
      },
      {
        label: "Payments processing",
        value: orders.filter((order) => order.paymentStatus === PaymentStatus.Processing).length,
        href: "/admin/orders",
        tone: "rose",
      },
    ],
    recentOrders: orders.slice(0, 4).map((order) => ({
      id: order.id,
      reference: order.orderId || `#${order.id.slice(-7).toUpperCase()}`,
      customer: order.user.name || "Member",
      plan: order.items[0]?.plan?.name || order.items[0]?.itemName || "Membership",
      amount: order.totalAmount || 0,
      currency: order.currency || "INR",
      status: order.paymentStatus,
      createdAt: order.createdAt.toISOString(),
    })),
  };

  return (
    <div className="p-3 sm:p-4 lg:p-5">
      <AdminDashboard data={dashboardData} />
    </div>
  );
};

export default DashboardPage;
