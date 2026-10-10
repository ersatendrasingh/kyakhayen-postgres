import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  deleteFolderFromS3,
  getVerifiedPublicMediaKey,
} from "@/lib/s3utils";
import { slugify } from "@/lib/slugify";

type UpdateBodyTypeBody = {
  title?: string;
  imageUrl?: string | null;
  isPublished?: boolean;
};

export async function DELETE(
  _req: Request,
  props: { params: Promise<{ bodyTypeId: string }> }
) {
  const params = await props.params;

  try {
    const user = await currentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const bodyType = await db.bodyTypes.findUnique({
      where: { id: params.bodyTypeId },
      include: {
        _count: {
          select: { recipeBodyTypes: true },
        },
      },
    });

    if (!bodyType) {
      return NextResponse.json("Body type not found", { status: 404 });
    }
    if (bodyType._count.recipeBodyTypes > 0) {
      return NextResponse.json("Body type is linked to recipes", { status: 409 });
    }

    const deletedBodyType = await db.bodyTypes.delete({
      where: { id: params.bodyTypeId },
    });

    try {
      await deleteFolderFromS3(`bodyTypes/${params.bodyTypeId}`);
    } catch (error) {
      console.error("[BODY_TYPE_MEDIA_CLEANUP]", error);
    }

    return NextResponse.json(deletedBodyType, { status: 200 });
  } catch (error) {
    console.log("[BODY_TYPE_DELETE]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ bodyTypeId: string }> }
) {
  const params = await props.params;

  try {
    const user = await currentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const { title, imageUrl, isPublished } = (await req.json()) as UpdateBodyTypeBody;

    if (title === undefined && imageUrl === undefined && isPublished === undefined) {
      return NextResponse.json("No body type changes supplied", { status: 400 });
    }

    const normalizedTitle = title?.trim();
    if (title !== undefined && !normalizedTitle) {
      return NextResponse.json("Body type title is required", { status: 400 });
    }
    if (isPublished !== undefined && typeof isPublished !== "boolean") {
      return NextResponse.json("Invalid published state", { status: 400 });
    }

    const currentBodyType = await db.bodyTypes.findUnique({
      where: { id: params.bodyTypeId },
    });

    if (!currentBodyType) {
      return NextResponse.json("Body type not found", { status: 404 });
    }

    const normalizedImageUrl =
      imageUrl === undefined ? undefined : imageUrl?.trim() || null;
    if (normalizedImageUrl) {
      try {
        getVerifiedPublicMediaKey(normalizedImageUrl);
      } catch {
        return NextResponse.json("Invalid body type image URL", { status: 400 });
      }
    }

    const bodyType = await db.bodyTypes.update({
      where: { id: params.bodyTypeId },
      data: {
        ...(normalizedTitle && {
          title: normalizedTitle,
          slug: slugify(normalizedTitle),
        }),
        ...(imageUrl !== undefined && { imageUrl: normalizedImageUrl }),
        ...(isPublished !== undefined && { isPublished }),
      },
    });

    return NextResponse.json(bodyType, { status: 200 });
  } catch (error) {
    console.log("[BODY_TYPE_PATCH]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
