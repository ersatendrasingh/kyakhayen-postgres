import {
  CodeBlock,
  EmailParagraph,
  EmailShell,
} from "@/emails/components/email-shell";

interface TwoFAMailProps {
  name: string;
  code: string;
}

const TwoFAMail = ({ name, code }: TwoFAMailProps) => (
  <EmailShell
    eyebrow="Secure sign-in"
    preview="Your Kya Khayen verification code is ready."
    title={`${name}, use this sign-in code.`}
  >
    <EmailParagraph>
      Enter this one-time code to finish signing in. It expires in five minutes
      and can be used only once.
    </EmailParagraph>
    <CodeBlock code={code} />
    <EmailParagraph>
      If this sign-in was not initiated by you, do not share this code and
      ignore this message.
    </EmailParagraph>
  </EmailShell>
);

export default TwoFAMail;
