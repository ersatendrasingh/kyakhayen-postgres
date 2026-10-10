import { NextResponse } from "next/server";
import { Prisma, PwaPlatform } from "@prisma/client";
import { z } from "zod";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

const deviceMetadataSchema = z.object({
  deviceKey: z.string().trim().min(8).max(80).optional().nullable(),
  platform: z.nativeEnum(PwaPlatform).optional().default(PwaPlatform.UNKNOWN),
  os: z.string().trim().max(120).optional().nullable(),
  browser: z.string().trim().max(120).optional().nullable(),
  displayMode: z.string().trim().max(60).optional().nullable(),
  notificationPermission: z.string().trim().max(40).optional().nullable(),
});

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(512),
  p256dh: z.string().min(1).max(1000),
  auth: z.string().min(1).max(500),
  userAgent: z.string().max(1000).optional().nullable(),
}).merge(deviceMetadataSchema);

const removalSchema = z.object({ endpoint: z.string().url().max(512) }).merge(deviceMetadataSchema);

function clean(value?: string | null) {
  return value?.trim() || undefined;
}

function isSchemaPending(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2021" || error.code === "P2022")
  );
}

async function upsertDevice(
  input: z.infer<typeof deviceMetadataSchema> & { userAgent?: string | null },
  userId: string | undefined,
  subscribed: boolean,
) {
  if (!input.deviceKey) return null;

  const now = new Date();
  try {
    return await db.pwaDevice.upsert({
      where: { deviceKey: input.deviceKey },
      create: {
        deviceKey: input.deviceKey,
        userId: userId || null,
        platform: input.platform,
        os: clean(input.os),
        browser: clean(input.browser),
        displayMode: clean(input.displayMode),
        userAgent: clean(input.userAgent),
        pushPermission: clean(input.notificationPermission),
        pushSubscribedAt: subscribed ? now : null,
        pushUnsubscribedAt: subscribed ? null : now,
        lastSeenAt: now,
      },
      update: {
        userId: userId || undefined,
        platform: input.platform,
        os: clean(input.os),
        browser: clean(input.browser),
        displayMode: clean(input.displayMode),
        userAgent: clean(input.userAgent),
        pushPermission: clean(input.notificationPermission),
        pushSubscribedAt: subscribed ? now : undefined,
        pushUnsubscribedAt: subscribed ? null : now,
        lastSeenAt: now,
      },
    });
  } catch (error) {
    if (isSchemaPending(error)) return null;
    throw error;
  }
}

export async function POST(request: Request) {
  const user = await currentUser().catch(() => undefined);

  const parsed = subscriptionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json("Invalid push subscription.", { status: 400 });
  }
  const device = await upsertDevice(parsed.data, user?.id, true);
  const now = new Date();

  try {
    await db.pushSubscription.upsert({
      where: { endpoint: parsed.data.endpoint },
      create: {
        endpoint: parsed.data.endpoint,
        p256dh: parsed.data.p256dh,
        auth: parsed.data.auth,
        userAgent: parsed.data.userAgent,
        userId: user?.id || null,
        deviceId: device?.id || null,
        platform: parsed.data.platform,
        os: clean(parsed.data.os),
        browser: clean(parsed.data.browser),
        displayMode: clean(parsed.data.displayMode),
        notificationPermission: clean(parsed.data.notificationPermission),
        lastSeenAt: now,
      },
      update: {
        p256dh: parsed.data.p256dh,
        auth: parsed.data.auth,
        userAgent: parsed.data.userAgent,
        userId: user?.id || undefined,
        deviceId: device?.id || undefined,
        platform: parsed.data.platform,
        os: clean(parsed.data.os),
        browser: clean(parsed.data.browser),
        displayMode: clean(parsed.data.displayMode),
        notificationPermission: clean(parsed.data.notificationPermission),
        lastSeenAt: now,
        isActive: true,
        failureReason: null,
      },
    });
  } catch (error) {
    if (!isSchemaPending(error)) throw error;
    if (!user?.id) {
      return NextResponse.json("Push schema update is pending. Please try again after deployment finishes.", {
        status: 503,
      });
    }
    await db.pushSubscription.upsert({
      where: { endpoint: parsed.data.endpoint },
      create: {
        endpoint: parsed.data.endpoint,
        p256dh: parsed.data.p256dh,
        auth: parsed.data.auth,
        userAgent: parsed.data.userAgent,
        userId: user.id,
      },
      update: {
        p256dh: parsed.data.p256dh,
        auth: parsed.data.auth,
        userAgent: parsed.data.userAgent,
        userId: user.id,
        isActive: true,
        failureReason: null,
      },
    });
  }

  return NextResponse.json({ message: "Push notifications enabled." });
}

export async function DELETE(request: Request) {
  const user = await currentUser().catch(() => undefined);

  const parsed = removalSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json("Invalid push subscription.", { status: 400 });

  await upsertDevice(parsed.data, user?.id, false);
  try {
    await db.pushSubscription.updateMany({
      where: { endpoint: parsed.data.endpoint },
      data: { isActive: false, lastSeenAt: new Date() },
    });
  } catch (error) {
    if (!isSchemaPending(error)) throw error;
    await db.pushSubscription.updateMany({
      where: { endpoint: parsed.data.endpoint },
      data: { isActive: false },
    });
  }

  return NextResponse.json({ message: "Push notifications disabled." });
}
