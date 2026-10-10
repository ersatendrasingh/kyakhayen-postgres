import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bell, BookHeart, CalendarDays, Download, Smartphone } from "lucide-react";

import Container from "@/components/container";
import DevicePreview from "@/components/meal-plan/device-preview";
import {
  InformationBoundary,
  SectionEyebrow,
  TrustHero,
} from "@/components/trust/trust-page";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Install Kya Khayen App | Recipes and Meal Ideas on Mobile",
  description:
    "Install the Kya Khayen web app to explore recipes, save dishes and open your taste-based meal plan from your phone.",
  path: "/download-app",
  image: "/meta-images/download-app.png",
  imageAlt: "Install the Kya Khayen web app",
});

const features = [
  {
    icon: BookHeart,
    title: "Save recipes",
    description: "Keep dishes you want to revisit in your account.",
  },
  {
    icon: CalendarDays,
    title: "Open meal plans",
    description: "Carry your seven-day food ideas in a phone-friendly view.",
  },
  {
    icon: Bell,
    title: "Optional alerts",
    description: "Enable notifications only when you want updates.",
  },
];

const installGuides = [
  {
    title: "Android with Chrome",
    steps: [
      "Open Kya Khayen in Chrome on your phone.",
      "Tap the browser menu and choose Install app or Add to Home screen.",
      "Confirm installation, then open Kya Khayen from your home screen.",
    ],
  },
  {
    title: "iPhone with Safari",
    steps: [
      "Open Kya Khayen in Safari on your iPhone.",
      "Tap Share, then choose Add to Home Screen.",
      "Confirm Add and open the new Kya Khayen icon.",
    ],
  },
];

export default function DownloadAppPage() {
  return (
    <div className="bg-[#fcf8f0] dark:bg-[#091712]">
      <TrustHero
        eyebrow="Install the app"
        title="Your recipe ideas, ready on your home screen."
        description="Kya Khayen is installable from your browser as a lightweight web app. Browse recipes, return to saved dishes and view taste-based meal plans with a mobile-first experience."
        badge="No app-store download required."
        actions={[
          { href: "#install-guide", label: "How to install" },
          { href: "/recipes", label: "Explore first", secondary: true },
        ]}
        imageContent={
          <div className="relative flex min-h-[360px] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_45%_35%,#fff0d6,transparent_44%),linear-gradient(145deg,#f6ead5,#efe0c6)] p-7 dark:bg-[radial-gradient(circle_at_42%_32%,rgba(221,177,98,.22),transparent_40%),linear-gradient(145deg,#10271f,#0c1612)]">
            <DevicePreview className="max-w-[600px]" />
          </div>
        }
      />
      <Container>
        <section className="my-10 grid gap-4 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-[1.45rem] border border-[#ebdeca] bg-[#fffdf8] p-5 dark:border-white/8 dark:bg-[#10241e]"
            >
              <Icon className="size-5 text-[#b93e30] dark:text-[#e1b268]" />
              <h2 className="mt-4 text-base font-semibold text-[#332820] dark:text-[#edf2eb]">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#746559] dark:text-[#a9b8b1]">
                {description}
              </p>
            </div>
          ))}
        </section>

        <section
          id="install-guide"
          className="scroll-mt-32 rounded-[2rem] border border-[#eadcc7] bg-[#fffdf9] p-6 sm:p-9 dark:border-white/8 dark:bg-[#10241e]"
        >
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <SectionEyebrow>Install guide</SectionEyebrow>
              <h2 className="mt-3 text-3xl font-semibold text-[#30261f] dark:text-[#eff3ec]">
                Add Kya Khayen in a few taps.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-7 text-[#75665b] dark:text-[#a9b8b1]">
              Installation options depend on your browser. Look for an install
              prompt or use your browser menu.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {installGuides.map((guide) => (
              <div
                key={guide.title}
                className="rounded-[1.45rem] border border-[#eee2d0] bg-[#fcf6eb] p-5 sm:p-6 dark:border-white/8 dark:bg-[#132c24]"
              >
                <h3 className="flex items-center gap-2 text-base font-semibold text-[#30261f] dark:text-[#edf2eb]">
                  <Smartphone className="size-5 text-[#b93d30] dark:text-[#dfad63]" />
                  {guide.title}
                </h3>
                <ol className="mt-5 space-y-4">
                  {guide.steps.map((step, index) => (
                    <li
                      key={step}
                      className="flex gap-3 text-sm leading-6 text-[#716256] dark:text-[#aebcb4]"
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-[#b83d2f] dark:bg-white/[0.08] dark:text-[#e6b76a]">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>

        <InformationBoundary className="my-8" compact />

        <section className="mb-16 overflow-hidden rounded-[2rem] bg-[#2a211b] px-6 py-8 text-white sm:px-9 lg:flex lg:items-center lg:justify-between dark:bg-[#142e26]">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#efc57a]">
              <Download className="size-4" />
              Ready to begin
            </p>
            <h2 className="mt-3 text-2xl font-semibold">
              Start with recipes, then build your weekly table.
            </h2>
          </div>
          <Link
            href="/meal-plan/create"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#c43e2f] px-6 py-3 text-sm font-semibold transition hover:bg-[#ad3427] lg:mt-0"
          >
            Create meal plan <ArrowRight className="size-4" />
          </Link>
        </section>
      </Container>
    </div>
  );
}
