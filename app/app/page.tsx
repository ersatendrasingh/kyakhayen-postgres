import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { PwaWelcome } from "@/components/pwa/pwa-welcome";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Welcome to Kya Khayen",
  description: "Open the Kya Khayen installed app experience.",
  path: "/app",
  noIndex: true,
});

export default async function InstalledAppEntryPage() {
  const session = await auth();

  if (session?.user) {
    redirect(session.user.isPersonalised ? "/meal-plan" : "/user/dashboard");
  }

  return <PwaWelcome />;
}
