"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { render } from "react-email";

import { db } from "@/lib/db";
import { RegisterSchema } from "@/schemas";
import { getUserByEmail, getUserByPhone } from "@/data/user";
import { generateVerificationToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/mail";
import RegisterThankyouMail from "@/emails/register-thankyou-mail";

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { email, password, name, phoneNumber } = validatedFields.data;
  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUserByEmail = await getUserByEmail(email);
  const existingUserByPhone = await getUserByPhone(phoneNumber);

  if (existingUserByEmail) {
    return { error: "Email already in use!" };
  }

  if (existingUserByPhone) {
    return { error: "Phone number already in use!" };
  }

  const registeredUser = await db.user.create({
    data: {
      name,
      phoneNumber,
      email,
      password: hashedPassword,
    },
  });

  const verificationToken = await generateVerificationToken(email);
  await sendEmail({
    to: verificationToken.email,
    subject:
      "Welcome to Kya Khayen?, " +
      registeredUser.name +
      "! Please Activate Your Account",
    html: await render(
      RegisterThankyouMail({
        name: registeredUser.name as string,
        token: verificationToken.token,
      })
    ),
  });

  return {
    success: "A 6-digit verification code has been sent to your email.",
    verificationRequired: true,
  };
};
