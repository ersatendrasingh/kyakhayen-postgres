import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  deleteFolderFromS3,
  getVerifiedPublicMediaKey,
} from "@/lib/s3utils";
import { currentUser } from "@/lib/auth";
import { slugify } from "@/lib/slugify";

type UpdateAllergyBody = {
  title?: string;
  imageUrl?: string | null;
  isPublished?: boolean;
};

export async function DELETE(_req: Request, props: { params: Promise<{ allergyId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { allergyId } = params;

    const allergy = await db.allergies.findUnique({
      where: { id: allergyId },
      include: {
        _count: {
          select: { recipeAllergies: true, UserAllrgies: true },
        },
      },
    });

    if (!allergy) {
      return NextResponse.json("Allergy not found", { status: 404 });
    }
    if (
      allergy._count.recipeAllergies > 0 ||
      allergy._count.UserAllrgies > 0
    ) {
      return NextResponse.json("Allergy is linked to recipes or users", { status: 409 });
    }

    const deletedAllergy = await db.allergies.delete({
      where: { id: allergyId },
    });

    try {
      await deleteFolderFromS3(`allergies/${allergyId}`);
    } catch (error) {
      console.error("[ALLERGY_MEDIA_CLEANUP]", error);
    }

    return NextResponse.json(deletedAllergy, { status: 200 });
  } catch (error) {
    console.log("[ALLERGY_ID_DELETE]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
export async function PATCH(req: Request, props: { params: Promise<{ allergyId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { allergyId } = params;
    const { title, imageUrl, isPublished } = (await req.json()) as UpdateAllergyBody;

    if (title === undefined && imageUrl === undefined && isPublished === undefined) {
      return NextResponse.json("No allergy changes supplied", { status: 400 });
    }

    const normalizedTitle = title?.trim();
    if (title !== undefined && !normalizedTitle) {
      return NextResponse.json("Allergy title is required", { status: 400 });
    }
    if (isPublished !== undefined && typeof isPublished !== "boolean") {
      return NextResponse.json("Invalid published state", { status: 400 });
    }

    const currentAllergy = await db.allergies.findUnique({
      where: { id: allergyId },
    });

    if (!currentAllergy) {
      return NextResponse.json("Allergy not found", { status: 404 });
    }

    const normalizedImageUrl =
      imageUrl === undefined ? undefined : imageUrl?.trim() || null;
    if (normalizedImageUrl) {
      try {
        getVerifiedPublicMediaKey(normalizedImageUrl);
      } catch {
        return NextResponse.json("Invalid allergy image URL", { status: 400 });
      }
    }

    const allergy = await db.allergies.update({
      where: { id: allergyId },
      data: {
        ...(normalizedTitle && {
          title: normalizedTitle,
          slug: slugify(normalizedTitle),
        }),
        ...(imageUrl !== undefined && { imageUrl: normalizedImageUrl }),
        ...(isPublished !== undefined && { isPublished }),
      },
    });

    return NextResponse.json(allergy, { status: 200 });
  } catch (error) {
    console.log("[ALLERGYID]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
