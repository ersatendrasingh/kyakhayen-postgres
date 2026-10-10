import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

const profileSchema = z.object({
  name: z.string().trim().max(120).nullable(),
  email: z.string().trim().email().nullable(),
  phoneNumber: z.string().trim().max(30).nullable(),
  bio: z.string().trim().max(2000).nullable(),
  image: z.string().trim().url().nullable(),
  role: z.nativeEnum(UserRole),
  emailVerified: z.boolean(),
});

const deletionSchema = z.object({
  confirmation: z.string().trim().min(1),
});

function nullableText(value: string | null) {
  return value?.trim() || null;
}

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
    const parsed = profileSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(parsed.error.issues[0]?.message || "Invalid customer details.", {
        status: 400,
      });
    }

    if (admin.id === userId && parsed.data.role !== UserRole.ADMIN) {
      return NextResponse.json("You cannot remove your own admin access.", { status: 400 });
    }

    const customer = await db.user.findUnique({
      where: { id: userId },
      select: { image: true },
    });
    if (!customer) {
      return NextResponse.json("Customer not found.", { status: 404 });
    }

    if (parsed.data.image && parsed.data.image !== customer.image) {
      const selectedImage = await db.mediaAsset.findUnique({
        where: { url: parsed.data.image },
        select: { mediaType: true },
      });
      if (selectedImage?.mediaType !== "image") {
        return NextResponse.json("Choose a valid image from the media library.", { status: 400 });
      }
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: {
        name: nullableText(parsed.data.name),
        email: nullableText(parsed.data.email),
        phoneNumber: nullableText(parsed.data.phoneNumber),
        bio: nullableText(parsed.data.bio),
        image: parsed.data.image,
        role: parsed.data.role,
        emailVerified: parsed.data.emailVerified ? new Date() : null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
      return NextResponse.json("This email or phone number already belongs to another customer.", {
        status: 409,
      });
    }
    console.log("[ADMIN_USER_PROFILE_UPDATE]", error);
    return NextResponse.json("Unable to update customer details.", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ userId: string }> },
) {
  const admin = await currentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json("Unauthorized", { status: 401 });
  }

  try {
    const { userId } = await props.params;
    if (admin.id === userId) {
      return NextResponse.json("You cannot permanently delete your own admin account.", {
        status: 400,
      });
    }

    const parsed = deletionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json("Type the customer's email address to confirm deletion.", {
        status: 400,
      });
    }

    const customer = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (!customer) return NextResponse.json("Customer not found.", { status: 404 });

    const expectedConfirmation = customer.email || customer.id;
    if (parsed.data.confirmation !== expectedConfirmation) {
      return NextResponse.json("Confirmation does not match this customer.", { status: 400 });
    }

    await db.$transaction(async (transaction) => {
      await transaction.commentLikes.deleteMany({ where: { userId } });
      await transaction.comment.deleteMany({ where: { userId } });

      const orders = await transaction.order.findMany({
        where: { userId },
        select: { id: true },
      });
      await transaction.item.deleteMany({
        where: { orderId: { in: orders.map(({ id }) => id) } },
      });
      await transaction.order.deleteMany({ where: { userId } });
      await transaction.userPlan.deleteMany({ where: { userId } });
      await transaction.post.deleteMany({ where: { authorId: userId } });

      if (customer.email) {
        await transaction.verificationToken.deleteMany({
          where: { email: customer.email },
        });
        await transaction.passwordResetToken.deleteMany({
          where: { email: customer.email },
        });
        await transaction.twoFactorToken.deleteMany({
          where: { email: customer.email },
        });
      }

      await transaction.user.delete({ where: { id: userId } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.log("[ADMIN_USER_DELETE]", error);
    return NextResponse.json("Unable to permanently delete this customer.", { status: 500 });
  }
}
