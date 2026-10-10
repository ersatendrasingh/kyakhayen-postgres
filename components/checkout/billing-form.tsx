"use client";

import Link from "next/link";
import { ArrowRight, Mail, ShieldCheck, Smartphone, UserRound } from "lucide-react";

interface BillingFormProps {
  user?: {
    name?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
  };
}

export default function BillingForm({ user }: BillingFormProps) {
  if (!user) {
    return (
      <section className="rounded-[1.7rem] border border-[#eadbc6] bg-[#fffdf9] p-5 sm:p-7 dark:border-white/8 dark:bg-[#10241e]">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-1 size-5 text-[#b83c2e] dark:text-[#dfb36c]" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a77838] dark:text-[#d6aa60]">
              Secure checkout
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[#30251e] dark:text-[#eef2ec]">
              Sign in before payment
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-7 text-[#78685b] dark:text-[#aab8b0]">
              Your selected membership is ready. Create an account or sign in
              to confirm who the plan belongs to, then continue to Razorpay.
            </p>
          </div>
        </div>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/auth/register?callbackUrl=%2Fcheckout"
            className="inline-flex h-13 flex-1 items-center justify-center gap-2 rounded-full bg-[#b83c2e] px-5 text-sm font-semibold text-white transition hover:bg-[#9c3125]"
          >
            Create account
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/auth/login?callbackUrl=%2Fcheckout"
            className="inline-flex h-13 flex-1 items-center justify-center rounded-full border border-[#ddcab0] px-5 text-sm font-semibold text-[#44362c] transition hover:bg-[#f7ebd9] dark:border-white/12 dark:text-[#edf1eb] dark:hover:bg-white/[0.05]"
          >
            Sign in
          </Link>
        </div>
        <p className="mt-5 rounded-2xl bg-[#f8eee1] px-4 py-3 text-xs leading-6 text-[#706054] dark:bg-[#162e27] dark:text-[#aab8b0]">
          You will return to this checkout automatically after verification.
        </p>
      </section>
    );
  }

  const isComplete = Boolean(user.name && user.email && user.phoneNumber);

  return (
    <section className="rounded-[1.7rem] border border-[#eadbc6] bg-[#fffdf9] p-5 sm:p-7 dark:border-white/8 dark:bg-[#10241e]">
      <div className="flex items-start gap-3 border-b border-[#eee1d0] pb-5 dark:border-white/8">
        <ShieldCheck className="mt-1 size-5 text-[#b83c2e] dark:text-[#dfb36c]" />
        <div>
          <h2 className="text-lg font-semibold text-[#30251e] dark:text-[#eef2ec]">
            Confirm your account
          </h2>
          <p className="mt-1 max-w-md text-sm leading-6 text-[#78685b] dark:text-[#aab8b0]">
            This membership will be activated for the account below. No
            delivery address is needed for digital access.
          </p>
        </div>
      </div>
      <div className="mt-6 space-y-3">
        <IdentityLine icon={UserRound} label="Purchasing as" value={user.name || "Name missing"} />
        <IdentityLine icon={Mail} label="Receipt email" value={user.email || "Email missing"} />
        <IdentityLine icon={Smartphone} label="Mobile number" value={user.phoneNumber || "Mobile number missing"} />
      </div>
      {isComplete ? (
        <p className="mt-6 rounded-2xl bg-[#f8eee1] px-4 py-3 text-xs leading-6 text-[#706054] dark:bg-[#162e27] dark:text-[#aab8b0]">
          Membership activates only after verified payment confirmation.
        </p>
      ) : (
        <div className="mt-6 rounded-2xl bg-[#faeee9] px-4 py-4 text-sm text-[#744234] dark:bg-[#2e211e] dark:text-[#e5c0aa]">
          <p>Add the missing account detail before payment can begin.</p>
          <Link
            href="/user/profile"
            className="mt-3 inline-flex items-center gap-2 font-semibold text-[#b83c2e] dark:text-[#dfb36c]"
          >
            Complete profile
            <ArrowRight className="size-4" />
          </Link>
        </div>
      )}
    </section>
  );
}

function IdentityLine({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#eee1d0] bg-white px-4 py-3.5 dark:border-white/8 dark:bg-[#11251f]">
      <Icon className="size-4 shrink-0 text-[#b83c2e] dark:text-[#dfb36c]" />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#978270] dark:text-[#91a198]">{label}</p>
        <p className="truncate text-sm font-medium text-[#30251e] dark:text-[#eef2ec]">{value}</p>
      </div>
    </div>
  );
}
