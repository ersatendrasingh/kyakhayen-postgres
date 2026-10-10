"use client";

import { BellRing, LoaderCircle, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { subscribeToPushNotifications, unsubscribeFromPushNotifications } from "@/lib/pwa-client";

export function PushNotificationSettings() {
  const [checking, setChecking] = useState(true);
  const [supported, setSupported] = useState(false);
  const [enabledByAdmin, setEnabledByAdmin] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const available =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    if (!available) {
      void Promise.resolve().then(() => setChecking(false));
      return;
    }

    void Promise.all([
      fetch("/api/push/public-key").then((response) => response.json()),
      navigator.serviceWorker
        .getRegistration()
        .then((registration) => registration?.pushManager.getSubscription() ?? null),
    ]).then(([configuration, subscription]) => {
      setChecking(false);
      setSupported(true);
      setPermission(Notification.permission);
      setEnabledByAdmin(Boolean(configuration.enabled));
      setSubscribed(Boolean(subscription));
    });
  }, []);

  async function enablePush() {
    try {
      setBusy(true);
      await subscribeToPushNotifications();
      setPermission(Notification.permission);
      setSubscribed(true);
      toast.success("Push notifications enabled on this device.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to enable push notifications.");
    } finally {
      setBusy(false);
    }
  }

  async function disablePush() {
    try {
      setBusy(true);
      await unsubscribeFromPushNotifications();
      setSubscribed(false);
      toast.success("Push notifications disabled on this device.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to disable push notifications.");
    } finally {
      setBusy(false);
    }
  }

  const status = checking
    ? "Checking notification support"
    : !supported
    ? "Not supported on this browser"
    : !enabledByAdmin
      ? "Waiting for admin VAPID configuration"
      : subscribed
        ? "Enabled on this device"
        : permission === "denied"
          ? "Blocked in browser permissions"
          : "Ready to enable";

  return (
    <section className="rounded-[1.8rem] border border-[#eadcc9] bg-[#fffdf8] p-5 dark:border-white/10 dark:bg-[#10231c] sm:p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#f6ead9] text-[#b63a2b] dark:bg-[#19352b] dark:text-[#dbb16f]">
            <BellRing className="size-5" />
          </div>
          <div>
            <h2 className="font-semibold text-[#31241c] dark:text-[#f2ede6]">Recipe notifications</h2>
            <p className="mt-1 max-w-lg text-sm text-[#7c6a5d] dark:text-[#a9b9af]">
              Receive meal-plan reminders, useful recipe drops and membership updates even when
              the app is closed.
            </p>
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#f6ead9] px-3 py-1 text-xs font-medium text-[#7c6a5d] dark:bg-white/5 dark:text-[#a9b9af]">
              <ShieldCheck className="size-3.5" />
              {status}
            </p>
          </div>
        </div>
        {subscribed ? (
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" onClick={() => void disablePush()} disabled={busy} className="rounded-xl">
              {busy ? <LoaderCircle className="animate-spin" /> : null}
              Disable
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => void enablePush()}
            disabled={!supported || !enabledByAdmin || busy}
            className="shrink-0 rounded-xl"
          >
            {busy ? <LoaderCircle className="animate-spin" /> : <BellRing />}
            Enable push
          </Button>
        )}
      </div>
    </section>
  );
}
