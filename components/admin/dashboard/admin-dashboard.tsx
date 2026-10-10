import type { PaymentStatus } from "@prisma/client";
import {
  ArrowRight,
  ArrowUpRight,
  BellRing,
  BookOpenText,
  ChartNoAxesCombined,
  ChefHat,
  CircleAlert,
  Crown,
  Download,
  Eye,
  Images,
  IndianRupee,
  MessageSquareText,
  Smartphone,
  Sparkles,
  Star,
  UserPlus,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type DataPoint = { label: string; value: number };

export type AdminDashboardData = {
  generatedAt: string;
  stats: {
    paidRevenue: number;
    paidOrders: number;
    totalUsers: number;
    activeMembers: number;
    publishedRecipes: number;
    totalRecipes: number;
    actionItems: number;
  };
  revenue: Array<DataPoint & { orders: number }>;
  registrations: DataPoint[];
  audience: {
    active: number;
    personalised: number;
    verified: number;
    setupPending: number;
  };
  health: Array<DataPoint & { total: number; href: string }>;
  publishing: { readyDrafts: number };
  subscriptions: {
    assignments: number;
    memberUsers: number;
    pricedAccess: number;
    expiringSoon: number;
    noExpiry: number;
    plans: Array<DataPoint & { paid: boolean }>;
  };
  pwa: {
    downloadsTotal: number;
    downloadsThisWeek: number;
    registeredThisWeek: number;
    activeSubscribers: number;
    subscribersThisWeek: number;
    linkedDevices: number;
    anonymousDevices: number;
    activeDevicesThisWeek: number;
    promptShownThisWeek: number;
    promptAcceptedThisWeek: number;
    promptDismissedThisWeek: number;
    trackingReady: boolean;
    platformDownloads: DataPoint[];
    weeklyDownloads: DataPoint[];
    recentDevices: Array<{
      id: string;
      platform: string;
      browser: string | null;
      os: string | null;
      installState: string;
      displayMode: string | null;
      pushPermission: string | null;
      hasUser: boolean;
      lastSeenAt: string;
      installedAt: string | null;
    }>;
  };
  inventory: { articles: number; ingredients: number; media: number };
  topRecipes: Array<{
    id: string;
    title: string;
    views: number;
    favorites: number;
    reviews: number;
    published: boolean;
  }>;
  pipeline: DataPoint[];
  queue: Array<{
    label: string;
    value: number;
    href: string;
    tone: "amber" | "blue" | "rose";
  }>;
  recentOrders: Array<{
    id: string;
    reference: string;
    customer: string;
    plan: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    createdAt: string;
  }>;
};

function money(value: number, currency = "INR") {
  return new Intl.NumberFormat(currency === "USD" ? "en-US" : "en-IN", {
    style: "currency",
    currency: currency === "USD" ? "USD" : "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function compact(value: number) {
  return new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function day(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(value));
}

function percentage(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}

function statusTone(status: PaymentStatus) {
  if (status === "Paid" || status === "Success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300";
  }
  if (status === "Processing") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300";
  }
  return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300";
}

export function AdminDashboard({ data }: { data: AdminDashboardData }) {
  const publishRate = percentage(data.stats.publishedRecipes, data.stats.totalRecipes);
  const memberRate = percentage(data.stats.activeMembers, data.stats.totalUsers);
  const totalLeads = data.pipeline.reduce((total, stage) => total + stage.value, 0);

  return (
    <div className="space-y-4">
      <section className="admin-taxonomy-hero rounded-3xl p-4 sm:p-5 lg:p-6">
        <div className="relative z-[1] flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-3">
            <span className="admin-taxonomy-hero-badge inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]">
              <Sparkles className="size-3.5" />
              Operations Cockpit
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
                Namaste, admin. Your kitchen is moving.
              </h1>
              <p className="admin-taxonomy-hero-copy mt-2 max-w-2xl text-sm leading-6">
                Sales, subscriptions, editorial quality and customer conversations in one calm
                view. Prioritise the work that grows Kya Khayen today.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row xl:flex-col">
            <Button asChild className="h-10 rounded-xl px-4">
              <Link href="/admin/recipes">
                <ChefHat />
                Manage recipes
              </Link>
            </Button>
            <Button asChild variant="outline" className="admin-taxonomy-hero-action h-10 rounded-xl px-4">
              <Link href="/admin/contact-queries">
                <MessageSquareText />
                Open lead inbox
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative z-[1] mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <HeroStat
            icon={IndianRupee}
            label="Paid revenue"
            value={money(data.stats.paidRevenue)}
            note={`${data.stats.paidOrders} confirmed payments`}
          />
          <HeroStat
            icon={Crown}
            label="Active members"
            value={compact(data.stats.activeMembers)}
            note={`${memberRate}% of registered users`}
          />
          <HeroStat
            icon={ChefHat}
            label="Published recipes"
            value={compact(data.stats.publishedRecipes)}
            note={`${publishRate}% catalog live`}
          />
          <HeroStat
            icon={CircleAlert}
            label="Needs attention"
            value={compact(data.stats.actionItems)}
            note="Approvals, leads and payments"
          />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(325px,1fr)]">
        <section className="rounded-3xl border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Commerce</p>
              <h2 className="mt-2 text-xl font-semibold">Paid revenue pulse</h2>
              <p className="mt-1 text-sm text-muted-foreground">INR collections over the last six months.</p>
            </div>
            <Button variant="outline" asChild className="rounded-xl">
              <Link href="/admin/orders">
                View orders <ArrowUpRight />
              </Link>
            </Button>
          </div>
          <RevenueBars points={data.revenue} />
        </section>

        <section className="rounded-3xl border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Action Center</p>
              <h2 className="mt-2 text-xl font-semibold">Today&apos;s queue</h2>
            </div>
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CircleAlert className="size-5" />
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {data.queue.map((item) => (
              <QueueRow key={item.label} {...item} />
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.85fr)]">
        <section className="rounded-3xl border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">PWA App</p>
              <h2 className="mt-2 text-xl font-semibold">Downloads and push reach</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {data.pwa.trackingReady
                  ? "Install signals, signups and notification-ready devices."
                  : "Push subscribers are counted; install tracking will fill after migration."}
              </p>
            </div>
            <Button variant="outline" asChild className="rounded-xl">
              <Link href="/admin/notifications">
                Notifications <ArrowUpRight />
              </Link>
            </Button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <PwaMetric
              icon={Download}
              label="Total installs"
              value={data.pwa.downloadsTotal}
              note={data.pwa.trackingReady ? `${data.pwa.downloadsThisWeek} this week` : "tracking pending"}
            />
            <PwaMetric icon={UserPlus} label="Registrations" value={data.pwa.registeredThisWeek} note="new users this week" />
            <PwaMetric icon={BellRing} label="Push subscribers" value={data.pwa.activeSubscribers} note={`${data.pwa.subscribersThisWeek} new this week`} />
            <PwaMetric icon={Smartphone} label="Active devices" value={data.pwa.activeDevicesThisWeek} note="seen this week" />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            <PwaDownloadBars points={data.pwa.weeklyDownloads} />
            <div className="space-y-3">
              <PwaPlatformMix points={data.pwa.platformDownloads} total={data.pwa.downloadsTotal} />
              <div className="rounded-2xl border border-dashed p-3">
                <p className="text-sm font-semibold">Prompt response this week</p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <TinyStat label="Shown" value={data.pwa.promptShownThisWeek} />
                  <TinyStat label="Accepted" value={data.pwa.promptAcceptedThisWeek} />
                  <TinyStat label="Dismissed" value={data.pwa.promptDismissedThisWeek} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Device Details</p>
              <h2 className="mt-2 text-xl font-semibold">Latest app opens</h2>
            </div>
            <Smartphone className="size-5 text-webprimary" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <SubscriptionStat label="Linked" value={data.pwa.linkedDevices} tone="emerald" />
            <SubscriptionStat label="Anonymous" value={data.pwa.anonymousDevices} tone="blue" />
          </div>
          <div className="mt-5 space-y-3">
            {data.pwa.recentDevices.map((device) => (
              <div key={device.id} className="rounded-2xl border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {pwaPlatformLabel(device.platform)} {device.browser ? `- ${device.browser}` : ""}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {device.os || "Unknown OS"} · {device.displayMode || "browser"} · {device.hasUser ? "registered" : "anonymous"}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 capitalize">
                    {device.installState.toLowerCase()}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>{device.pushPermission || "permission unknown"}</span>
                  <span>{day(device.lastSeenAt)}</span>
                </div>
              </div>
            ))}
            {!data.pwa.recentDevices.length && <EmptyState label="PWA devices will appear after visitors install or open the app." />}
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(350px,1.08fr)_minmax(350px,1fr)_minmax(300px,0.9fr)]">
        <section className="rounded-3xl border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Audience</p>
              <h2 className="mt-2 text-xl font-semibold">Member growth</h2>
            </div>
            <UsersRound className="size-5 text-webprimary" />
          </div>
          <RegistrationLine points={data.registrations} />
          <div className="mt-5 grid grid-cols-3 gap-2 border-t pt-5 text-center">
            <TinyStat label="Active" value={data.audience.active} />
            <TinyStat label="Verified" value={data.audience.verified} />
            <TinyStat label="Set up" value={data.audience.personalised} />
          </div>
          <Link
            href="/admin/users"
            className="mt-5 flex items-center justify-between rounded-2xl border bg-muted/25 p-3.5 text-sm transition-colors hover:bg-muted/45"
          >
            <span className="text-muted-foreground">Personalisation still pending</span>
            <span className="font-semibold text-amber-600 dark:text-amber-300">{data.audience.setupPending}</span>
          </Link>
          <div className="mt-3 rounded-2xl border border-dashed px-3.5 py-3">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="text-muted-foreground">Onboarding completion</span>
              <span className="font-semibold">{percentage(data.audience.personalised, data.stats.totalUsers)}%</span>
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-webprimary to-primary"
                style={{ width: `${percentage(data.audience.personalised, data.stats.totalUsers)}%` }}
              />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Publishing</p>
              <h2 className="mt-2 text-xl font-semibold">Content readiness</h2>
            </div>
            <BookOpenText className="size-5 text-webprimary" />
          </div>
          <div className="mt-6 space-y-5">
            {data.health.map((health) => (
              <Link key={health.label} href={health.href} className="group block space-y-2">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="font-medium transition-colors group-hover:text-primary">{health.label}</span>
                  <span className="text-muted-foreground">
                    {health.value}/{health.total}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-webprimary transition-all"
                    style={{ width: `${percentage(health.value, health.total)}%` }}
                  />
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-6 flex gap-3 border-t pt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><BookOpenText className="size-3.5" /> {data.inventory.articles} stories</span>
            <span className="flex items-center gap-1"><ChefHat className="size-3.5" /> {data.inventory.ingredients} ingredients</span>
            <span className="flex items-center gap-1"><Images className="size-3.5" /> {data.inventory.media} assets</span>
          </div>
          <Link
            href="/admin/recipes"
            className="mt-5 flex items-center justify-between rounded-2xl border border-primary/15 bg-primary/[0.04] p-3.5 transition-colors hover:bg-primary/[0.08]"
          >
            <span className="text-sm text-muted-foreground">Complete drafts ready to review</span>
            <span className="flex items-center gap-1 text-sm font-semibold text-primary">
              {data.publishing.readyDrafts} <ArrowRight className="size-3.5" />
            </span>
          </Link>
        </section>

        <section className="rounded-3xl border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Subscriptions</p>
              <h2 className="mt-2 text-xl font-semibold">Access health</h2>
            </div>
            <Button size="icon-sm" variant="ghost" asChild className="rounded-xl">
              <Link href="/admin/subscription-plans" aria-label="Open subscription plans"><ArrowUpRight /></Link>
            </Button>
          </div>
          <MembershipMix subscriptions={data.subscriptions} totalUsers={data.stats.totalUsers} />
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(380px,1.15fr)_minmax(320px,0.88fr)_minmax(380px,1.1fr)]">
        <section className="rounded-3xl border bg-card p-4 shadow-sm sm:p-5">
          <PanelHeading title="Most discovered recipes" eyebrow="Engagement" href="/admin/recipes" />
          <div className="mt-5 space-y-3">
            {data.topRecipes.map((recipe, index) => (
              <Link
                key={recipe.id}
                href={`/admin/recipes/${recipe.id}`}
                className="flex items-center gap-3 rounded-2xl border border-transparent p-2.5 transition-colors hover:border-border hover:bg-muted/35"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-sm font-semibold text-muted-foreground">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{recipe.title}</span>
                  <span className="mt-1 flex gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="size-3" /> {compact(recipe.views)}</span>
                    <span className="flex items-center gap-1"><Star className="size-3" /> {recipe.reviews}</span>
                    <span>{recipe.favorites} saves</span>
                  </span>
                </span>
                <span className={`size-2 rounded-full ${recipe.published ? "bg-emerald-500" : "bg-amber-500"}`} />
              </Link>
            ))}
            {!data.topRecipes.length && <EmptyState label="No recipe engagement has been tracked yet." />}
          </div>
        </section>

        <section className="rounded-3xl border bg-card p-4 shadow-sm sm:p-5">
          <PanelHeading title="Lead pipeline" eyebrow="CRM" href="/admin/contact-queries" />
          <Pipeline stages={data.pipeline} total={totalLeads} />
        </section>

        <section className="rounded-3xl border bg-card p-4 shadow-sm sm:p-5">
          <PanelHeading title="Latest orders" eyebrow="Payments" href="/admin/orders" />
          <div className="mt-5 space-y-3">
            {data.recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center justify-between gap-4 rounded-2xl border p-3.5 transition-colors hover:bg-muted/35"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{order.customer}</span>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">
                    {order.plan} · {order.reference} · {day(order.createdAt)}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-semibold">{money(order.amount, order.currency)}</span>
                  <Badge variant="outline" className={`mt-1 ${statusTone(order.status)}`}>
                    {order.status}
                  </Badge>
                </span>
              </Link>
            ))}
            {!data.recentOrders.length && <EmptyState label="Orders will appear here after checkout." />}
          </div>
        </section>
      </div>

      <p className="text-right text-xs text-muted-foreground">
        Snapshot refreshed {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(data.generatedAt))}
      </p>
    </div>
  );
}

