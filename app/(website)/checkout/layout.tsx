import type { Metadata } from "next";

import { noIndexRobots } from "@/lib/seo";

// Checkout reads session/cart state at request time; keep this private route
// dynamic without disabling caching for the public website route group.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout | Kya Khayen",
  robots: noIndexRobots(),
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
