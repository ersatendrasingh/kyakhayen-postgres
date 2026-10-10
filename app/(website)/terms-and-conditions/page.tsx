import type { Metadata } from "next";
import Link from "next/link";
import { BadgeInfo, Check, FileText } from "lucide-react";

import Container from "@/components/container";
import {
  InformationBoundary,
  SectionEyebrow,
  TrustHero,
} from "@/components/trust/trust-page";
import { buildSeoMetadata } from "@/lib/seo";

const updatedAt = "26 May 2026";

export const metadata: Metadata = buildSeoMetadata({
  title: "Terms and Conditions | Kya Khayen",
  description:
    "Terms governing your use of Kya Khayen recipes, food preference tools and meal-plan information.",
  path: "/terms-and-conditions",
  image: "/meta-images/privacy-policy.png",
  imageAlt: "Kya Khayen terms and conditions",
});

const sections = [
  {
    title: "1. Acceptance and service scope",
    content: [
      "By accessing or using Kya Khayen, you agree to these terms and our Privacy Policy. If you do not agree, do not use the service.",
      "Kya Khayen provides recipe discovery, saved recipe features and meal-planning information based on everyday food choices such as food style, cuisines, ingredient exclusions and cooking comfort.",
    ],
  },
  {
    title: "2. Informational service only",
    content: [
      "Recipes and meal plans are offered for general food inspiration and organization. The service is not a medical, clinical, dietetic, nutritional treatment, diagnosis, disease-management or emergency service.",
      "We do not ask for or use disease details, medical goals, body type or clinical conditions to generate meal plans. Do not rely on this website to decide what is appropriate for a medical condition.",
    ],
  },
  {
    title: "3. Allergies, ingredients and food safety",
    content: [
      "An ingredient exclusion selected in your account is a planning preference and is not an allergy-safety guarantee. Recipes can change, substitute ingredients may be used and cross-contamination may occur during preparation or packaging.",
      "You are responsible for checking ingredient labels, recipe suitability, preparation hygiene, storage, cooking temperatures and any allergen risk. For allergies, intolerances, pregnancy, medical needs or prescribed diets, obtain advice from an appropriately qualified professional.",
    ],
  },
  {
    title: "4. Accounts and personalization",
    content: [
      "You are responsible for accurate account information, maintaining confidentiality of login credentials and activity performed through your account.",
      "Meal-plan outputs reflect submitted food choices and available recipe information. Results may vary and may not include every preferred option or exclusion in every circumstance. You should review a plan before using it.",
    ],
  },
  {
    title: "5. Content and permitted use",
    content: [
      "Site content, design, branding, photographs and curated recipe material are protected by applicable intellectual property laws unless otherwise identified. You may use the service for personal, non-commercial food planning.",
      "You must not scrape, republish, impersonate, interfere with service security, upload unlawful content, misuse support forms or use the service in a way that violates applicable law.",
    ],
  },
  {
    title: "6. Availability, third parties and future services",
    content: [
      "Features may change, be suspended or be unavailable from time to time. Links or services operated by third parties are subject to their own terms and policies.",
      "If Kya Khayen later offers food sale, delivery, paid products or other regulated activity, additional terms and legal requirements may apply to that separate activity. This website notice does not replace obligations imposed by applicable law.",
    ],
  },
  {
    title: "7. Disclaimers and limitation of liability",
    content: [
      "To the extent permitted by applicable law, the service is provided on an as-available basis without guarantees that every recipe, preference match, ingredient detail or meal-plan result will be complete or suitable for your circumstances.",
      "To the extent permitted by applicable law, Kya Khayen is not responsible for harm arising from reliance on recipe information as medical advice, failure to verify allergens or ingredients, unsafe food handling, or third-party products and services.",
    ],
  },
  {
    title: "8. Changes, governing law and contact",
    content: [
      "We may revise these terms to reflect feature, operational or legal changes. Continued use after published changes indicates acceptance of the revised terms to the extent permitted by law.",
      "These terms are governed by applicable laws of India, subject to any mandatory consumer rights. Questions can be sent to mailtokyakhayen@gmail.com or through the contact page.",
    ],
  },
];

export default function TermsAndConditionsPage() {
  return (
    <div className="bg-[#fcf8f0] dark:bg-[#091712]">
      <TrustHero
        eyebrow="Terms and conditions"
        title="Simple food inspiration, with clear boundaries."
        description="These terms set out how Kya Khayen can be used and explain the difference between everyday recipe planning and professional health or nutrition advice."
        badge={`Effective date: ${updatedAt}`}
        imageContent={
          <div className="flex min-h-[300px] flex-col bg-[radial-gradient(circle_at_82%_15%,rgba(215,165,76,0.28),transparent_38%),linear-gradient(145deg,#18352b,#110f0c)] p-7 text-white sm:min-h-[390px] sm:p-9">
            <div className="flex items-start justify-between gap-4">
              <span className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]">
                <FileText className="size-6 text-[#ecc271]" />
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
                26 May 2026
              </span>
            </div>
            <div className="mt-9 max-w-[420px]">
              <SectionEyebrow>Read before using</SectionEyebrow>
              <h2 className="mt-4 text-2xl font-semibold leading-tight sm:text-[1.7rem]">
                An honest agreement for everyday food ideas.
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/68">
                Kya Khayen organizes recipes around your food choices. It does
                not provide treatment advice or allergy clearance.
              </p>
            </div>
            <div className="mt-auto grid gap-2 pt-7 sm:grid-cols-3">
              {["Personal use", "Check ingredients", "No medical advice"].map(
                (item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-3 py-3 text-xs font-medium text-white/78"
                  >
                    <Check className="size-3.5 shrink-0 text-[#ecc271]" />
                    {item}
                  </div>
                ),
              )}
            </div>
          </div>
        }
      />
      <Container>
        <InformationBoundary className="my-9" />
        <div className="mb-16 grid gap-6 lg:grid-cols-[265px_minmax(0,1fr)]">
          <aside className="h-fit rounded-[1.45rem] border border-[#e9dbc7] bg-[#fffaf2] p-5 lg:sticky lg:top-32 dark:border-white/8 dark:bg-[#10241e]">
            <div className="flex size-10 items-center justify-center rounded-full bg-[#f3e5cf] text-[#b83c2e] dark:bg-[#19372e] dark:text-[#e3b267]">
              <BadgeInfo className="size-5" />
            </div>
            <h2 className="mt-4 font-semibold text-[#332820] dark:text-[#ecf2ea]">
              Important reminder
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#726357] dark:text-[#a9b8b0]">
              These terms clarify the platform scope. They are not a legal
              determination that no regulatory obligations can apply to future
              business activities.
            </p>
            <Link
              href="/privacy-policy"
              className="mt-5 inline-flex text-sm font-semibold text-[#b53b2e] dark:text-[#e4b264]"
            >
              Read privacy policy
            </Link>
          </aside>
          <article className="space-y-8 rounded-[1.7rem] border border-[#eadcc8] bg-[#fffdf9] p-6 sm:p-9 dark:border-white/8 dark:bg-[#10241e]">
            {sections.map((section) => (
              <section
                key={section.title}
                className="border-b border-[#ebdfcf] pb-8 last:border-none dark:border-white/8"
              >
                <h2 className="text-xl font-semibold text-[#30261f] dark:text-[#eef2eb]">
                  {section.title}
                </h2>
                <div className="mt-3 space-y-3 text-sm leading-7 text-[#716358] dark:text-[#abb9b2]">
                  {section.content.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </article>
        </div>
      </Container>
    </div>
  );
}
