import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendPushNotifications } from "@/lib/web-push";

export async function POST() {
  const user = await currentUser();
  if (!user) return NextResponse.json("Unauthorized", { status: 401 });

  const subscriptions = await db.pushSubscription.findMany({
    where: { userId: user.id, isActive: true },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });
  if (!subscriptions.length) {
    return NextResponse.json("No active push subscription on this account.", { status: 400 });
  }

  try {
    const result = await sendPushNotifications(subscriptions, {
      title: "Kya Khayen notifications are ready",
      body: "Fresh recipes and your meal-plan updates can now reach this device.",
      url: "/user/settings",
      tag: "push-test",
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      error instanceof Error ? error.message : "Unable to send test notification.",
      { status: 500 },
    );
  }
}
