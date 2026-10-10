import {
  Prisma,
  PwaInstallEventType,
  PwaInstallState,
  PwaPlatform,
  type PwaDevice,
} from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

const metadataSchema = z.record(z.unknown()).optional().nullable();

const eventSchema = z.object({
  deviceKey: z.string().trim().min(8).max(80),
  eventType: z.nativeEnum(PwaInstallEventType),
  platform: z.nativeEnum(PwaPlatform).optional().default(PwaPlatform.UNKNOWN),
  os: z.string().trim().max(120).optional().nullable(),
  browser: z.string().trim().max(120).optional().nullable(),
  displayMode: z.string().trim().max(60).optional().nullable(),
  userAgent: z.string().trim().max(1000).optional().nullable(),
  notificationPermission: z.string().trim().max(40).optional().nullable(),
  metadata: metadataSchema,
});

function clean(value?: string | null) {
  return value?.trim() || undefined;
}

function installUpdate(eventType: PwaInstallEventType, existing: PwaDevice | null, now: Date) {
  if (eventType === PwaInstallEventType.PROMPT_SHOWN) {
    return {
      installState: existing?.installState === PwaInstallState.INSTALLED ? PwaInstallState.INSTALLED : PwaInstallState.PROMPTED,
      promptShownAt: existing?.promptShownAt || now,
    };
  }
  if (eventType === PwaInstallEventType.PROMPT_ACCEPTED) {
    return {
      installState: existing?.installState === PwaInstallState.INSTALLED ? PwaInstallState.INSTALLED : PwaInstallState.PROMPTED,
      promptAcceptedAt: existing?.promptAcceptedAt || now,
    };
  }
  if (eventType === PwaInstallEventType.APP_INSTALLED) {
    return {
      installState: PwaInstallState.INSTALLED,
      installedAt: existing?.installedAt || now,
    };
  }
  if (eventType === PwaInstallEventType.STANDALONE_OPENED) {
    return {
      installState: existing?.installState === PwaInstallState.INSTALLED ? PwaInstallState.INSTALLED : PwaInstallState.INFERRED,
      installedAt: existing?.installedAt || now,
      standaloneFirstSeenAt: existing?.standaloneFirstSeenAt || now,
    };
  }
  if (eventType === PwaInstallEventType.PUSH_SUBSCRIBED) {
    return { pushSubscribedAt: existing?.pushSubscribedAt || now, pushUnsubscribedAt: null };
  }
  if (eventType === PwaInstallEventType.PUSH_UNSUBSCRIBED) {
    return { pushUnsubscribedAt: now };
  }
  return {};
}

function isSchemaPending(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2021" || error.code === "P2022")
  );
}

export async function POST(request: Request) {
  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json("Invalid PWA event.", { status: 400 });
  }

  const user = await currentUser().catch(() => undefined);
  const now = new Date();
  const input = parsed.data;
  try {
    const existing = await db.pwaDevice.findUnique({ where: { deviceKey: input.deviceKey } });
    const device = await db.pwaDevice.upsert({
      where: { deviceKey: input.deviceKey },
      create: {
        deviceKey: input.deviceKey,
        userId: user?.id || null,
        platform: input.platform,
        os: clean(input.os),
        browser: clean(input.browser),
        displayMode: clean(input.displayMode),
        userAgent: clean(input.userAgent),
        pushPermission: clean(input.notificationPermission),
        lastSeenAt: now,
        ...installUpdate(input.eventType, existing, now),
      },
      update: {
        userId: user?.id || undefined,
        platform: input.platform,
        os: clean(input.os),
        browser: clean(input.browser),
        displayMode: clean(input.displayMode),
        userAgent: clean(input.userAgent),
        pushPermission: clean(input.notificationPermission),
        lastSeenAt: now,
        ...installUpdate(input.eventType, existing, now),
      },
    });

    await db.pwaInstallEvent.create({
      data: {
        deviceId: device.id,
        userId: user?.id || null,
        eventType: input.eventType,
        platform: input.platform,
        os: clean(input.os),
        browser: clean(input.browser),
        displayMode: clean(input.displayMode),
        userAgent: clean(input.userAgent),
        metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
      },
    });

    return NextResponse.json({ tracked: true });
  } catch (error) {
    if (isSchemaPending(error)) {
      return NextResponse.json({ tracked: false, reason: "pwa_schema_pending" }, { status: 202 });
    }
    throw error;
  }
}
