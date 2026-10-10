import {
  DetailRow,
  DetailTable,
  EmailNotice,
  EmailParagraph,
  EmailShell,
} from "@/emails/components/email-shell";

interface ContactAdminMailProps {
  name: string;
  email: string;
  phoneNumber: string;
  message: string;
  timestamp: string;
}

const ContactAdminMail = ({
  name,
  email,
  phoneNumber,
  message,
  timestamp,
}: ContactAdminMailProps) => (
  <EmailShell
    eyebrow="Support inbox"
    preview="A new website enquiry has arrived."
    title="New website enquiry"
  >
    <EmailParagraph>
      A visitor submitted the Kya Khayen contact form. Their details are below.
    </EmailParagraph>
    <DetailTable>
      <DetailRow label="Name" value={name} />
      <DetailRow label="Email" value={email} />
      <DetailRow label="Phone" value={phoneNumber || "Not provided"} />
      <DetailRow label="Received" value={timestamp} />
    </DetailTable>
    <EmailNotice>
      <strong>Message</strong>
      <br />
      {message}
    </EmailNotice>
  </EmailShell>
);

export default ContactAdminMail;
