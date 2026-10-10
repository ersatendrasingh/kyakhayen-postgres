import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { phoneNumber } = await req.json(); // Destructure the phoneNumber from the request body
    console.log(phoneNumber);
    const user = await db.user.findUnique({
      where: { phoneNumber },
    });

    if (user) {
      return NextResponse.json(
        { message: "Phone number already exists" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { message: "Phone number is available" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error checking phone number:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
