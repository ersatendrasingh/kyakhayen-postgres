import { readFile } from "node:fs/promises";
import path from "node:path";

export type EmailAttachment = {
  filename: string;
  content: string;
  contentType?: string;
  contentId?: string;
};

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
};

export const sendEmail = async (data: EmailPayload) => {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM_ADDRESS;
  const fromName = process.env.EMAIL_FROM_NAME || "Kya Khayen";

  if (!apiKey || !fromEmail) {
    throw new Error(
      "Email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM_ADDRESS."
    );
  }

  if (!data.to?.trim()) {
    throw new Error("Email recipient is not configured. Set ADMIN_EMAIL where required.");
  }

  const logo = await readFile(
    path.join(process.cwd(), "public/assets/images/kyakhayen-logo.png"),
  );
  const attachments: EmailAttachment[] = [
    {
      filename: "kyakhayen-logo.png",
      content: logo.toString("base64"),
      contentType: "image/png",
      contentId: "kyakhayen-logo",
    },
    ...(data.attachments || []),
  ];

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: data.to,
      subject: data.subject,
      html: data.html,
      attachments: attachments.map(
        ({ filename, content, contentType, contentId }) => ({
          filename,
          content,
          ...(contentType && { content_type: contentType }),
          ...(contentId && { content_id: contentId }),
        }),
      ),
    }),
  });

  if (!response.ok) {
    const reason = await response.text();
    throw new Error(`Email delivery failed: ${reason}`);
  }

  return response.json();
};
