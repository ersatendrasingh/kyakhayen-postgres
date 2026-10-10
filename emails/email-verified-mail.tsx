import {
  EmailButton,
  EmailNotice,
  EmailParagraph,
  EmailShell,
  emailLinks,
} from "@/emails/components/email-shell";

interface EmailVerifiedMailProps {
  name: string;
}

const EmailVerifiedMail = ({ name }: EmailVerifiedMailProps) => (
  <EmailShell
    eyebrow="Email confirmed"
    preview="Your Kya Khayen account is ready."
    title={`You're in, ${name}.`}
  >
    <EmailParagraph>
      Your email has been confirmed and your account is active. Your launch
      access is ready for recipe exploration and meal planning.
    </EmailParagraph>
    <EmailButton href={emailLinks.login}>Sign in</EmailButton>
    <EmailNotice>
      Create a seven-day meal plan from food style, cuisines, ingredients you
      exclude and cooking comfort. No medical profiling is required.
    </EmailNotice>
  </EmailShell>
);

export default EmailVerifiedMail;
