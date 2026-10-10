import {
  EmailButton,
  EmailParagraph,
  EmailShell,
  emailLinks,
} from "@/emails/components/email-shell";

interface PasswordResetMailProps {
  name: string;
  token: string;
}

const PasswordResetMail = ({ name, token }: PasswordResetMailProps) => {
  const resetLink = `${emailLinks.home}/auth/new-password?token=${token}`;

  return (
    <EmailShell
      eyebrow="Account security"
      preview="Reset your Kya Khayen password securely."
      title={`${name}, reset your password.`}
    >
      <EmailParagraph>
        We received a request to reset your password. Use the secure button
        below to choose a new password.
      </EmailParagraph>
      <EmailButton href={resetLink}>Reset password</EmailButton>
      <EmailParagraph>
        This link expires in one hour. If you did not request a password reset,
        no action is needed.
      </EmailParagraph>
    </EmailShell>
  );
};

export default PasswordResetMail;
