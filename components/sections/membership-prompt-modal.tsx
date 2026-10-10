"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, History, Sparkles, Wand2 } from "lucide-react";
import { useSession } from "next-auth/react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

const promptSeenKey = "kyakhayen-membership-prompt-seen";
const promptImages = [
  {
    src: "/assets/images/membership-prompt/stir-fried-mix-vegetables.webp",
    alt: "Stir fried broccoli with beans, mushrooms and bell peppers",
  },
  {
    src: "/assets/images/membership-prompt/bell-peppers-beans.webp",
    alt: "Green beans with red and yellow bell peppers",
  },
  {
    src: "/assets/images/membership-prompt/saute-cabbage-onions.webp",
    alt: "Fresh sauteed cabbage with herbs",
  },
];

const benefits = [
  {
    icon: Wand2,
    text: "Breakfast to dinner ideas arranged for your day",
  },
  {
    icon: CalendarDays,
    text: "Fresh plans built from cuisines and dishes you enjoy",
  },
  {
    icon: History,
    text: "Change upcoming meals while your earlier days stay saved",
  },
];

export default function MembershipPromptModal() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [nowMs] = useState(() => Date.now());
  const paidMember = session?.user?.userPlan?.some((plan, index) => {
    const endDate = session.user.userPlanEndDate?.[index];
    return (
      plan !== "Freemium" &&
      (!endDate || new Date(endDate).getTime() >= nowMs)
    );
  });
  const alreadyHasMealPlan = Boolean(session?.user?.isPersonalised);
  const hidePrompt = paidMember || alreadyHasMealPlan;

  useEffect(() => {
    if (status === "loading" || hidePrompt) return;

    try {
      if (window.sessionStorage.getItem(promptSeenKey)) return;
    } catch {
      // The prompt still works when browser storage is unavailable.
    }

    const timeout = window.setTimeout(() => {
      setOpen(true);
      try {
        window.sessionStorage.setItem(promptSeenKey, "true");
      } catch {
        // Ignore browser storage restrictions.
      }
    }, 4200);

    return () => window.clearTimeout(timeout);
  }, [hidePrompt, status]);

  if (hidePrompt) return null;

  const primaryHref = "/meal-plan/create";
  const primaryLabel = "Plan my week";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[min(885px,calc(100vw-1.25rem))] gap-0 overflow-hidden rounded-[1.7rem] border border-[#e8d7bf] bg-[#fffaf2] p-0 shadow-[0_34px_100px_-25px_rgba(48,28,14,0.55)] sm:max-w-[885px] dark:border-white/10 dark:bg-[#101f1a]">
        <div className="grid lg:grid-cols-[1.02fr_.92fr]">
          <div className="p-6 sm:p-8 lg:px-9 lg:py-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#f5e6cb] px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8d5f26] dark:bg-[#19362c] dark:text-[#e0b36c]">
              <Sparkles className="size-3.5" /> Membership
            </span>
            <DialogTitle className="mt-4 text-3xl font-semibold leading-tight text-[#30241d] sm:text-[2.2rem] dark:text-[#f2f1eb]">
              Seven days of meals, made to feel like yours.
            </DialogTitle>
            <DialogDescription className="mt-3 max-w-md text-sm leading-6 text-[#716052] dark:text-[#adb9b1]">
              Pick the food you enjoy and the way you like to cook. We will
              turn those choices into a beautiful meal plan ready to explore.
            </DialogDescription>
            <div className="mt-5 space-y-2.5">
              {benefits.map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-3 rounded-2xl bg-[#fbf2e5] px-4 py-2.5 text-sm font-medium text-[#514136] dark:bg-[#172d25] dark:text-[#dbe2dc]"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-[#b83c2e] shadow-sm dark:bg-[#203b31] dark:text-[#dfb36c]">
                    <Icon className="size-4" />
                  </span>
                  {text}
                </div>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2.5">
              <Link
                href={primaryHref}
                onClick={() => setOpen(false)}
                className="inline-flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-[#b83c2e] px-4 py-3 text-[13px] font-semibold text-white transition hover:bg-[#9e3024] sm:text-sm"
              >
                {primaryLabel} <ArrowRight className="size-4 shrink-0" />
              </Link>
              <Link
                href="/subscription-plans"
                onClick={() => setOpen(false)}
                className="inline-flex min-w-0 items-center justify-center whitespace-nowrap rounded-full border border-[#dfc9a9] px-4 py-3 text-[13px] font-semibold text-[#47372c] transition hover:bg-[#f5e8d5] dark:border-white/15 dark:text-[#edf0eb] dark:hover:bg-white/[0.05] sm:text-sm"
              >
                See plans
              </Link>
            </div>
            <p className="mt-4 text-xs leading-5 text-[#8a786a] dark:text-[#95a69e]">
              Food inspiration only. No medical or health profiling.
            </p>
          </div>

          <div className="relative hidden min-h-full bg-[#17271f] p-4 lg:block">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_8%,rgba(231,183,92,0.34),transparent_34%),linear-gradient(160deg,#1f3a2c,#16120e)]" />
            <div className="relative grid h-full grid-cols-2 gap-2.5">
              <div className="relative col-span-2 min-h-[202px] overflow-hidden rounded-[1.25rem]">
                <Image
                  src={promptImages[0].src}
                  alt={promptImages[0].alt}
                  fill
                  sizes="430px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#16251e]/82 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 rounded-full bg-white/14 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
                  Fresh ideas for your table
                </div>
              </div>
              {[1, 2].map((index) => (
                <div
                  key={index}
                  className="relative min-h-[132px] overflow-hidden rounded-[1.1rem]"
                >
                  <Image
                    src={promptImages[index].src}
                    alt={promptImages[index].alt}
                    fill
                    sizes="210px"
                    className="object-cover"
                  />
                </div>
              ))}
              <div className="col-span-2 flex items-center justify-between rounded-[1.1rem] border border-white/10 bg-white/[0.07] px-4 py-2.5 text-white">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#f1c979]">
                    Your next table
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    A planned week, ready to open.
                  </p>
                </div>
                <Sparkles className="size-5 text-[#edc678]" />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
