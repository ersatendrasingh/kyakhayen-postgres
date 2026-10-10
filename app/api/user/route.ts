import { auth } from "@/auth";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const userEmail = user.email;
    const userDetails = await db.user.findUnique({
      where: {
        email: userEmail!,
      },
      include: {
        gender: true,
        foodPreference: true,
        userCuisines: {
          include: {
            cuisine: true,
          },
        },
        cookingSkill: true,
        UserAllrgies: {
          include: {
            allergy: true,
          },
        },
        UserPlan: {
          where: {
            endDate: {
              gte: new Date(),
            },
          },
          orderBy: {
            endDate: "desc",
          },
          include: {
            plan: true,
          },
        },
      },
    });
    return NextResponse.json(userDetails, { status: 200 });
  } catch (error) {
    console.log("[USER]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const userEmail = session?.user.email;
    const { firstName, lastName, ...values } = await req.json();

    const name = `${firstName} ${lastName}`;
    const updatedUser = await db.user.update({
      where: {
        email: userEmail!,
      },
      data: {
        name: name,

        ...values,
      },
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.log("[USER_UPDATE]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
