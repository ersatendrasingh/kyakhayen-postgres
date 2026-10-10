import type { Metadata } from "next";

import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Checkout | Kya Khayen",
  robots: noIndexRobots(),
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
