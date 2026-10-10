import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

type PushMessage = {
  title?: string;
  body?: string;
  url?: string | null;
  imageUrl?: string | null;
  tag?: string;
  deliveryId?: string;
};

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload: PushMessage = {};
  try {
    payload = event.data.json() as PushMessage;
  } catch {
    payload = { body: event.data.text() };
  }

  const title = payload.title || "Kya Khayen";
  const options: NotificationOptions & { image?: string } = {
    body: payload.body || "There is something fresh waiting for you.",
    icon: "/pwa/icon-192.png",
    badge: "/pwa/badge-96.png",
    image: payload.imageUrl || undefined,
    tag: payload.tag || "kya-khayen-update",
      data: { url: payload.url || "/", deliveryId: payload.deliveryId },
  };
  event.waitUntil(
    self.registration.showNotification(title, options),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "/", self.location.origin).href;
  const deliveryId = event.notification.data?.deliveryId as string | undefined;
  const trackClick = deliveryId
    ? fetch("/api/push/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryId, event: "CLICKED" }),
      }).catch(() => undefined)
    : Promise.resolve();
  event.waitUntil(
    Promise.all([
      trackClick,
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (windows) => {
        for (const window of windows) {
          if (window.url === targetUrl) {
            return window.focus();
          }
        }
        return self.clients.openWindow(targetUrl);
      }),
    ]),
  );
});

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  disableDevLogs: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
