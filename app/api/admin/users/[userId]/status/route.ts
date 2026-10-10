import { NextResponse } from "next/server";
import { z } from "zod";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

const statusSchema = z.object({
  isActive: z.boolean(),
  reason: z.string().trim().max(1000).nullable(),
});

export async function PATCH(
  request: Request,
  props: { params: Promise<{ userId: string }> },
) {
  const admin = await currentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json("Unauthorized", { status: 401 });
  }

  try {
    const { userId } = await props.params;
    const parsed = statusSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json("Invalid account status request.", { status: 400 });
    }

    if (admin.id === userId && !parsed.data.isActive) {
      return NextResponse.json("You cannot suspend your own admin account.", { status: 400 });
    }

    if (!parsed.data.isActive && !parsed.data.reason) {
      return NextResponse.json("Provide a reason before suspending this account.", {
        status: 400,
      });
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: {
        isActive: parsed.data.isActive,
        suspendedAt: parsed.data.isActive ? null : new Date(),
        suspensionReason: parsed.data.isActive ? null : parsed.data.reason,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.log("[ADMIN_USER_STATUS_UPDATE]", error);
    return NextResponse.json("Unable to update account status.", { status: 500 });
  }
}
