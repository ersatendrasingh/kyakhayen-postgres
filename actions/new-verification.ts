"use server";

import { render } from "react-email";

import { db } from "@/lib/db";
import { getUserByEmail } from "@/data/user";
import { getVerificationTokenByToken } from "@/data/verificiation-token";
import { sendEmail } from "@/lib/mail";
import EmailVerifiedMail from "@/emails/email-verified-mail";
import { assignFreePlanToUser } from "@/lib/assignFreePlan";

export const newVerification = async (token: string) => {
  const existingToken = await getVerificationTokenByToken(token);

  if (!existingToken) {
    return { error: "Token does not exist!" };
  }

  const hasExpired = new Date(existingToken.expires) < new Date();

  if (hasExpired) {
    return { error: "Token has expired!" };
  }

  const existingUser = await getUserByEmail(existingToken.email);

  if (!existingUser) {
    return { error: "Email does not exist!" };
  }

  await db.user.update({
    where: { id: existingUser.id },
    data: {
      emailVerified: new Date(),
      email: existingToken.email,
    },
  });

  await db.verificationToken.delete({
    where: { id: existingToken.id },
  });

  // Assign free plan to user
  try {
    await assignFreePlanToUser(existingUser.id);
  } catch {
    return { error: "Failed to assign free plan" };
  }

  await sendEmail({
    to: existingUser.email as string,
    subject: "Your Kya Khayen email has been verified",
    html: await render(
      EmailVerifiedMail({
        name: existingUser.name as string,
      })
    ),
  });
  return { success: "Email verified!" };
};
