"use client";

import Link from "next/link";
import { CalendarDays, Mail, Phone, SlidersHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/use-current-user";
import AccountPageHeading from "../_components/account-page-heading";
import BannerCard from "../_components/banner-card";

const UserProfilePage = () => {
  const user = useCurrentUser();

  const formatDate = (value?: Date | string | null) =>
    value
      ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
      : "Not available";

  return (
    <div>
      <AccountPageHeading
        eyebrow="Profile"
        title="Your account"
        description="Keep your contact details current and manage the everyday food choices that shape your plan."
      />
      <BannerCard />

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_330px]">
        <section className="rounded-[1.7rem] border border-[#eadcc9] bg-[#fffdf8] p-5 dark:border-white/10 dark:bg-[#10231c] sm:p-6">
          <h2 className="mb-5 text-lg font-semibold text-[#30241c] dark:text-[#f1ede6]">Account details</h2>
          {!user ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-20 rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <ProfileDetail icon={Mail} label="Email address" value={user.email || "No email saved"} />
              <ProfileDetail icon={Phone} label="Phone number" value={user.phoneNumber || "Not added yet"} />
              <ProfileDetail icon={CalendarDays} label="Member since" value={formatDate(user.createdAt)} />
              <ProfileDetail icon={CalendarDays} label="Last updated" value={formatDate(user.updateAt)} />
            </div>
          )}
        </section>

        <aside className="rounded-[1.7rem] bg-[#32251d] p-6 text-white dark:bg-[#152c24]">
          <SlidersHorizontal className="mb-5 size-6 text-[#e7b870]" />
          <h2 className="text-lg font-semibold">Food choices</h2>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Your meal plan uses taste and cooking preferences only, never medical profiling.
          </p>
          <Link href="/user/preferences" className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#34251c]">
            View choices
          </Link>
        </aside>
      </div>
    </div>
  );
};

interface ProfileDetailProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

const ProfileDetail = ({ icon: Icon, label, value }: ProfileDetailProps) => (
  <div className="rounded-2xl bg-[#faf3e9] p-4 dark:bg-[#172d25]">
    <div className="mb-3 flex items-center gap-2 text-xs font-medium text-[#95765d] dark:text-[#c5ac7b]">
      <Icon className="size-3.5" />
      {label}
    </div>
    <p className="break-words text-sm font-semibold text-[#382a21] dark:text-[#f1ece4]">{value}</p>
  </div>
);

export default UserProfilePage;
