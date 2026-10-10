"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { render } from "react-email";

import { NewPasswordSchema } from "@/schemas";
import { getPasswordResetTokenByToken } from "@/data/password-reset-token";
import { getUserByEmail } from "@/data/user";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/mail";
import PasswordResetConfirmationMail from "@/emails/password-reset-confirmation-mail";

export const newPassword = async (
  values: z.infer<typeof NewPasswordSchema>,
  token?: string | null
) => {
  if (!token) {
    return { error: "Missing token!" };
  }

  const validatedFields = NewPasswordSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { password } = validatedFields.data;

  const existingToken = await getPasswordResetTokenByToken(token);

  if (!existingToken) {
    return { error: "Invalid token!" };
  }

  const hasExpired = new Date(existingToken.expires) < new Date();

  if (hasExpired) {
    return { error: "Token has expired!" };
  }

  const existingUser = await getUserByEmail(existingToken.email);

  if (!existingUser) {
    return { error: "Email does not exist!" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.user.update({
    where: { id: existingUser.id },
    data: { password: hashedPassword },
  });

  await db.passwordResetToken.delete({
    where: { id: existingToken.id },
  });
  await sendEmail({
    to: existingUser.email as string,
    subject: "Password Reset Complete: Welcome Back!",
    html: await render(
      PasswordResetConfirmationMail({
        name: existingUser.name as string,
      })
    ),
  });

  return {
    success:
      "Password updated! Check your email for confirmation. Go back to login page.",
  };
};
