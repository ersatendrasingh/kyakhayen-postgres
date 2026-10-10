import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  deleteFolderFromS3,
  getVerifiedPublicMediaKey,
} from "@/lib/s3utils";
import { currentUser } from "@/lib/auth";
import { slugify } from "@/lib/slugify";

type UpdateCookingMethodBody = {
  title?: string;
  imageUrl?: string | null;
  isPublished?: boolean;
};

export async function DELETE(
  _req: Request,
  props: { params: Promise<{ cookingMethodId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { cookingMethodId } = params;

    const cookingMethod = await db.cookingMethods.findUnique({
      where: { id: cookingMethodId },
      include: {
        _count: {
          select: { recipeCookingMethod: true },
        },
      },
    });

    if (!cookingMethod) {
      return NextResponse.json("Cooking Method not found", { status: 404 });
    }
    if (cookingMethod._count.recipeCookingMethod > 0) {
      return NextResponse.json("Cooking method is linked to recipes", { status: 409 });
    }

    const deletedCookingMethod = await db.cookingMethods.delete({
      where: { id: cookingMethodId },
    });

    try {
      await deleteFolderFromS3(`cookingMethods/${cookingMethodId}`);
    } catch (error) {
      console.error("[COOKING_METHOD_MEDIA_CLEANUP]", error);
    }

    return NextResponse.json(deletedCookingMethod, { status: 200 });
  } catch (error) {
    console.log("[COOKINGMETHOD_ID_DELETE]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
export async function PATCH(req: Request, props: { params: Promise<{ cookingMethodId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { cookingMethodId } = params;
    const { title, imageUrl, isPublished } = (await req.json()) as UpdateCookingMethodBody;

    if (title === undefined && imageUrl === undefined && isPublished === undefined) {
      return NextResponse.json("No cooking method changes supplied", { status: 400 });
    }

    const normalizedTitle = title?.trim();

    if (title !== undefined && !normalizedTitle) {
      return NextResponse.json("Cooking method title is required", { status: 400 });
    }
    if (isPublished !== undefined && typeof isPublished !== "boolean") {
      return NextResponse.json("Invalid published state", { status: 400 });
    }

    const currentCookingMethod = await db.cookingMethods.findUnique({
      where: { id: cookingMethodId },
    });

    if (!currentCookingMethod) {
      return NextResponse.json("Cooking Method not found", { status: 404 });
    }

    const normalizedImageUrl =
      imageUrl === undefined ? undefined : imageUrl?.trim() || null;
    if (normalizedImageUrl) {
      try {
        getVerifiedPublicMediaKey(normalizedImageUrl);
      } catch {
        return NextResponse.json("Invalid cooking method image URL", { status: 400 });
      }
    }

    const cookingMethod = await db.cookingMethods.update({
      where: { id: cookingMethodId },
      data: {
        ...(normalizedTitle && {
          title: normalizedTitle,
          slug: slugify(normalizedTitle),
        }),
        ...(imageUrl !== undefined && { imageUrl: normalizedImageUrl }),
        ...(isPublished !== undefined && { isPublished }),
      },
    });

    return NextResponse.json(cookingMethod, { status: 200 });
  } catch (error) {
    console.log("[COOKINGMETHODID]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
