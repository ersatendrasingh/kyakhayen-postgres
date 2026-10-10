"use client";

import type { NotificationAudience, NotificationAutomationRule, NotificationCampaign } from "@prisma/client";
import {
  BellRing,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Eye,
  LoaderCircle,
  MousePointerClick,
  Send,
  Smartphone,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { MediaField } from "@/components/admin/media/media-field";
import { AutomationRulesPanel } from "@/components/admin/notifications/automation-rules-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Subscriber = {
  id: string;
  name: string | null;
  email: string | null;
  _count: { PushSubscription: number };
};
type Campaign = NotificationCampaign & {
  targetUser: { name: string | null; email: string | null } | null;
};
type SegmentOptions = {
  foodStyles: Array<{ id: string; name: string }>;
  cuisines: Array<{ id: string; title: string }>;
  mealTimes: Array<{ id: string; title: string }>;
};

function formatDate(value: Date | string | null) {
  return value
    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
    : "-";
}
function percent(value: number, total: number) {
  return total ? `${Math.round((value / total) * 100)}%` : "0%";
}
function sourceLabel(source: Campaign["source"]) {
  return source.toLowerCase().replaceAll("_", " ");
}

export function NotificationsDashboard({
  subscribers,
  campaigns,
  automationRules,
  segments,
  activeDevices,
  reachedRecently,
  scheduledCampaigns,
  deliveryTotals,
}: {
  subscribers: Subscriber[];
  campaigns: Campaign[];
  automationRules: NotificationAutomationRule[];
  segments: SegmentOptions;
  activeDevices: number;
  reachedRecently: number;
  scheduledCampaigns: number;
  deliveryTotals: { total: number; delivered: number; opened: number; clicked: number };
}) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [syncingExpiries, setSyncingExpiries] = useState(false);
  const [syncingTraffic, setSyncingTraffic] = useState(false);
  const [form, setForm] = useState({
    audience: "ALL_SUBSCRIBERS" as NotificationAudience,
    userId: "",
    segmentType: "FOOD_STYLE",
    segmentId: "",
    title: "",
    body: "",
    url: "/",
    imageUrl: null as string | null,
    scheduledAt: "",
  });

  async function submitCampaign() {
    try {
      setSending(true);
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : "",
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(typeof result === "string" ? result : "Unable to send notification.");
      toast.success(form.scheduledAt ? "Broadcast scheduled successfully." : "Notification campaign processed.");
      setForm((current) => ({ ...current, title: "", body: "", imageUrl: null, scheduledAt: "" }));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send notification.");
    } finally {
      setSending(false);
    }
  }

  async function syncExpiryReminders() {
    try {
      setSyncingExpiries(true);
      const response = await fetch("/api/admin/notifications/sync-expiry-reminders", { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(typeof result === "string" ? result : "Unable to sync reminders.");
      toast.success(`${result.scheduled} active membership expiry schedules synced.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to sync reminders.");
    } finally {
      setSyncingExpiries(false);
    }
  }

  async function syncTrafficRules() {
    try {
      setSyncingTraffic(true);
      const response = await fetch("/api/admin/notifications/sync-traffic-rules", { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(typeof result === "string" ? result : "Unable to sync traffic rules.");
      toast.success(`${result.scheduled} recipe traffic schedules queued.`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to sync traffic rules.");
    } finally {
      setSyncingTraffic(false);
    }
  }

  const currentSegments = form.segmentType === "CUISINE" ? segments.cuisines : segments.foodStyles;

  return (
    <div className="space-y-6">
      <section className="admin-taxonomy-hero rounded-[32px] p-5 sm:p-7 lg:p-9">
        <div className="relative z-[1] max-w-3xl">
          <span className="admin-taxonomy-hero-badge inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]">
            <BellRing className="size-3.5" /> Engagement command center
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Notification broadcasting</h1>
          <p className="admin-taxonomy-hero-copy mt-3 text-sm sm:text-base">
            Automate useful lifecycle nudges, schedule campaigns and measure accepted delivery, opens and clicks.
          </p>
        </div>
        <div className="relative z-[1] mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <Stat icon={UsersRound} label="Subscribers" value={subscribers.length} />
          <Stat icon={Smartphone} label="Devices" value={activeDevices} />
          <Stat icon={CheckCircle2} label="Delivered" value={deliveryTotals.delivered} />
          <Stat icon={Eye} label="Opened" value={deliveryTotals.opened} />
          <Stat icon={MousePointerClick} label="Clicks" value={deliveryTotals.clicked} />
          <Stat icon={Sparkles} label="CTR" value={percent(deliveryTotals.clicked, deliveryTotals.delivered)} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(450px,1fr)_minmax(500px,1.2fr)]">
        <section className="rounded-[28px] border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Compose broadcast</h2>
              <p className="mt-1 text-sm text-muted-foreground">Send now or schedule a thoughtful notification for later.</p>
            </div>
            <Badge variant="outline">VAPID Push</Badge>
          </div>
          <div className="mt-6 space-y-4">
            <Field label="Audience">
              <Select
                value={form.audience}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    audience: value as NotificationAudience,
                    userId: "",
                    segmentId: "",
                  }))
                }
              >
                <SelectTrigger className="!h-12 w-full rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_SUBSCRIBERS">All subscribed users</SelectItem>
                  <SelectItem value="USER">A particular user</SelectItem>
                  <SelectItem value="PREFERENCE_SEGMENT">Matching food preference</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {form.audience === "USER" && (
              <Field label="Customer">
                <Select value={form.userId} onValueChange={(userId) => setForm((current) => ({ ...current, userId }))}>
                  <SelectTrigger className="!h-12 w-full rounded-xl"><SelectValue placeholder="Select subscribed customer" /></SelectTrigger>
                  <SelectContent>
                    {subscribers.map((subscriber) => (
                      <SelectItem key={subscriber.id} value={subscriber.id}>
                        {subscriber.name || subscriber.email || "Customer"} ({subscriber._count.PushSubscription} devices)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
            {form.audience === "PREFERENCE_SEGMENT" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Match by">
                  <Select value={form.segmentType} onValueChange={(segmentType) => setForm((current) => ({ ...current, segmentType, segmentId: "" }))}>
                    <SelectTrigger className="!h-12 w-full rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FOOD_STYLE">Food style</SelectItem>
                      <SelectItem value="CUISINE">Favourite cuisine</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Preference">
                  <Select value={form.segmentId} onValueChange={(segmentId) => setForm((current) => ({ ...current, segmentId }))}>
                    <SelectTrigger className="!h-12 w-full rounded-xl"><SelectValue placeholder="Choose value" /></SelectTrigger>
                    <SelectContent>
                      {currentSegments.map((segment) => (
                        <SelectItem key={segment.id} value={segment.id}>
                          {"title" in segment ? segment.title : segment.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            )}
            <Field label="Title">
              <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Your weekly meal plan is ready" className="h-12 rounded-xl" maxLength={120} />
            </Field>
            <Field label="Message">
              <Textarea value={form.body} onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))} placeholder="Seven balanced dishes are waiting. Open your plan to start cooking." className="min-h-28 rounded-xl" maxLength={300} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Open link">
                <Input value={form.url} onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))} placeholder="/meal-plan" className="h-12 rounded-xl" />
              </Field>
              <Field label="Schedule (optional)">
                <Input type="datetime-local" value={form.scheduledAt} onChange={(event) => setForm((current) => ({ ...current, scheduledAt: event.target.value }))} className="h-12 rounded-xl" />
              </Field>
            </div>
            <MediaField
              label="Notification image (optional)"
              value={form.imageUrl}
              onChange={(imageUrl) => setForm((current) => ({ ...current, imageUrl }))}
              accept="image"
              disabled={sending}
              description="Choose from the media library for rich push previews"
            />
            <Button
              className="h-12 w-full rounded-xl"
              onClick={() => void submitCampaign()}
              disabled={sending || !form.title.trim() || !form.body.trim() || (form.audience === "USER" && !form.userId) || (form.audience === "PREFERENCE_SEGMENT" && !form.segmentId)}
            >
              {sending ? <LoaderCircle className="animate-spin" /> : form.scheduledAt ? <CalendarClock /> : <Send />}
              {form.scheduledAt ? "Schedule notification" : "Send notification now"}
            </Button>
          </div>
        </section>

        <section className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <MiniMetric label="Reached in 30 days" value={reachedRecently} icon={Clock3} />
            <MiniMetric label="Queued campaigns" value={scheduledCampaigns} icon={CalendarClock} />
            <MiniMetric label="Open rate" value={percent(deliveryTotals.opened, deliveryTotals.delivered)} icon={Eye} />
          </div>
          <AutomationRulesPanel rules={automationRules} segments={segments} />
          <TrafficSyncPanel syncingTraffic={syncingTraffic} onSyncTraffic={() => void syncTrafficRules()} />
          <ExpirySyncPanel syncingExpiries={syncingExpiries} onSyncExpiries={() => void syncExpiryReminders()} />
          <section className="rounded-[28px] border bg-card p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-semibold">Broadcast report</h2>
            <p className="mt-1 text-sm text-muted-foreground">Delivery is push-service accepted; opened and clicked record notification interaction.</p>
            <div className="mt-5 space-y-3">
              {campaigns.map((campaign) => (
                <CampaignReport key={campaign.id} campaign={campaign} />
              ))}
              {!campaigns.length && (
                <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Campaign reporting will appear here after your first automated or manual notification.
                </p>
              )}
            </div>
          </section>
        </section>
      </div>
    </div>
  );
}

function TrafficSyncPanel({
  syncingTraffic,
  onSyncTraffic,
}: {
  syncingTraffic: boolean;
  onSyncTraffic: () => void;
}) {
  return (
    <section className="rounded-[24px] border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/35 px-4 py-3">
        <p className="text-xs text-muted-foreground">Queue active recipe traffic rules after edits, deploys or worker restarts.</p>
        <Button variant="outline" size="sm" onClick={onSyncTraffic} disabled={syncingTraffic}>
          {syncingTraffic ? <LoaderCircle className="animate-spin" /> : <CalendarClock />}
          Sync recipe traffic
        </Button>
      </div>
    </section>
  );
}

function ExpirySyncPanel({
  syncingExpiries,
  onSyncExpiries,
}: {
  syncingExpiries: boolean;
  onSyncExpiries: () => void;
}) {
  return (
    <section className="rounded-[24px] border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/35 px-4 py-3">
        <p className="text-xs text-muted-foreground">Backfill expiry schedules for memberships created before automation was enabled.</p>
        <Button variant="outline" size="sm" onClick={onSyncExpiries} disabled={syncingExpiries}>
          {syncingExpiries ? <LoaderCircle className="animate-spin" /> : <CalendarClock />}
          Sync existing memberships
        </Button>
      </div>
    </section>
  );
}

function CampaignReport({ campaign }: { campaign: Campaign }) {
  return (
    <article className="rounded-2xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{campaign.title}</p>
            <Badge variant={campaign.status === "SENT" ? "default" : "secondary"}>{campaign.status.toLowerCase()}</Badge>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{campaign.body}</p>
          <p className="mt-2 text-xs capitalize text-muted-foreground">
            {sourceLabel(campaign.source)} | {campaign.sentAt ? `Sent ${formatDate(campaign.sentAt)}` : `Scheduled ${formatDate(campaign.scheduledAt)}`}
          </p>
        </div>
        <Badge variant="outline">
          {campaign.audience === "USER"
            ? campaign.targetUser?.name || "Customer"
            : campaign.audience === "PREFERENCE_SEGMENT"
              ? "Preference"
              : "Everyone"}
        </Badge>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
        <Metric label="Total" value={campaign.totalRecipients} />
        <Metric label="Delivered" value={campaign.successfulDeliveries} />
        <Metric label="Failed" value={campaign.failedDeliveries} danger={campaign.failedDeliveries > 0} />
        <Metric label="Opened" value={campaign.openedCount} />
        <Metric label="Clicked" value={campaign.clickedCount} />
        <Metric label="CTR" value={percent(campaign.clickedCount, campaign.successfulDeliveries)} />
      </div>
    </article>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
function Stat({ icon: Icon, label, value }: { icon: typeof BellRing; label: string; value: number | string }) {
  return (
    <div className="admin-taxonomy-stat rounded-3xl px-5 py-5">
      <div className="flex items-center justify-between"><p className="admin-taxonomy-stat-label text-sm">{label}</p><Icon className="admin-taxonomy-stat-icon size-5" /></div>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </div>
  );
}
function MiniMetric({ icon: Icon, label, value }: { icon: typeof BellRing; label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <Icon className="size-5 text-[#c78929]" />
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
function Metric({ label, value, danger }: { label: string; value: number | string; danger?: boolean }) {
  return (
    <div className="rounded-xl bg-muted/35 p-2.5 text-center">
      <p className={danger ? "font-semibold text-rose-600" : "font-semibold"}>{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
