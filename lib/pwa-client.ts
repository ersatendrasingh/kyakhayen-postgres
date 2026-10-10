"use client";

type PwaPlatform = "ANDROID" | "IOS" | "DESKTOP" | "UNKNOWN";

export type PwaEventType =
  | "VISITED"
  | "PROMPT_SHOWN"
  | "PROMPT_ACCEPTED"
  | "PROMPT_DISMISSED"
  | "APP_INSTALLED"
  | "STANDALONE_OPENED"
  | "PUSH_PERMISSION_GRANTED"
  | "PUSH_PERMISSION_DENIED"
  | "PUSH_PERMISSION_BLOCKED"
  | "PUSH_SUBSCRIBED"
  | "PUSH_UNSUBSCRIBED";

const DEVICE_KEY = "kyakhayen-pwa-device-key";

function safeLocalStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function randomKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function getPwaDeviceKey() {
  const storage = safeLocalStorage();
  const existing = storage?.getItem(DEVICE_KEY);
  if (existing) return existing;

  const next = randomKey();
  storage?.setItem(DEVICE_KEY, next);
  return next;
}

function detectPlatform(userAgent: string): PwaPlatform {
  const lower = userAgent.toLowerCase();
  const isIpadOS = lower.includes("macintosh") && navigator.maxTouchPoints > 1;
  if (lower.includes("android")) return "ANDROID";
  if (/(iphone|ipad|ipod)/i.test(userAgent) || isIpadOS) return "IOS";
  if (/(windows|macintosh|linux|x11)/i.test(userAgent)) return "DESKTOP";
  return "UNKNOWN";
}

function detectOs(userAgent: string) {
  const lower = userAgent.toLowerCase();
  if (lower.includes("android")) return "Android";
  if (/(iphone|ipad|ipod)/i.test(userAgent)) return "iOS";
  if (lower.includes("macintosh") && navigator.maxTouchPoints > 1) return "iPadOS";
  if (lower.includes("mac os x") || lower.includes("macintosh")) return "macOS";
  if (lower.includes("windows")) return "Windows";
  if (lower.includes("linux")) return "Linux";
  return "Unknown";
}

function detectBrowser(userAgent: string) {
  if (/EdgiOS|EdgA|Edg\//.test(userAgent)) return "Edge";
  if (/CriOS|Chrome|Chromium/.test(userAgent) && !/EdgiOS|EdgA|Edg\//.test(userAgent)) return "Chrome";
  if (/FxiOS|Firefox/.test(userAgent)) return "Firefox";
  if (/OPR|Opera/.test(userAgent)) return "Opera";
  if (/Safari/.test(userAgent) && !/CriOS|Chrome|Chromium/.test(userAgent)) return "Safari";
  return "Unknown";
}

export function getPwaDisplayMode() {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
  if (standalone) return "standalone";
  if (window.matchMedia("(display-mode: fullscreen)").matches) return "fullscreen";
  if (window.matchMedia("(display-mode: minimal-ui)").matches) return "minimal-ui";
  return "browser";
}

export function isPwaStandalone() {
  return getPwaDisplayMode() !== "browser";
}

export function getPwaClientMetadata() {
  const userAgent = navigator.userAgent;
  return {
    deviceKey: getPwaDeviceKey(),
    platform: detectPlatform(userAgent),
    os: detectOs(userAgent),
    browser: detectBrowser(userAgent),
    displayMode: getPwaDisplayMode(),
    userAgent,
    notificationPermission: "Notification" in window ? Notification.permission : null,
  };
}

export async function trackPwaEvent(eventType: PwaEventType, metadata?: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  try {
    await fetch("/api/pwa/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...getPwaClientMetadata(),
        eventType,
        metadata,
      }),
      keepalive: true,
    });
  } catch {
    // Analytics should never block the user flow.
  }
}

function publicKeyBytes(key: string) {
  const padding = "=".repeat((4 - (key.length % 4)) % 4);
  const base64 = (key + padding).replaceAll("-", "+").replaceAll("_", "/");
  return Uint8Array.from(window.atob(base64), (character) => character.charCodeAt(0));
}

async function serviceWorkerRegistration() {
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;

  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<ServiceWorkerRegistration>((_, reject) => {
      window.setTimeout(
        () =>
          reject(
            new Error(
              "Push service worker is not ready yet. Please reload the installed app and try again.",
            ),
          ),
        7000,
      );
    }),
  ]);
}

async function responseMessage(response: Response, fallback: string) {
  const body = await response.json().catch(() => null);
  return typeof body === "string" ? body : fallback;
}

export async function getCurrentPushSubscription() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  const registration = await navigator.serviceWorker.getRegistration();
  return registration?.pushManager.getSubscription() ?? null;
}

export async function subscribeToPushNotifications() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    await trackPwaEvent("PUSH_PERMISSION_BLOCKED", { reason: "unsupported" });
    throw new Error("This browser does not support push notifications.");
  }

  const configurationResponse = await fetch("/api/push/public-key");
  const configuration = await configurationResponse.json();
  if (!configuration.enabled || !configuration.publicKey) {
    throw new Error("Push notifications are not configured yet.");
  }

  const permission =
    Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  await trackPwaEvent(
    permission === "granted"
      ? "PUSH_PERMISSION_GRANTED"
      : permission === "denied"
        ? "PUSH_PERMISSION_DENIED"
        : "PUSH_PERMISSION_BLOCKED",
  );
  if (permission !== "granted") {
    throw new Error("Notification permission was not granted.");
  }

  const registration = await serviceWorkerRegistration();
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: publicKeyBytes(configuration.publicKey),
    }));
  const serialised = subscription.toJSON();
  const response = await fetch("/api/push/subscriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...getPwaClientMetadata(),
      endpoint: subscription.endpoint,
      p256dh: serialised.keys?.p256dh,
      auth: serialised.keys?.auth,
    }),
  });
  if (!response.ok) {
    throw new Error(await responseMessage(response, "Unable to save notification subscription."));
  }

  await trackPwaEvent("PUSH_SUBSCRIBED");
  return { alreadySubscribed: Boolean(existing) };
}

export async function unsubscribeFromPushNotifications() {
  const subscription = await getCurrentPushSubscription();
  if (!subscription) return;

  await fetch("/api/push/subscriptions", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...getPwaClientMetadata(),
      endpoint: subscription.endpoint,
    }),
  });
  await subscription.unsubscribe();
  await trackPwaEvent("PUSH_UNSUBSCRIBED");
}
