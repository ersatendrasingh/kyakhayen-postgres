import {
  EmailButton,
  EmailParagraph,
  EmailShell,
  emailLinks,
} from "@/emails/components/email-shell";

interface ContactThankyouMailProps {
  name: string;
}

const ContactThankyouMail = ({ name }: ContactThankyouMailProps) => (
  <EmailShell
    eyebrow="Message received"
    preview="We have received your Kya Khayen support request."
    title={`Thanks for reaching out, ${name}.`}
  >
    <EmailParagraph>
      Your message has reached our team. We will review it and respond using
      the email address you provided.
    </EmailParagraph>
    <EmailParagraph>
      In the meantime you can continue discovering recipes or building your
      weekly meal plan from your everyday food choices.
    </EmailParagraph>
    <EmailButton href={emailLinks.home}>Explore Kya Khayen</EmailButton>
  </EmailShell>
);

export default ContactThankyouMail;
