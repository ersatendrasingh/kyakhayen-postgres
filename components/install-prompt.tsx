"use client";

import { BellRing, Download, LoaderCircle, X } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  getCurrentPushSubscription,
  isPwaStandalone,
  subscribeToPushNotifications,
  trackPwaEvent,
} from "@/lib/pwa-client";

type InstallChoice = {
  outcome: "accepted" | "dismissed";
  platform: string;
};

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallChoice>;
}

const DISMISSED_UNTIL_KEY = "kyakhayen-install-dismissed-until";
const NOTIFICATION_DISMISSED_UNTIL_KEY = "kyakhayen-pwa-notification-dismissed-until";
const VISITED_TRACKED_KEY = "kyakhayen-pwa-visit-tracked";
const STANDALONE_TRACKED_KEY = "kyakhayen-pwa-standalone-tracked";
const DISMISS_MS = 14 * 24 * 60 * 60 * 1000;
const INSTALLED_MS = 365 * 24 * 60 * 60 * 1000;

function isMobileBrowser() {
  return window.matchMedia("(max-width: 767px)").matches;
}

function storageValue(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setStorageValue(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage errors in private browsing.
  }
}

function isSuppressed(key: string) {
  return Number(storageValue(key) || 0) > Date.now();
}

function suppressFor(key: string, ms: number) {
  setStorageValue(key, String(Date.now() + ms));
}

