import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Database, FileLock2, MessageSquareText, SlidersHorizontal } from "lucide-react";

import Container from "@/components/container";
import {
  InformationBoundary,
  SectionEyebrow,
  TrustHero,
} from "@/components/trust/trust-page";
import { buildSeoMetadata } from "@/lib/seo";

const updatedAt = "26 May 2026";

export const metadata: Metadata = buildSeoMetadata({
  title: "Privacy Policy | Kya Khayen",
  description:
    "Understand how Kya Khayen handles account details, food choices, saved recipes, meal plans and support requests.",
  path: "/privacy-policy",
  image: "/meta-images/privacy-policy.png",
  imageAlt: "Kya Khayen privacy policy",
});

const navigation = [
  ["scope", "Scope"],
  ["collect", "Information we collect"],
  ["use", "How we use it"],
  ["plans", "Meal plans and food choices"],
  ["sharing", "Service providers and sharing"],
  ["retention", "Retention and security"],
  ["choices", "Your choices"],
  ["updates", "Updates and contact"],
];

const collected = [
  {
    icon: Database,
    title: "Account details",
    text: "Name, email address, profile information and account authentication records.",
  },
  {
    icon: SlidersHorizontal,
    title: "Food choices",
    text: "Food style, cuisine selections, ingredient exclusions and cooking comfort.",
  },
  {
    icon: FileLock2,
    title: "Kitchen activity",
    text: "Saved or viewed recipes and meal plans generated for your account.",
  },
  {
    icon: MessageSquareText,
    title: "Support messages",
    text: "Information you submit through the contact form or send to support.",
  },
];

