import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { getSocialSetupStatus } from "@/lib/content-pipeline/social-setup";

export async function GET() {
  const admin = await currentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json("Unauthorized", { status: 401 });
  }

  return NextResponse.json(await getSocialSetupStatus());
}
