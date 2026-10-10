import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import ContactThankyouMail from "@/emails/contact-thankyou-mail";
import ContactAdminMail from "@/emails/contact-admin-mail";
import { render } from "react-email";
import { sendEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const combinedData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      query: formData.get("query") as string,
    };

    const contact = await db.contactUsQueries.create({
      data: combinedData,
    });

    const createdAt =
      contact.createdAt instanceof Date
        ? contact.createdAt
        : new Date(contact.createdAt);

    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true, // Use 12-hour clock with AM/PM notation
      timeZone: "Asia/Kolkata", // Indian Standard Time (IST)
    };

    // Format the date according to options
    const formattedTimestamp = createdAt.toLocaleString("en-IN", options);

    await sendEmail({
      to: combinedData.email,
      subject: "Thank you for contact with us!",
      html: await render(
        ContactThankyouMail({
          name: combinedData.name,
        })
      ),
    });
    await sendEmail({
      to: process.env.ADMIN_EMAIL as string,
      subject: "New contact query from kyakhayen",
      html: await render(
        ContactAdminMail({
          name: combinedData.name,
          email: combinedData.email,
          phoneNumber: combinedData.phoneNumber,
          message: combinedData.query,
          timestamp: formattedTimestamp,
        })
      ),
    });

    return NextResponse.json(
      "Thank you for getting in touch with us. We have received your message and our team will get back to you as soon as possible.",
      {
        status: 200,
      }
    );
  } catch (error) {
    console.log("[CONTACT]", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
