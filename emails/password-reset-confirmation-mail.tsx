import {
  EmailButton,
  EmailParagraph,
  EmailShell,
  emailLinks,
} from "@/emails/components/email-shell";

interface PasswordResetConfirmationMailProps {
  name: string;
}

const PasswordResetConfirmationMail = ({
  name,
}: PasswordResetConfirmationMailProps) => (
  <EmailShell
    eyebrow="Password updated"
    preview="Your Kya Khayen password has been changed."
    title={`Password updated, ${name}.`}
  >
    <EmailParagraph>
      Your account password was successfully changed. You can now continue to
      your saved recipes and meal plans.
    </EmailParagraph>
    <EmailButton href={emailLinks.login}>Sign in securely</EmailButton>
    <EmailParagraph>
      If you did not make this change, please contact support immediately.
    </EmailParagraph>
  </EmailShell>
);

export default PasswordResetConfirmationMail;
