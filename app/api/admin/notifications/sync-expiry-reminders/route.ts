import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { scheduleMembershipExpiryNotifications } from "@/lib/meal-plan-queue";

export async function POST() {
  const admin = await currentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json("Unauthorized", { status: 401 });
  }

  const memberships = await db.userPlan.findMany({
    where: { endDate: { gt: new Date() } },
    select: { id: true, userId: true, endDate: true },
  });

  let scheduled = 0;
  for (const membership of memberships) {
    await scheduleMembershipExpiryNotifications(membership.userId, membership.id, membership.endDate);
    scheduled += 1;
  }

  return NextResponse.json({ scheduled });
}
