import {
  EmailButton,
  EmailNotice,
  EmailParagraph,
  EmailShell,
  emailLinks,
} from "@/emails/components/email-shell";

interface WelcomeSocialLoginMailProps {
  name: string;
}

const WelcomeSocialLoginMail = ({ name }: WelcomeSocialLoginMailProps) => (
  <EmailShell
    eyebrow="Welcome aboard"
    preview="Your Kya Khayen account is ready."
    title={`Welcome, ${name}.`}
  >
    <EmailParagraph>
      Your account has been securely created through your connected sign-in.
      Discover recipes, save favourites and plan your week.
    </EmailParagraph>
    <EmailButton href={emailLinks.preferences}>Create my meal plan</EmailButton>
    <EmailNotice>
      Your meal plan uses everyday food choices only, never disease, diagnosis
      or health-goal profiling.
    </EmailNotice>
  </EmailShell>
);

export default WelcomeSocialLoginMail;
