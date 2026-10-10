import {
  DetailRow,
  DetailTable,
  EmailShell,
} from "@/emails/components/email-shell";

interface CustomerOrderAdminMailProps {
  subjectLine: string;
  name: string;
  currency: string;
  email: string;
  phoneNumber: string;
  paymentMethod: string;
  paymentStatus: "Paid" | "Failed" | "Processing" | "Cancelled";
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

const CustomerOrderAdminMail = ({
  name,
  email,
  currency,
  phoneNumber,
  orderDetails = {
    orderId: "",
    orderDate: "",
    items: [],
    totalAmount: 0,
    subTotal: 0,
    totalTax: 0,
  },
  paymentMethod,
  paymentStatus,
}: CustomerOrderAdminMailProps) => (
  <EmailShell
    eyebrow="Payment operations"
    preview={`Membership payment event: ${paymentStatus}`}
    title={`Membership payment: ${paymentStatus}`}
  >
    <DetailTable>
      <DetailRow label="Customer" value={name} />
      <DetailRow label="Email" value={email} />
      <DetailRow label="Phone" value={phoneNumber || "Not provided"} />
      <DetailRow label="Order reference" value={orderDetails.orderId} />
      <DetailRow label="Created" value={orderDetails.orderDate} />
      <DetailRow
        label="Plan"
        value={orderDetails.items.map((item) => item.name).join(", ") || "-"}
      />
      <DetailRow label="Method" value={paymentMethod} />
      <DetailRow label="Status" value={paymentStatus} />
      <DetailRow
        label="Total"
        value={`${currency === "INR" ? "Rs. " : "$"}${orderDetails.totalAmount.toFixed(2)}`}
      />
    </DetailTable>
  </EmailShell>
);

export default CustomerOrderAdminMail;
