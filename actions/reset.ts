"use server";

import * as z from "zod";

import { ResetSchema } from "@/schemas";
import { render } from "react-email";
import { getUserByEmail } from "@/data/user";
import { sendEmail } from "@/lib/mail";
import { generatePasswordResetToken } from "@/lib/tokens";
import PasswordResetMail from "@/emails/password-reset-mail";

export const reset = async (values: z.infer<typeof ResetSchema>) => {
  const validatedFields = ResetSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid emaiL!" };
  }

  const { email } = validatedFields.data;

  const existingUser = await getUserByEmail(email);

  if (!existingUser) {
    return { error: "Email not found!" };
  }

  const passwordResetToken = await generatePasswordResetToken(email);

  await sendEmail({
    to: passwordResetToken.email,
    subject: "Reset your password",
    html: await render(
      PasswordResetMail({
        name: existingUser.name as string,
        token: passwordResetToken.token,
      })
    ),
  });

  return { success: "Reset email sent!" };
};
