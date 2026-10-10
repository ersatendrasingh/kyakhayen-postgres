import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request, props: { params: Promise<{ userId: string }> }) {
  const params = await props.params;
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json("User Id not provided", { status: 401 });
    }
    const userDetails = await db.user.findUnique({
      where: {
        id: userId,
      },
    });
    return NextResponse.json(userDetails, { status: 200 });
  } catch (error) {
    console.log("[USER]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