function PolicySection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-36 border-b border-[#eadfce] pb-8 last:border-none dark:border-white/8">
      <h2 className="text-xl font-semibold text-[#30261f] dark:text-[#eef2eb]">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-[#716358] dark:text-[#abb9b2]">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-[#fcf8f0] dark:bg-[#091712]">
      <TrustHero
        eyebrow="Privacy policy"
        title="Your choices should stay yours."
        description="This policy explains what information Kya Khayen handles when you explore recipes, create an account, submit food preferences, generate a meal plan or contact us."
        badge={`Last updated: ${updatedAt}`}
        imageContent={
          <div className="flex min-h-[300px] flex-col justify-between bg-[radial-gradient(circle_at_84%_15%,rgba(213,165,80,0.28),transparent_38%),linear-gradient(145deg,#1b362c,#11100d)] p-7 text-white sm:min-h-[390px] sm:p-9">
            <FileLock2 className="size-10 text-[#f0c979]" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#e7bf76]">
                Privacy in practice
              </p>
              <p className="mt-4 max-w-md text-2xl font-semibold leading-tight sm:text-3xl">
                Private meal plans. Taste-based choices. Clear boundaries.
              </p>
              <p className="mt-4 text-sm leading-7 text-white/68">
                We do not request disease, diagnosis or medical treatment
                details for personalization.
              </p>
            </div>
          </div>
        }
      />
      <Container>
        <InformationBoundary className="my-9" compact />

        <section className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {collected.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-[1.35rem] border border-[#ecdfcc] bg-[#fffdf8] p-5 dark:border-white/8 dark:bg-[#10241e]"
            >
              <Icon className="size-5 text-[#b83d30] dark:text-[#dfae61]" />
              <h2 className="mt-4 text-sm font-semibold text-[#332820] dark:text-[#edf2eb]">
                {title}
              </h2>
              <p className="mt-2 text-xs leading-6 text-[#75665a] dark:text-[#a7b7af]">
                {text}
              </p>
            </div>
          ))}
        </section>

        <div className="mb-16 grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="h-fit rounded-[1.45rem] border border-[#ebddc9] bg-[#fffaf2] p-5 lg:sticky lg:top-32 dark:border-white/8 dark:bg-[#10241e]">
            <SectionEyebrow>On this page</SectionEyebrow>
            <nav className="mt-4 flex flex-col gap-1.5">
              {navigation.map(([href, label]) => (
                <a
                  key={href}
                  href={`#${href}`}
                  className="rounded-xl px-3 py-2 text-sm text-[#655449] transition hover:bg-[#f1e5d2] hover:text-[#b23a2c] dark:text-[#b7c2bc] dark:hover:bg-white/[0.06] dark:hover:text-[#ecbf71]"
                >
                  {label}
                </a>
              ))}
            </nav>
          </aside>

          <article className="space-y-8 rounded-[1.7rem] border border-[#eadcc8] bg-[#fffdf9] p-6 sm:p-9 dark:border-white/8 dark:bg-[#10241e]">
            <PolicySection id="scope" title="1. Scope and who we are">
              <p>
                Kya Khayen is a recipe discovery and meal-planning information
                platform. This policy applies to this website, installed web
                app experience and associated account and support features.
              </p>
              <p>
                Our food planning tools are not a healthcare service. Please do
                not send medical history, diagnosis, prescriptions or other
                sensitive health details through personalization or support
                forms.
              </p>
            </PolicySection>

            <PolicySection id="collect" title="2. Information we collect">
              <p>
                We may collect account and profile information you submit, such
                as your name, email address, telephone number and profile
                details; information needed for login and account security; and
                messages you submit through support.
              </p>
              <p>
                When you use our food tools, we store your selected food style,
                preferred cuisines, ingredient exclusions, cooking comfort,
                saved recipes, recipe interactions and generated meal-plan
                records so that your experience can be shown again.
              </p>
              <p>
                Technical information may be processed to operate and protect
                the service, such as browser or device details, logs and
                notification tokens where you enable notifications.
              </p>
            </PolicySection>

            <PolicySection id="use" title="3. How we use information">
              <p>
                We use information to provide accounts, remember saved recipes,
                generate and display taste-based meal plans, respond to support
                requests, maintain security, troubleshoot failures and improve
                the website experience.
              </p>
              <p>
                We may send service communications connected with your account,
                support request or enabled notifications. Marketing messages, if
                introduced, should be subject to the choices provided to you.
              </p>
            </PolicySection>

            <PolicySection id="plans" title="4. Meal plans and food choices">
              <p>
                Meal plans can be stored as private files and records linked to
                your account so they can be retrieved or delivered to you. Food
                preference inputs are intended to represent ordinary taste and
                exclusion choices only, not health status or medical data.
              </p>
              <p>
                Ingredient exclusion selections do not guarantee that a recipe
                is suitable for an allergy or free of cross-contamination.
                Always review ingredients and preparation conditions yourself.
              </p>
            </PolicySection>

            <PolicySection id="sharing" title="5. Service providers and sharing">
              <p>
                Information may be processed by infrastructure, storage,
                authentication, notification, analytics or support providers
                that help us operate the service, subject to their applicable
                safeguards and our configuration. Private meal-plan files are
                intended to be stored in restricted storage rather than exposed
                as public media.
              </p>
              <p>
                We may also disclose information when required by law, to
                protect rights and security, in a business transfer, or when
                you ask or consent to a disclosure. We do not sell medical
                profiles because our meal-plan personalization is not designed
                to create them.
              </p>
            </PolicySection>

            <PolicySection id="retention" title="6. Retention and security">
              <p>
                We retain information for as long as reasonably needed to
                provide your account and meal-plan features, respond to
                requests, comply with legal requirements or protect the
                service. Retention periods may differ depending on the record
                and operational need.
              </p>
              <p>
                We use reasonable technical and organizational safeguards.
                However, no online transmission or storage system can be
                guaranteed completely secure.
              </p>
            </PolicySection>

            <PolicySection id="choices" title="7. Your choices and requests">
              <p>
                You may update available profile or food choices in your
                account and may contact us about access, correction, deletion
                or grievance requests relating to your information, subject to
                applicable law and necessary verification.
              </p>
              <p>
                You can manage browser permissions such as notifications
                through your device or browser settings. Removing stored food
                choices may affect existing personalization and meal plans.
              </p>
            </PolicySection>

            <PolicySection id="updates" title="8. Updates and contact">
              <p>
                We may update this policy as our features or legal requirements
                change. The revised date displayed above identifies the latest
                published version.
              </p>
              <p>
                Questions or privacy requests can be sent to{" "}
                <a
                  href="mailto:mailtokyakhayen@gmail.com"
                  className="font-medium text-[#b53b2e] underline underline-offset-4 dark:text-[#e5b365]"
                >
                  mailtokyakhayen@gmail.com
                </a>{" "}
                or submitted through our{" "}
                <Link
                  href="/contact-us"
                  className="font-medium text-[#b53b2e] underline underline-offset-4 dark:text-[#e5b365]"
                >
                  contact page
                </Link>
                .
              </p>
            </PolicySection>
          </article>
        </div>
      </Container>
    </div>
  );
}
