"use client";

import { CalendarDays, CheckCircle2, Sparkles } from "lucide-react";

interface SubscriptionCardProps {
  subscription: string;
  planStartDate: Date;
  planEndDate: Date;
}

const SubscriptionCard = ({ subscription, planStartDate, planEndDate }: SubscriptionCardProps) => {
  const endDate = planEndDate ? new Date(planEndDate) : null;
  const active = endDate ? endDate >= new Date() : true;
  const formatDate = (value: Date) =>
    new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <section className="rounded-[1.8rem] border border-[#eadcc9] bg-[#fffdf8] p-5 dark:border-white/10 dark:bg-[#10231c] sm:p-7">
      <div className="flex flex-col gap-5 border-b border-[#eee1d0] pb-6 dark:border-white/10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#aa7951] dark:text-[#d2ae76]">Current access</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#31231b] dark:text-[#f2ede6]">{subscription}</h2>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-[#ecf5ee] px-4 py-2 text-sm font-semibold text-[#276540] dark:bg-[#18362b] dark:text-[#a3dbb3]">
          <CheckCircle2 className="size-4" /> {active ? "Active" : "Completed"}
        </span>
      </div>
      <div className="grid gap-4 py-6 sm:grid-cols-2">
        <PlanDate label="Started" date={formatDate(planStartDate)} />
        <PlanDate label="Access through" date={endDate ? formatDate(endDate) : "Launch period"} />
      </div>
      <div className="flex items-start gap-3 rounded-2xl bg-[#faf1e5] p-4 dark:bg-[#172d25]">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-[#bd382a] dark:text-[#ddb271]" />
        <p className="text-sm leading-6 text-[#6f5d50] dark:text-[#abbab2]">
          Your active access supports everyday taste-based meal planning. It
          does not provide medical or allergy-safety advice.
        </p>
      </div>
    </section>
  );
};

const PlanDate = ({ label, date }: { label: string; date: string }) => (
  <div className="flex items-center gap-3 rounded-2xl border border-[#efe2d1] p-4 dark:border-white/[0.08]">
    <CalendarDays className="size-5 text-[#bc392a] dark:text-[#dcb372]" />
    <div>
      <p className="text-xs text-[#877364] dark:text-[#a9b8af]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#36281f] dark:text-[#f1ece5]">{date}</p>
    </div>
  </div>
);

export default SubscriptionCard;
