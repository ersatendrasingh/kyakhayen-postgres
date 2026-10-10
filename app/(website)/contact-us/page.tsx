import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Mail, MessageCircleMore, TriangleAlert } from "lucide-react";

import ContactForm from "@/components/contact/contact-form";
import { FAQ } from "@/components/contact/faqs";
import Container from "@/components/container";
import {
  InformationBoundary,
  SectionEyebrow,
  TrustHero,
} from "@/components/trust/trust-page";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Contact Kya Khayen | Recipe and Meal Plan Support",
  description:
    "Contact Kya Khayen for account, recipe, meal-plan or privacy questions.",
  path: "/contact-us",
  image: "/meta-images/contact-us.png",
  imageAlt: "Contact Kya Khayen support",
});

export default function ContactUsPage() {
  return (
    <div className="bg-[#fcf8f0] dark:bg-[#091712]">
      <TrustHero
        eyebrow="Support and feedback"
        title="Tell us how we can help your kitchen journey."
        description="Questions about recipes, your account, meal-plan generation, privacy or a feature idea? Send us a message and include enough detail for us to investigate."
        imageSrc="/assets/images/contact-support-hero.webp"
        imageAlt="A person using a phone at a kitchen counter with fresh ingredients"
        badge="Support is provided by email and this contact form."
      />
      <Container>
        <div className="mt-9 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.45rem] border border-[#eadcc7] bg-[#fffdf8] p-5 dark:border-white/8 dark:bg-[#10241e]">
            <Mail className="size-5 text-[#b93c2f] dark:text-[#dfae61]" />
            <h2 className="mt-4 text-sm font-semibold text-[#332820] dark:text-[#edf2ea]">
              Email support
            </h2>
            <a
              href="mailto:mailtokyakhayen@gmail.com"
              className="mt-2 block text-sm text-[#b53a2d] underline underline-offset-4 dark:text-[#deb063]"
            >
              mailtokyakhayen@gmail.com
            </a>
          </div>
          <div className="rounded-[1.45rem] border border-[#eadcc7] bg-[#fffdf8] p-5 dark:border-white/8 dark:bg-[#10241e]">
            <MessageCircleMore className="size-5 text-[#b93c2f] dark:text-[#dfae61]" />
            <h2 className="mt-4 text-sm font-semibold text-[#332820] dark:text-[#edf2ea]">
              Helpful details
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#75665a] dark:text-[#a7b6af]">
              Mention the page, device and issue you saw for faster support.
            </p>
          </div>
          <div className="rounded-[1.45rem] border border-[#eadcc7] bg-[#fffaf1] p-5 dark:border-white/8 dark:bg-[#10241e]">
            <TriangleAlert className="size-5 text-[#b93c2f] dark:text-[#dfae61]" />
            <h2 className="mt-4 text-sm font-semibold text-[#332820] dark:text-[#edf2ea]">
              Not for emergencies
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#75665a] dark:text-[#a7b6af]">
              Do not use this form for allergy reactions or medical concerns.
            </p>
          </div>
        </div>

        <InformationBoundary className="my-8" compact />

        <section className="grid gap-6 pb-16 lg:grid-cols-[1.08fr_.92fr]">
          <div className="rounded-[1.7rem] border border-[#eadcc8] bg-[#fffdf9] p-6 sm:p-8 dark:border-white/8 dark:bg-[#10241e]">
            <SectionEyebrow>Send a message</SectionEyebrow>
            <h2 className="mt-3 text-2xl font-semibold text-[#30261f] dark:text-[#eff3ec]">
              We are listening.
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#75665a] dark:text-[#a8b7b0]">
              Please do not include medical history, diagnosis or prescription
              details in your message.
            </p>
            <ContactForm />
          </div>
          <div className="space-y-5">
            <div className="rounded-[1.7rem] border border-[#eadcc8] bg-[#fffdf9] p-6 sm:p-8 dark:border-white/8 dark:bg-[#10241e]">
              <SectionEyebrow>Common questions</SectionEyebrow>
              <h2 className="mb-5 mt-3 text-2xl font-semibold text-[#30261f] dark:text-[#eff3ec]">
                Quick answers
              </h2>
              <FAQ />
            </div>
            <div className="rounded-[1.7rem] bg-[#2c211b] p-6 text-white sm:p-8 dark:bg-[#153027]">
              <SectionEyebrow>Take it with you</SectionEyebrow>
              <h2 className="mt-3 text-xl font-semibold">
                Install Kya Khayen on your phone.
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/68">
                Keep recipes and your meal ideas within easy reach through our
                installable web app.
              </p>
              <Link
                href="/download-app"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#bd3e2e] px-5 py-3 text-sm font-semibold"
              >
                Download app <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      </Container>
    </div>
  );
}
