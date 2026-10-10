import type { Metadata } from "next";

import Container from "@/components/container";
import { auth } from "@/auth";
import { ShieldAlert } from "lucide-react";
import StickySidebar from "./_components/sticky-sidebar";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    default: "Your Kya Khayen Account",
    template: "%s | Kya Khayen",
  },
  robots: noIndexRobots(),
};

const UserLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth();

  if (session?.user?.isActive === false) {
    return (
      <section className="min-h-screen bg-[#fbf7f0] px-4 py-16 dark:bg-[#091611]">
        <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center">
          <div className="rounded-[2rem] border border-[#eadbc8] bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#11231d] sm:p-12">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#faece6] text-[#bd392b] dark:bg-[#bd392b]/15 dark:text-[#e48b7c]">
              <ShieldAlert className="size-7" />
            </span>
            <h1 className="mt-5 text-2xl font-semibold text-[#30251e] dark:text-[#eef2ec]">
              Your account is temporarily suspended
            </h1>
            <p className="mt-3 text-sm leading-7 text-[#736357] dark:text-[#aab8b0]">
              Your account access has been paused by support. Contact us if you
              believe this needs review.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#fbf7f0] py-6 dark:bg-[#091611] sm:py-8 lg:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_8%,rgba(210,167,101,0.18),transparent_26%),radial-gradient(circle_at_94%_12%,rgba(190,58,40,0.10),transparent_24%)] dark:bg-[radial-gradient(circle_at_18%_6%,rgba(205,151,71,0.10),transparent_24%),radial-gradient(circle_at_90%_8%,rgba(190,58,40,0.14),transparent_25%)]" />
      <Container>
        <div className="relative mx-auto grid max-w-[1420px] gap-5 lg:grid-cols-[276px_minmax(0,1fr)] lg:gap-7">
          <StickySidebar />
          <main className="min-w-0">{children}</main>
        </div>
      </Container>
    </section>
  );
};

export default UserLayout;
