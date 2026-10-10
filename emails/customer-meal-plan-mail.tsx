import {
  EmailButton,
  EmailNotice,
  EmailParagraph,
  EmailShell,
  emailLinks,
} from "@/emails/components/email-shell";

interface CustomerMealPlanMailProps {
  subjectLine?: string;
  name: string;
  daysIncluded?: number;
  isDailyDelivery?: boolean;
}

const CustomerMealPlanMail = ({
  name,
  daysIncluded = 7,
  isDailyDelivery = false,
}: CustomerMealPlanMailProps) => (
  <EmailShell
    eyebrow={isDailyDelivery ? "Tomorrow's menu" : "Your table is ready"}
    preview="Your Kya Khayen meal plan PDF is ready."
    title={
      isDailyDelivery
        ? `${name}, tomorrow's meal plan is here.`
        : `${name}, your meal plan is ready.`
    }
  >
    <EmailParagraph>
      {isDailyDelivery
        ? "Your next-day plan is attached as a PDF, ready to keep handy while choosing what to cook."
        : `We have attached your ${daysIncluded}-day meal plan PDF. It is built from your food style, cuisines, ingredient exclusions and cooking comfort choices.`}
    </EmailParagraph>
    <EmailNotice tone="dark">
      The PDF is for everyday meal inspiration. Please review ingredients
      yourself before cooking, especially where an intolerance or allergy may
      matter.
    </EmailNotice>
    <EmailButton href={emailLinks.mealPlan}>View meal plan online</EmailButton>
    <EmailParagraph>
      Need different flavours next week? You can edit your food choices any
      time and generate a fresh plan.
    </EmailParagraph>
  </EmailShell>
);

export default CustomerMealPlanMail;
