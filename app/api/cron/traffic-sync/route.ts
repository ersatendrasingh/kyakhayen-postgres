import { NextResponse } from "next/server";

import { syncTrafficNotificationSchedules } from "@/lib/meal-plan-queue";
import { isCronOrWorkerRequest } from "@/lib/worker-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!isCronOrWorkerRequest(request)) {
    return NextResponse.json("Unauthorized", { status: 401 });
  }

  return NextResponse.json(await syncTrafficNotificationSchedules());
}
