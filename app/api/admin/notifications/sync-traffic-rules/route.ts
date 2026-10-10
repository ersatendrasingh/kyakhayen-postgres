import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { syncTrafficNotificationSchedules } from "@/lib/meal-plan-queue";

export async function POST() {
  const admin = await currentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json("Unauthorized", { status: 401 });
  }

  try {
    return NextResponse.json(await syncTrafficNotificationSchedules());
  } catch (error) {
    return NextResponse.json(
      error instanceof Error ? error.message : "Unable to sync traffic notification schedules.",
      { status: 500 },
    );
  }
}
