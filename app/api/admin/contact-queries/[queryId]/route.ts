import { ContactLeadStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

const leadUpdateSchema = z.object({
  status: z.nativeEnum(ContactLeadStatus),
  contactMethod: z.enum(["PHONE", "EMAIL", "WHATSAPP", "IN_PERSON", "INTERNAL_NOTE"]),
  contactedAt: z.string().datetime(),
  note: z.string().trim().min(3, "Please record what happened.").max(4000),
  closedReason: z.string().trim().max(1000).optional().nullable(),
});

export async function PATCH(
  request: Request,
  props: { params: Promise<{ queryId: string }> },
) {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json("Unauthorized", { status: 401 });
  }

  try {
    const { queryId } = await props.params;
    const parsed = leadUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(parsed.error.issues[0]?.message || "Invalid lead activity.", {
        status: 400,
      });
    }

    const input = parsed.data;
    const requiresCloseReason =
      input.status === ContactLeadStatus.CLOSED ||
      input.status === ContactLeadStatus.NOT_INTERESTED;
    if (requiresCloseReason && !input.closedReason) {
      return NextResponse.json("Please add a reason before closing this lead.", { status: 400 });
    }

    const existing = await db.contactUsQueries.findUnique({ where: { id: queryId } });
    if (!existing) {
      return NextResponse.json("Contact query not found.", { status: 404 });
    }

    const contactedAt = new Date(input.contactedAt);
    const updated = await db.$transaction(async (transaction) => {
      await transaction.contactQueryActivity.create({
        data: {
          queryId,
          previousStatus: existing.status,
          status: input.status,
          contactMethod: input.contactMethod,
          contactedAt,
          note: input.note,
          createdById: user.id,
          createdByName: user.name || user.email || "Admin",
        },
      });

      return transaction.contactUsQueries.update({
        where: { id: queryId },
        data: {
          status: input.status,
          lastContactedAt: contactedAt,
          closedReason: requiresCloseReason ? input.closedReason : null,
        },
        include: {
          activities: { orderBy: { contactedAt: "desc" } },
        },
      });
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.log("[ADMIN_CONTACT_QUERY_UPDATE]", error);
    return NextResponse.json("Unable to update this lead.", { status: 500 });
  }
}
