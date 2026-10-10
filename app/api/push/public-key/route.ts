import { NextResponse } from "next/server";

import { getPushPublicConfiguration } from "@/lib/web-push";

export async function GET() {
  return NextResponse.json(getPushPublicConfiguration());
}
