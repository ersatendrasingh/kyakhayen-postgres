import type { Metadata } from "next";

import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Payment Status | Kya Khayen",
  robots: noIndexRobots(),
};

export default function SuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
