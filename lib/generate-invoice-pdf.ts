import { format } from "date-fns";

import {
  addPdfFooter,
  createBrandedPdf,
  pdfColours,
  pdfToAttachment,
} from "@/lib/pdf-brand";

type InvoicePdfInput = {
  orderReference: string;
  issuedAt: Date;
  customerName: string;
  customerEmail: string;
  paymentMethod: string;
  paymentReference?: string;
  currency: string;
  planName: string;
  durationDays?: number | null;
  subTotal: number;
  discount?: number | null;
  taxTotal?: number | null;
  totalAmount: number;
};

function money(amount: number, currency: string) {
  return `${currency === "INR" ? "Rs." : "$"} ${amount.toFixed(2)}`;
}

export function generateInvoicePdf(input: InvoicePdfInput) {
  const document = createBrandedPdf(
    "Payment receipt",
    "Membership confirmation and transaction record",
  );
  const reference = input.orderReference || "membership-payment";

  document.setFillColor(255, 253, 249);
  document.roundedRect(18, 90, 174, 44, 4, 4, "F");
  document.setFont("helvetica", "bold");
  document.setFontSize(9);
  document.setTextColor(...pdfColours.gold);
  document.text("ISSUED TO", 25, 102);
  document.text("RECEIPT DETAILS", 108, 102);
  document.setFont("helvetica", "normal");
  document.setTextColor(...pdfColours.ink);
  document.setFontSize(11);
  document.text(input.customerName || "Kya Khayen member", 25, 113);
  document.setTextColor(...pdfColours.copy);
  document.setFontSize(9);
  document.text(input.customerEmail, 25, 121);
  document.text(`Receipt: ${reference}`, 108, 113);
  document.text(`Issued: ${format(input.issuedAt, "dd MMM yyyy")}`, 108, 121);
  document.text(`Payment: ${input.paymentMethod}`, 108, 129);

  document.setFillColor(...pdfColours.forest);
  document.roundedRect(18, 148, 174, 13, 3, 3, "F");
  document.setTextColor(255, 255, 255);
  document.setFont("helvetica", "bold");
  document.setFontSize(9);
  document.text("MEMBERSHIP", 24, 157);
  document.text("AMOUNT", 185, 157, { align: "right" });

  document.setTextColor(...pdfColours.ink);
  document.setFontSize(11);
  document.text(input.planName, 24, 177);
  document.text(money(input.subTotal, input.currency), 185, 177, {
    align: "right",
  });
  document.setFont("helvetica", "normal");
  document.setTextColor(...pdfColours.copy);
  document.setFontSize(9);
  document.text(
    input.durationDays
      ? `${input.durationDays} days of access`
      : "Membership access",
    24,
    185,
  );

  let lineY = 201;
  const rows = [
    ["Subtotal", money(input.subTotal, input.currency)],
    [
      "Discount",
      input.discount ? `- ${money(input.discount, input.currency)}` : "-",
    ],
    ["Tax", input.taxTotal ? money(input.taxTotal, input.currency) : "Not charged"],
  ];
  document.setFontSize(10);
  rows.forEach(([label, amount]) => {
    document.setTextColor(...pdfColours.copy);
    document.text(label, 107, lineY);
    document.setTextColor(...pdfColours.ink);
    document.text(amount, 185, lineY, { align: "right" });
    lineY += 9;
  });

  document.setDrawColor(...pdfColours.line);
  document.line(107, lineY, 185, lineY);
  document.setFont("helvetica", "bold");
  document.setTextColor(...pdfColours.ink);
  document.setFontSize(13);
  document.text("Paid", 107, lineY + 13);
  document.setTextColor(...pdfColours.accent);
  document.text(money(input.totalAmount, input.currency), 185, lineY + 13, {
    align: "right",
  });

  if (input.paymentReference) {
    document.setFont("helvetica", "normal");
    document.setTextColor(...pdfColours.copy);
    document.setFontSize(8);
    document.text(
      `Transaction reference: ${input.paymentReference}`,
      18,
      263,
    );
  }

  addPdfFooter(document, 1);
  return pdfToAttachment(document, `kya-khayen-receipt-${reference}.pdf`);
}
