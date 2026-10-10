import type { Metadata } from "next";

import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    default: "Admin | Kya Khayen",
    template: "%s | Kya Khayen Admin",
  },
  robots: noIndexRobots(),
};

export const dynamic = "force-dynamic";

export default function AdminRoutesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
