import { NextResponse } from "next/server";
import { z } from "zod";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { scheduleMembershipExpiryNotifications } from "@/lib/meal-plan-queue";

const membershipSchema = z.object({
  assignmentId: z.string().nullable(),
  planId: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().nullable(),
});

const removalSchema = z.object({ assignmentId: z.string().min(1) });

async function authorizeAdmin() {
  const admin = await currentUser();
  return admin?.role === "ADMIN";
}

export async function POST(
  request: Request,
  props: { params: Promise<{ userId: string }> },
) {
  if (!(await authorizeAdmin())) {
    return NextResponse.json("Unauthorized", { status: 401 });
  }

  try {
    const { userId } = await props.params;
    const parsed = membershipSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json("Please provide valid membership dates.", { status: 400 });
    }

    const input = parsed.data;
    const startDate = new Date(input.startDate);
    const endDate = input.endDate ? new Date(input.endDate) : null;
    if (endDate && endDate <= startDate) {
      return NextResponse.json("The access end date must be after its start date.", { status: 400 });
    }

    const [customer, plan] = await Promise.all([
      db.user.findUnique({ where: { id: userId }, select: { id: true } }),
      db.plan.findUnique({ where: { id: input.planId }, select: { id: true } }),
    ]);
    if (!customer || !plan) {
      return NextResponse.json("Customer or membership plan was not found.", { status: 404 });
    }

    let assignment;
    if (input.assignmentId) {
      const existing = await db.userPlan.findFirst({
        where: { id: input.assignmentId, userId },
        select: { id: true },
      });
      if (!existing) {
        return NextResponse.json("Membership assignment not found.", { status: 404 });
      }
      assignment = await db.userPlan.update({
        where: { id: existing.id },
        data: { planId: input.planId, startDate, endDate },
      });
    } else {
      assignment = await db.userPlan.create({
        data: { userId, planId: input.planId, startDate, endDate },
      });
    }
    await scheduleMembershipExpiryNotifications(userId, assignment.id, assignment.endDate);

    return NextResponse.json(assignment);
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        "This customer already has this membership. Edit its dates instead.",
        { status: 409 },
      );
    }
    console.log("[ADMIN_USER_MEMBERSHIP_UPDATE]", error);
    return NextResponse.json("Unable to save membership access.", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ userId: string }> },
) {
  if (!(await authorizeAdmin())) {
    return NextResponse.json("Unauthorized", { status: 401 });
  }

  try {
    const { userId } = await props.params;
    const parsed = removalSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json("Invalid membership assignment.", { status: 400 });
    }

    const assignment = await db.userPlan.findFirst({
      where: { id: parsed.data.assignmentId, userId },
      select: { id: true },
    });
    if (!assignment) {
      return NextResponse.json("Membership assignment not found.", { status: 404 });
    }
    await db.userPlan.delete({ where: { id: assignment.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.log("[ADMIN_USER_MEMBERSHIP_REMOVE]", error);
    return NextResponse.json("Unable to remove membership access.", { status: 500 });
  }
}
