"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { ArrowRight, BellRing, BookOpen, CalendarDays, ChefHat, Sparkles } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";

const callbackUrl = "/user/dashboard";

export function PwaWelcome() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-[#fbf7f0] px-5 pb-6 pt-[max(1.25rem,env(safe-area-inset-top))] text-[#2f241d] dark:bg-[#081511] dark:text-[#f3ede5]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_4%,rgba(198,58,42,0.17),transparent_33%),radial-gradient(circle_at_12%_42%,rgba(222,177,100,0.23),transparent_34%),linear-gradient(180deg,#fffdf8_0%,#f6ead8_100%)] dark:bg-[radial-gradient(circle_at_80%_6%,rgba(191,54,40,0.2),transparent_32%),linear-gradient(180deg,#081511_0%,#132a22_100%)]" />
      <header className="relative flex items-center justify-between">
        <div className="rounded-2xl border border-[#ebdbc5] bg-white/90 px-4 py-2 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
          <Logo compact />
        </div>
        <span className="rounded-full bg-[#f0e2cb] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a5b32] dark:bg-white/[0.08] dark:text-[#ddb879]">
          App
        </span>
      </header>

      <section className="relative flex flex-1 flex-col justify-center py-8">
        <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-[#ecd9bc] bg-white/70 px-3 py-1.5 text-xs font-semibold text-[#a06334] shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-[#e1b770]">
          <Sparkles className="size-3.5" />
          Personal kitchen companion
        </div>
        <h1 className="max-w-sm text-[2.35rem] font-semibold leading-[1.1] tracking-tight sm:text-5xl">
          Meals planned around your taste.
        </h1>
        <p className="mt-4 max-w-sm text-sm leading-7 text-[#716154] dark:text-[#abb9b0]">
          Sign in for personalised plans, saved recipes and useful reminders. Or browse fresh recipe ideas before you decide.
        </p>

        <div className="mt-8 grid grid-cols-3 gap-2.5">
          <Feature icon={CalendarDays} label="Meal plans" />
          <Feature icon={ChefHat} label="Your taste" />
          <Feature icon={BellRing} label="Reminders" />
        </div>
      </section>

      <section className="relative rounded-[1.7rem] border border-[#ead8c0] bg-white/92 p-4 shadow-[0_25px_60px_-34px_rgba(61,38,18,0.42)] backdrop-blur-sm dark:border-white/10 dark:bg-[#10221c]/94">
        <Button
          type="button"
          variant="outline"
          className="h-13 w-full rounded-xl border-[#e1d0ba] bg-white text-sm font-semibold text-[#382a1f] hover:bg-[#fff9ee] dark:border-white/12 dark:bg-white/[0.05] dark:text-[#f3ede5] dark:hover:bg-white/[0.1]"
          onClick={() => signIn("google", { callbackUrl })}
        >
          <FcGoogle className="size-5" />
          Continue with Google
        </Button>
        <div className="my-3 flex items-center gap-3">
          <span className="h-px flex-1 bg-[#ecdfcf] dark:bg-white/10" />
          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#938274] dark:text-[#9faaa3]">or</span>
          <span className="h-px flex-1 bg-[#ecdfcf] dark:bg-white/10" />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <Button asChild className="h-12 rounded-xl">
            <Link href="/auth/register?callbackUrl=%2Fuser%2Fdashboard">Create account</Link>
          </Button>
          <Button asChild variant="outline" className="h-12 rounded-xl">
            <Link href="/auth/login?callbackUrl=%2Fuser%2Fdashboard">Sign in</Link>
          </Button>
        </div>
        <Link
          href="/recipes?source=pwa-guest"
          className="mt-3 flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-[#8a5830] transition hover:bg-[#fbf3e7] dark:text-[#ddb374] dark:hover:bg-white/[0.05]"
        >
          <BookOpen className="size-4" />
          Explore recipes as guest
          <ArrowRight className="size-4" />
        </Link>
      </section>
    </main>
  );
}

function Feature({ icon: Icon, label }: { icon: typeof CalendarDays; label: string }) {
  return (
    <div className="rounded-2xl border border-[#ead9c2] bg-white/66 p-3 text-center shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
      <Icon className="mx-auto size-5 text-[#bc3d2e] dark:text-[#dfb36b]" />
      <p className="mt-2 text-[11px] font-semibold">{label}</p>
    </div>
  );
}