function shouldSkipPath(pathname: string) {
  return pathname === "/download-app" || pathname.startsWith("/admin") || pathname.startsWith("/auth");
}

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [notificationBusy, setNotificationBusy] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (
      process.env.NODE_ENV !== "development" ||
      process.env.NEXT_PUBLIC_CLEAR_DEV_PWA_CACHE !== "true" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    void (async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));

      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
      }
    })().catch(() => {
      // Keep this cleanup opt-in because unregistering the service worker also removes push support.
    });
  }, []);

  useEffect(() => {
    if (shouldSkipPath(pathname)) return;

    if (!storageValue(VISITED_TRACKED_KEY)) {
      setStorageValue(VISITED_TRACKED_KEY, "1");
      void trackPwaEvent("VISITED");
    }

    async function prepareNotificationPrompt(allowBrowserMode = false) {
      if (
        isSuppressed(NOTIFICATION_DISMISSED_UNTIL_KEY) ||
        (!allowBrowserMode && !isPwaStandalone()) ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window) ||
        Notification.permission === "denied"
      ) {
        return;
      }

      const registration = await navigator.serviceWorker.getRegistration().catch(() => null);
      if (!registration) return;

      const [configuration, existingSubscription] = await Promise.all([
        fetch("/api/push/public-key").then((response) => response.json()).catch(() => null),
        getCurrentPushSubscription().catch(() => null),
      ]);
      if (configuration?.enabled && !existingSubscription) {
        setShowNotificationPrompt(true);
      }
    }

    if (isPwaStandalone()) {
      if (!storageValue(STANDALONE_TRACKED_KEY)) {
        setStorageValue(STANDALONE_TRACKED_KEY, "1");
        void trackPwaEvent("STANDALONE_OPENED");
      }
      void prepareNotificationPrompt();
      return;
    }

    if (!isMobileBrowser() || isSuppressed(DISMISSED_UNTIL_KEY)) {
      return;
    }

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setShowPrompt(true);
      void trackPwaEvent("PROMPT_SHOWN");
    };

    const handleInstalled = () => {
      suppressFor(DISMISSED_UNTIL_KEY, INSTALLED_MS);
      setInstallEvent(null);
      setShowPrompt(false);
      void trackPwaEvent("APP_INSTALLED");
      void prepareNotificationPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, [pathname]);

  const dismissPrompt = () => {
    suppressFor(DISMISSED_UNTIL_KEY, DISMISS_MS);
    setShowPrompt(false);
    setInstallEvent(null);
    void trackPwaEvent("PROMPT_DISMISSED");
  };

  const dismissNotificationPrompt = () => {
    suppressFor(NOTIFICATION_DISMISSED_UNTIL_KEY, DISMISS_MS);
    setShowNotificationPrompt(false);
  };

  const installApp = async () => {
    if (!installEvent) return;

    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    suppressFor(DISMISSED_UNTIL_KEY, choice.outcome === "accepted" ? INSTALLED_MS : DISMISS_MS);
    setShowPrompt(false);
    setInstallEvent(null);
    void trackPwaEvent(choice.outcome === "accepted" ? "PROMPT_ACCEPTED" : "PROMPT_DISMISSED", {
      platform: choice.platform,
    });
  };

  const enableNotifications = async () => {
    try {
      setNotificationBusy(true);
      await subscribeToPushNotifications();
      setShowNotificationPrompt(false);
      suppressFor(NOTIFICATION_DISMISSED_UNTIL_KEY, INSTALLED_MS);
      toast.success("Notifications enabled on this device.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to enable notifications.");
    } finally {
      setNotificationBusy(false);
    }
  };

  if (shouldSkipPath(pathname)) return null;

  if (showNotificationPrompt) {
    return (
      <aside
        aria-label="Enable Kya Khayen notifications"
        className="fixed bottom-[5.35rem] left-3 right-3 z-[49] rounded-[1.35rem] border border-[#eadcc9] bg-[#fffdf8]/98 p-3.5 shadow-[0_24px_55px_-25px_rgba(5,15,12,0.35)] backdrop-blur-md dark:border-white/10 dark:bg-[#10231c]/98 sm:left-auto sm:w-[360px]"
      >
        <button
          type="button"
          aria-label="Dismiss notification suggestion"
          onClick={dismissNotificationPrompt}
          className="absolute right-2.5 top-2.5 flex size-7 cursor-pointer items-center justify-center rounded-full text-[#7c6a5d] transition hover:bg-black/5 dark:text-[#a9b9af] dark:hover:bg-white/5"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-start gap-3 pr-8">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#f6ead9] text-[#b63a2b] dark:bg-[#19352b] dark:text-[#dbb16f]">
            <BellRing className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#31241c] dark:text-[#f3eee6]">Recipe alerts</p>
            <p className="mt-0.5 text-[11px] leading-4 text-[#7c6a5d] dark:text-[#a9b9af]">
              Get fresh recipes, meal reminders and useful updates on this device.
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => void enableNotifications()}
            disabled={notificationBusy}
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#b63a2b] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#ca4635] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {notificationBusy ? <LoaderCircle className="size-3.5 animate-spin" /> : <BellRing className="size-3.5" />}
            Enable alerts
          </button>
          <button
            type="button"
            onClick={dismissNotificationPrompt}
            className="cursor-pointer rounded-full border border-[#eadcc9] px-4 py-2.5 text-xs font-semibold text-[#7c6a5d] dark:border-[#29473e] dark:text-[#c5d1cb]"
          >
            Later
          </button>
        </div>
      </aside>
    );
  }

  if (!showPrompt || !installEvent) return null;

  return (
    <aside
      aria-label="Install Kya Khayen app"
      className="install-prompt-card fixed bottom-[5.35rem] left-3 right-3 z-[48] rounded-[1.35rem] border border-[#244238] bg-[#10231c]/98 p-3.5 shadow-[0_24px_55px_-25px_rgba(5,15,12,0.8)] backdrop-blur-md sm:hidden"
    >
      <button
        type="button"
        aria-label="Dismiss install suggestion"
        onClick={dismissPrompt}
        className="absolute right-2.5 top-2.5 flex size-7 cursor-pointer items-center justify-center rounded-full text-[#a9b9af] transition hover:bg-white/5"
      >
        <X className="size-4" />
      </button>

      <div className="flex items-center gap-3 pr-8">
        <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#19352b]">
          <Image
            src="/pwa/icon-192.png"
            alt=""
            width={38}
            height={38}
            className="size-11 object-cover"
          />
        </span>
        <div>
          <p className="text-sm font-semibold text-[#f3eee6]">Your kitchen, one tap away</p>
          <p className="mt-0.5 text-[11px] leading-4 text-[#a9b9af]">
            Install Kya Khayen for meal plans and helpful alerts.
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={installApp}
          className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#b63a2b] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#ca4635]"
        >
          <Download className="size-3.5" />
          Install app
        </button>
        <button
          type="button"
          onClick={dismissPrompt}
          className="cursor-pointer rounded-full border border-[#29473e] px-4 py-2.5 text-xs font-semibold text-[#c5d1cb]"
        >
          Not now
        </button>
      </div>
    </aside>
  );
}
