import { NextResponse } from "next/server";
import { z } from "zod";

import { recordDeliveryEngagement } from "@/lib/notifications";

const eventSchema = z.object({
  deliveryId: z.string().min(1),
  event: z.enum(["OPENED", "CLICKED"]),
});

export async function POST(request: Request) {
  const parsed = eventSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json("Invalid notification event.", { status: 400 });

  await recordDeliveryEngagement(parsed.data.deliveryId, parsed.data.event);
  return NextResponse.json({ tracked: true });
}
