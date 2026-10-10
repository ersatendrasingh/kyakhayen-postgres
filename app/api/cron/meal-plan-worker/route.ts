import { NextRequest, NextResponse } from "next/server";

import { runMealPlanQueueForCron } from "@/lib/meal-plan-worker-runner";
import { isCronOrWorkerRequest } from "@/lib/worker-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  if (!isCronOrWorkerRequest(request)) {
    return NextResponse.json("Unauthorized", { status: 401 });
  }

  const result = await runMealPlanQueueForCron(request.nextUrl.origin);
  return NextResponse.json(result);
}
