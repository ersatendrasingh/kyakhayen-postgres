import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  deleteFolderFromS3,
  getVerifiedPublicMediaKey,
} from "@/lib/s3utils";
import { currentUser } from "@/lib/auth";
import { slugify } from "@/lib/slugify";

type UpdateDietTypeBody = {
  title?: string;
  imageUrl?: string | null;
  isPublished?: boolean;
};

export async function DELETE(_req: Request, props: { params: Promise<{ dietTypeId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { dietTypeId } = params;

    const dietType = await db.dietTypes.findUnique({
      where: { id: dietTypeId },
      include: {
        _count: {
          select: { recipeDietType: true },
        },
      },
    });

    if (!dietType) {
      return NextResponse.json("Diet Type not found", { status: 404 });
    }
    if (dietType._count.recipeDietType > 0) {
      return NextResponse.json("Diet type is linked to recipes", { status: 409 });
    }

    const deletedDietType = await db.dietTypes.delete({
      where: { id: dietTypeId },
    });

    try {
      await deleteFolderFromS3(`dietTypes/${dietTypeId}`);
    } catch (error) {
      console.error("[DIET_TYPE_MEDIA_CLEANUP]", error);
    }

    return NextResponse.json(deletedDietType, { status: 200 });
  } catch (error) {
    console.log("[DIETTYPE_ID_DELETE]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
export async function PATCH(req: Request, props: { params: Promise<{ dietTypeId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { dietTypeId } = params;
    const { title, imageUrl, isPublished } = (await req.json()) as UpdateDietTypeBody;

    if (title === undefined && imageUrl === undefined && isPublished === undefined) {
      return NextResponse.json("No diet type changes supplied", { status: 400 });
    }

    const normalizedTitle = title?.trim();
    if (title !== undefined && !normalizedTitle) {
      return NextResponse.json("Diet type title is required", { status: 400 });
    }
    if (isPublished !== undefined && typeof isPublished !== "boolean") {
      return NextResponse.json("Invalid published state", { status: 400 });
    }

    const currentDietType = await db.dietTypes.findUnique({
      where: { id: dietTypeId },
    });

    if (!currentDietType) {
      return NextResponse.json("Diet Type not found", { status: 404 });
    }

    const normalizedImageUrl =
      imageUrl === undefined ? undefined : imageUrl?.trim() || null;
    if (normalizedImageUrl) {
      try {
        getVerifiedPublicMediaKey(normalizedImageUrl);
      } catch {
        return NextResponse.json("Invalid diet type image URL", { status: 400 });
      }
    }

    const dietType = await db.dietTypes.update({
      where: { id: dietTypeId },
      data: {
        ...(normalizedTitle && {
          title: normalizedTitle,
          slug: slugify(normalizedTitle),
        }),
        ...(imageUrl !== undefined && { imageUrl: normalizedImageUrl }),
        ...(isPublished !== undefined && { isPublished }),
      },
    });

    return NextResponse.json(dietType, { status: 200 });
  } catch (error) {
    console.log("[DIETTYPE_ID]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
