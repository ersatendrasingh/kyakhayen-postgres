import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, Home } from "lucide-react";

const helpfulLinks = [
  { href: "/recipes", label: "Browse recipes", icon: BookOpen },
  { href: "/meal-plan/create", label: "Create a meal plan", icon: CalendarDays },
];

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center bg-[radial-gradient(circle_at_13%_12%,#f4dfbd,transparent_28%),radial-gradient(circle_at_91%_12%,#f4daca,transparent_29%),#fcf8f0] p-4 dark:bg-[radial-gradient(circle_at_13%_12%,rgba(205,151,71,0.13),transparent_30%),#091712] sm:p-8">
      <section className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-[#eadcc8] bg-[#fffdf9] shadow-[0_30px_90px_rgba(63,43,25,0.11)] lg:grid-cols-[0.96fr_1.04fr] dark:border-white/8 dark:bg-[#10241e]">
        <div className="flex flex-col justify-center p-8 sm:p-12">
          <Image
            src="/assets/images/kyakhayen-logo.png"
            alt="Kya Khayen"
            width={170}
            height={70}
            className="h-auto w-[155px] object-contain"
          />
          <p className="mt-10 text-xs font-semibold uppercase tracking-[0.3em] text-[#a87938] dark:text-[#d5a456]">
            Error 404
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-[#30261f] sm:text-5xl dark:text-[#edf3ed]">
            This page is not on the table.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-[#716358] sm:text-base dark:text-[#aab8b0]">
            The page may have moved, or the link may be incomplete. Continue
            with recipe ideas or return to the homepage.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-[#b83c2e] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#9d3125]"
          >
            <Home className="size-4" />
            Back to home
          </Link>
          <div className="mt-9 flex flex-col gap-3 border-t border-[#eadfce] pt-7 dark:border-white/8">
            {helpfulLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between rounded-xl border border-[#eadbc6] bg-[#fffaf2] px-4 py-3.5 text-sm font-semibold text-[#44362c] transition hover:border-[#d4b98e] dark:border-white/8 dark:bg-white/[0.035] dark:text-[#e7eee8]"
              >
                <span className="flex items-center gap-3">
                  <Icon className="size-4 text-[#b83c2e] dark:text-[#e3b267]" />
                  {label}
                </span>
                <ArrowRight className="size-4" />
              </Link>
            ))}
          </div>
        </div>
        <div className="relative hidden min-h-[650px] lg:block">
          <Image
            src="/assets/images/about-story-hero.webp"
            alt="Fresh ingredients prepared in a home kitchen"
            fill
            className="object-cover"
            sizes="50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#15261e]/80 via-transparent to-transparent" />
          <p className="absolute bottom-9 left-9 right-9 rounded-2xl border border-white/18 bg-black/20 p-5 text-sm leading-6 text-white backdrop-blur-sm">
            Everyday food inspiration, saved recipes and meal ideas are still
            ready for you.
          </p>
        </div>
      </section>
    </main>
  );
}
