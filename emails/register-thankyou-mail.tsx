import {
  CodeBlock,
  EmailNotice,
  EmailParagraph,
  EmailShell,
} from "@/emails/components/email-shell";

interface RegisterThankyouMailProps {
  name: string;
  token: string;
}

const RegisterThankyouMail = ({ name, token }: RegisterThankyouMailProps) => {
  return (
    <EmailShell
      eyebrow="Welcome to Kya Khayen"
      preview="Confirm your email and begin building your weekly table."
      title={`Welcome, ${name}.`}
    >
      <EmailParagraph>
        Your account is almost ready. Enter this one-time verification code to
        save recipes and create meal plans around your everyday food preferences.
      </EmailParagraph>
      <CodeBlock code={token} />
      <EmailParagraph>
        Return to the Kya Khayen sign-up screen you already opened and enter
        this code to continue your meal plan.
      </EmailParagraph>
      <EmailNotice>
        We personalize by taste, cuisines, exclusions and cooking comfort only.
        We do not request health or medical details for meal planning.
      </EmailNotice>
      <EmailParagraph>
        This code expires in ten minutes. If you did not sign up,
        simply ignore this message.
      </EmailParagraph>
    </EmailShell>
  );
};

export default RegisterThankyouMail;