function HeroStat({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof IndianRupee;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="admin-taxonomy-stat rounded-2xl px-4 py-4 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <p className="admin-taxonomy-stat-label text-sm font-medium">{label}</p>
        <Icon className="admin-taxonomy-stat-icon size-5" />
      </div>
      <p className="admin-taxonomy-stat-value mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

function PwaMetric({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof IndianRupee;
  label: string;
  value: number;
  note: string;
}) {
  return (
    <div className="rounded-2xl border bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <Icon className="size-4 text-primary" />
      </div>
      <p className="mt-2 text-xl font-semibold">{compact(value)}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{note}</p>
    </div>
  );
}

function PwaDownloadBars({ points }: { points: DataPoint[] }) {
  const maximum = Math.max(...points.map((point) => point.value), 1);
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">Weekly installs</p>
        <p className="text-xs text-muted-foreground">last {points.length} weeks</p>
      </div>
      <div className="mt-4 flex h-32 items-end gap-2">
        {points.map((point) => (
          <div key={point.label} className="group flex h-full flex-1 flex-col justify-end gap-2">
            <div className="relative flex flex-1 items-end">
              <div className="absolute bottom-full mb-2 hidden rounded-xl border bg-popover px-2.5 py-1.5 text-xs shadow-md group-hover:block">
                {point.value} installs
              </div>
              <div
                className={`w-full rounded-t-xl ${point.value ? "bg-primary" : "bg-muted"}`}
                style={{ height: `${point.value ? Math.max(8, (point.value / maximum) * 100) : 2}%` }}
              />
            </div>
            <p className="truncate text-center text-[10px] text-muted-foreground">{point.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PwaPlatformMix({ points, total }: { points: DataPoint[]; total: number }) {
  return (
    <div className="rounded-2xl border p-3">
      <p className="text-sm font-semibold">Platform split</p>
      <div className="mt-4 space-y-3">
        {points.map((point) => (
          <div key={point.label}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
              <span>{point.label}</span>
              <span className="font-semibold">{point.value}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-webprimary" style={{ width: `${percentage(point.value, total)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function pwaPlatformLabel(platform: string) {
  if (platform === "ANDROID") return "Android";
  if (platform === "IOS") return "iOS";
  if (platform === "DESKTOP") return "Desktop";
  return "Unknown";
}

function RevenueBars({ points }: { points: Array<DataPoint & { orders: number }> }) {
  const maximum = Math.max(...points.map((point) => point.value), 1);
  return (
    <div className="mt-6 flex h-52 items-end gap-3 sm:gap-4">
      {points.map((point) => (
        <div key={point.label} className="group flex h-full flex-1 flex-col justify-end gap-3">
          <div className="relative flex flex-1 items-end justify-center">
            <div className="absolute bottom-full mb-2 hidden rounded-xl border bg-popover px-3 py-2 text-xs shadow-md group-hover:block">
              <p className="font-semibold">{money(point.value)}</p>
              <p className="text-muted-foreground">{point.orders} orders</p>
            </div>
            <div
              className={`w-full max-w-[74px] rounded-t-[18px] transition-[height,filter] duration-500 ${
                point.value ? "bg-gradient-to-t from-primary to-webprimary group-hover:brightness-110" : "bg-muted"
              }`}
              style={{ height: `${point.value ? Math.max(12, (point.value / maximum) * 100) : 2}%` }}
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">{point.label}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{point.orders} paid</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function QueueRow({
  label,
  value,
  href,
  tone,
}: {
  label: string;
  value: number;
  href: string;
  tone: "amber" | "blue" | "rose";
}) {
  const colors = {
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  };
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-2xl border p-3.5 transition-colors hover:bg-muted/35">
      <span className={`flex size-10 items-center justify-center rounded-xl text-lg font-semibold ${colors[tone]}`}>
        {value}
      </span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function RegistrationLine({ points }: { points: DataPoint[] }) {
  const maximum = Math.max(...points.map((point) => point.value), 1);
  const coordinates = points.map((point, index) => ({
    x: (index / Math.max(points.length - 1, 1)) * 100,
    y: 88 - (point.value / maximum) * 68,
  }));
  const line = coordinates.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `0,100 ${line} 100,100`;
  return (
    <div className="mt-6">
      <div className="h-[125px]">
        <svg className="h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="member-area" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="var(--primary)" stopOpacity="0.25" />
              <stop offset="1" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`M ${area.replaceAll(" ", " L ")} Z`} fill="url(#member-area)" />
          <polyline points={line} fill="none" stroke="var(--primary)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          {coordinates.map((point, index) => (
            <circle key={points[index].label} cx={point.x} cy={point.y} r="2.5" fill="var(--card)" stroke="var(--primary)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
        <span>{points[0]?.label}</span>
        <span>{points.at(-1)?.label}</span>
      </div>
    </div>
  );
}

function TinyStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-lg font-semibold">{compact(value)}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function MembershipMix({
  subscriptions,
  totalUsers,
}: {
  subscriptions: AdminDashboardData["subscriptions"];
  totalUsers: number;
}) {
  const coverage = percentage(subscriptions.memberUsers, totalUsers);
  const palette = ["bg-primary", "bg-webprimary", "bg-[var(--chart-3)]", "bg-[var(--chart-4)]"];
  const chartPalette = ["var(--primary)", "var(--webprimary)", "var(--chart-3)", "var(--chart-4)"];
  const chartPlans = subscriptions.plans.slice(0, 4);
  const chartSegments = chartPlans.map((plan, index) => {
    const start =
      (chartPlans.slice(0, index).reduce((total, current) => total + current.value, 0) /
        Math.max(subscriptions.assignments, 1)) *
      100;
    const end = start + (plan.value / Math.max(subscriptions.assignments, 1)) * 100;
    return `${chartPalette[index]} ${start}% ${end}%`;
  });
  return (
    <>
      <div className="mt-5 flex items-center gap-4 rounded-2xl border bg-muted/20 p-4">
        <div
          className="flex size-24 shrink-0 items-center justify-center rounded-full"
          style={{
            background: chartSegments.length ? `conic-gradient(${chartSegments.join(", ")})` : "var(--muted)",
          }}
        >
          <div className="flex size-[66px] flex-col items-center justify-center rounded-full bg-card shadow-sm">
            <span className="text-xl font-semibold">{subscriptions.memberUsers}</span>
            <span className="text-[10px] text-muted-foreground">members</span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">Members with active access</p>
          <p className="mt-1 text-lg font-semibold text-primary">{coverage}% coverage</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-webprimary" style={{ width: `${coverage}%` }} />
          </div>
          <p className="mt-2 text-[11px] leading-4 text-muted-foreground">
            {subscriptions.assignments} plan assignments across {totalUsers} users
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <SubscriptionStat label="Priced" value={subscriptions.pricedAccess} tone="emerald" />
        <SubscriptionStat label="Ending 7d" value={subscriptions.expiringSoon} tone="amber" />
        <SubscriptionStat label="No expiry" value={subscriptions.noExpiry} tone="blue" />
      </div>

      <div className="mt-5 space-y-3 border-t pt-4">
        {subscriptions.plans.slice(0, 4).map((plan, index) => (
          <div key={plan.label}>
            <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span className={`size-2.5 shrink-0 rounded-full ${palette[index] || "bg-muted-foreground"}`} />
                <span className="truncate">{plan.label}</span>
                {plan.paid && <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-300">Paid</span>}
              </span>
              <span className="font-semibold">{plan.value}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className={`h-full rounded-full ${palette[index] || "bg-muted-foreground"}`} style={{ width: `${percentage(plan.value, subscriptions.assignments)}%` }} />
            </div>
          </div>
        ))}
        {!subscriptions.plans.length && <p className="text-sm text-muted-foreground">No active memberships yet.</p>}
      </div>
      <Button variant="outline" asChild className="mt-5 w-full rounded-xl">
        <Link href="/admin/users">Review member access <ArrowRight /></Link>
      </Button>
    </>
  );
}

function SubscriptionStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "amber" | "blue";
}) {
  const colors = {
    emerald: "text-emerald-600 dark:text-emerald-300",
    amber: "text-amber-600 dark:text-amber-300",
    blue: "text-blue-600 dark:text-blue-300",
  };
  return (
    <div className="rounded-xl border bg-muted/20 px-2 py-3 text-center">
      <p className={`text-lg font-semibold ${colors[tone]}`}>{value}</p>
      <p className="mt-0.5 text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function PanelHeading({ title, eyebrow, href }: { title: string; eyebrow: string; href: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p>
        <h2 className="mt-2 text-xl font-semibold">{title}</h2>
      </div>
      <Button size="icon-sm" variant="ghost" asChild className="rounded-xl">
        <Link href={href} aria-label={`Open ${title}`}><ArrowUpRight /></Link>
      </Button>
    </div>
  );
}

function Pipeline({ stages, total }: { stages: DataPoint[]; total: number }) {
  const shades = ["bg-amber-400", "bg-blue-500", "bg-emerald-500", "bg-slate-400"];
  return (
    <div className="mt-6">
      <div className="flex h-3 overflow-hidden rounded-full bg-muted">
        {stages.map((stage, index) => (
          <div
            key={stage.label}
            className={shades[index]}
            style={{ width: `${percentage(stage.value, total)}%` }}
          />
        ))}
      </div>
      <div className="mt-6 space-y-4">
        {stages.map((stage, index) => (
          <div key={stage.label} className="flex items-center gap-3">
            <span className={`size-2.5 rounded-full ${shades[index]}`} />
            <p className="flex-1 text-sm text-muted-foreground">{stage.label}</p>
            <p className="text-sm font-semibold">{stage.value}</p>
            <p className="w-10 text-right text-xs text-muted-foreground">{percentage(stage.value, total)}%</p>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl bg-muted/40 p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ChartNoAxesCombined className="size-4 text-primary" />
          Conversion health
        </div>
        <p className="mt-2 text-2xl font-semibold">
          {percentage(stages[2]?.value || 0, total)}%
        </p>
        <p className="text-xs text-muted-foreground">of captured leads converted</p>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <p className="mt-5 rounded-2xl border border-dashed p-4 text-center text-sm text-muted-foreground">
      {label}
    </p>
  );
}
