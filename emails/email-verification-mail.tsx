import {
  CodeBlock,
  EmailParagraph,
  EmailShell,
} from "@/emails/components/email-shell";

interface EmailVerificationMailProps {
  name: string;
  token: string;
}

const EmailVerificationMail = ({ name, token }: EmailVerificationMailProps) => {
  return (
    <EmailShell
      eyebrow="Account security"
      preview="Confirm your email to sign in to Kya Khayen."
      title={`${name}, confirm your email.`}
    >
      <EmailParagraph>
        Your account needs one quick confirmation before you can sign in and
        access saved recipes or meal plans. Enter this one-time code:
      </EmailParagraph>
      <CodeBlock code={token} />
      <EmailParagraph>
        Enter the code in the sign-in screen you already opened to continue
        securely.
      </EmailParagraph>
      <EmailParagraph>
        This code expires in ten minutes. If you did not attempt to sign in, you
        can safely ignore this email.
      </EmailParagraph>
    </EmailShell>
  );
};

export default EmailVerificationMail;
