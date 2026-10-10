import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { scheduleMembershipExpiryNotifications } from "@/lib/meal-plan-queue";
import { isCronOrWorkerRequest } from "@/lib/worker-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!isCronOrWorkerRequest(request)) {
    return NextResponse.json("Unauthorized", { status: 401 });
  }

  const memberships = await db.userPlan.findMany({
    where: { endDate: { gt: new Date() } },
    select: { id: true, userId: true, endDate: true },
  });

  for (const membership of memberships) {
    await scheduleMembershipExpiryNotifications(
      membership.userId,
      membership.id,
      membership.endDate,
    );
  }

  return NextResponse.json({ scheduled: memberships.length });
}
