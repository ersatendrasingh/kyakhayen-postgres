import {
  DetailRow,
  DetailTable,
  EmailButton,
  EmailNotice,
  EmailParagraph,
  EmailShell,
  emailLinks,
} from "@/emails/components/email-shell";

interface OrderConfirmationMailProps {
  subjectLine: string;
  name: string;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  orderDetails?: {
    orderId: string;
    orderDate: string;
    items: {
      name: string;
      quantity: number;
      durationDays: number | null;
      priceInr: number;
      priceUsd: number;
    }[];
    subTotal: number;
    totalTax: number;
    totalAmount: number;
    coupon?: string;
    discount?: number;
  };
}

const formatMoney = (value: number, currency: string) =>
  `${currency === "INR" ? "Rs. " : "$"}${value.toFixed(2)}`;

const OrderConfirmationMail = ({
  name,
  currency,
  paymentMethod,
  paymentStatus,
  orderDetails = {
    orderId: "",
    orderDate: "",
    items: [],
    totalAmount: 0,
    subTotal: 0,
    totalTax: 0,
  },
}: OrderConfirmationMailProps) => {
  const paid = paymentStatus === "Paid";
  const statusLabel = paid
    ? "Payment confirmed"
    : paymentStatus === "Cancelled"
      ? "Payment cancelled"
      : "Payment unsuccessful";

  return (
    <EmailShell
      eyebrow={statusLabel}
      preview={`${statusLabel} for your Kya Khayen membership.`}
      title={
        paid
          ? `${name}, your membership is active.`
          : `${name}, your payment was not completed.`
      }
    >
      <EmailParagraph>
        {paid
          ? "Thank you. Your secure payment is confirmed and your payment receipt PDF is attached to this email."
          : "Your membership was not activated and no successful charge was recorded by this confirmation. You may try again when ready."}
      </EmailParagraph>
      <DetailTable>
        <DetailRow label="Order reference" value={orderDetails.orderId} />
        <DetailRow label="Date" value={orderDetails.orderDate} />
        <DetailRow
          label="Membership"
          value={orderDetails.items.map((item) => item.name).join(", ") || "-"}
        />
        <DetailRow label="Payment method" value={paymentMethod} />
        <DetailRow label="Status" value={statusLabel} />
        {orderDetails.discount ? (
          <DetailRow
            label="Discount"
            value={`- ${formatMoney(orderDetails.discount, currency)}`}
          />
        ) : null}
        <DetailRow
          label="Total"
          value={formatMoney(orderDetails.totalAmount, currency)}
        />
      </DetailTable>
      {paid ? (
        <>
          <EmailNotice tone="dark">
            Your meal-plan delivery starts after your plan is generated. Your
            plan remains based on food preferences only.
          </EmailNotice>
          <EmailButton href={emailLinks.mealPlan}>Open my meal plan</EmailButton>
        </>
      ) : (
        <EmailButton href={emailLinks.plans}>Try payment again</EmailButton>
      )}
    </EmailShell>
  );
};

export default OrderConfirmationMail;
