import { jsPDF } from "jspdf";

export const pdfColours = {
  accent: [194, 59, 44] as [number, number, number],
  ink: [48, 37, 31] as [number, number, number],
  copy: [103, 89, 80] as [number, number, number],
  cream: [248, 241, 231] as [number, number, number],
  forest: [25, 55, 46] as [number, number, number],
  gold: [195, 142, 67] as [number, number, number],
  line: [234, 220, 200] as [number, number, number],
};

export function createBrandedPdf(title: string, subtitle: string) {
  const document = new jsPDF({ format: "a4", unit: "mm" });

  document.setFillColor(...pdfColours.cream);
  document.rect(0, 0, 210, 297, "F");
  document.setFillColor(...pdfColours.forest);
  document.roundedRect(12, 12, 186, 36, 5, 5, "F");
  document.setTextColor(255, 255, 255);
  document.setFont("helvetica", "bold");
  document.setFontSize(17);
  document.text("KYA KHAYEN", 22, 28);
  document.setFontSize(8);
  document.setTextColor(226, 194, 133);
  document.setCharSpace(1);
  document.text("A KASA PRODUCT", 22, 38);
  document.setCharSpace(0);
  document.setTextColor(...pdfColours.ink);
  document.setFontSize(22);
  document.text(title, 18, 67);
  document.setFont("helvetica", "normal");
  document.setFontSize(10);
  document.setTextColor(...pdfColours.copy);
  document.text(subtitle, 18, 76);

  return document;
}

export function pdfToAttachment(document: jsPDF, filename: string) {
  return {
    filename,
    content: Buffer.from(document.output("arraybuffer")).toString("base64"),
    contentType: "application/pdf",
  };
}

export function addPdfFooter(document: jsPDF, page: number) {
  document.setDrawColor(...pdfColours.line);
  document.line(18, 278, 192, 278);
  document.setTextColor(...pdfColours.copy);
  document.setFont("helvetica", "normal");
  document.setFontSize(8);
  document.text(
    "Kya Khayen is a KASA product. Meal-planning information only, not medical or allergy advice.",
    18,
    284,
  );
  document.text(`Page ${page}`, 192, 284, { align: "right" });
}
