import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { currentPassword, password, confirmPassword } = await req.json();
    if (password !== confirmPassword) {
      return NextResponse.json(
        "New Password and Confirm Password do not match",
        { status: 400 }
      );
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const existingPassword = await db.user.findUnique({
      where: { email: user.email! },
      select: { password: true },
    });
    const existingPasswordHash = existingPassword?.password;
    if (existingPasswordHash) {
      const isPasswordMatch = await bcrypt.compare(
        currentPassword,
        existingPasswordHash
      );
      if (!isPasswordMatch) {
        return NextResponse.json("Current password is incorrect", {
          status: 400,
        });
      }
    }

    if (existingPasswordHash) {
      const isNewPasswordSame = await bcrypt.compare(
        password,
        existingPasswordHash
      );
      if (isNewPasswordSame) {
        return NextResponse.json(
          "New password cannot be same as current password",
          { status: 400 }
        );
      }
    }
    await db.user.update({
      where: { email: user.email! },
      data: { password: hashedPassword },
    });
    return NextResponse.json("Password changed successfully", { status: 200 });
  } catch (error) {
    console.log("[CHANGE_PASSWORD]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
