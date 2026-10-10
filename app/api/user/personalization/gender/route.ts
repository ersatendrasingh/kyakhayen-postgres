import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function PUT(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { newGender } = await req.json();

    const userRecord = await db.user.findUnique({
      where: { id: user.id },
      include: { gender: true },
    });

    if (!userRecord) {
      return NextResponse.json("User not found", { status: 404 });
    }

    if (userRecord.gender && userRecord.gender.id !== newGender.id) {
      await db.user.update({
        where: { id: user.id },
        data: { genderId: newGender.id },
      });
    } else if (!userRecord.gender) {
      await db.user.update({
        where: { id: user.id },
        data: { genderId: newGender.id },
      });
    }

    return NextResponse.json(userRecord, { status: 200 });
  } catch (error) {
    console.error("[UPDATE_GENDER]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
