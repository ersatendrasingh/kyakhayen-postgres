"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Loader2, Settings, Sparkles } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { capitalizeName } from "@/lib/formateName";
import UploadProfilePic from "./upload-profile-pic";

const BannerCard = () => {
  const user = useCurrentUser();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const imageUrl = imagePreview || user?.image || "/assets/images/profile.png";
  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "";

  return (
    <section className="relative overflow-hidden rounded-[1.8rem] border border-[#ead9c3] bg-[#fffdf8] p-5 dark:border-white/10 dark:bg-[#10231c] sm:p-7">
      <div className="pointer-events-none absolute right-0 top-0 h-full w-[46%] bg-[radial-gradient(circle_at_72%_20%,rgba(195,57,42,0.14),transparent_42%),linear-gradient(135deg,transparent,#f6ebda)] dark:bg-[radial-gradient(circle_at_72%_20%,rgba(210,160,75,0.12),transparent_42%),linear-gradient(135deg,transparent,#172d26)]" />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative mx-auto sm:mx-0">
            <div className="relative size-28 overflow-hidden rounded-[1.7rem] border-4 border-[#f6e7d3] bg-[#f5eada] shadow-sm dark:border-[#284338] dark:bg-[#182d25]">
              <Image src={imageUrl} alt={user?.name ?? "Profile photo"} fill className="object-cover" sizes="112px" />
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/65 dark:bg-[#0d1713]/60">
                  <Loader2 className="size-5 animate-spin text-[#b73527]" />
                </div>
              )}
            </div>
            <UploadProfilePic setImagePreview={setImagePreview} setIsUploading={setIsUploading} />
          </div>
          <div className="text-center sm:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#faede3] px-3 py-1 text-xs font-semibold text-[#b73527] dark:bg-[#1d392f] dark:text-[#e1b571]">
              <Sparkles className="size-3.5" />
              {user?.isPersonalised ? "Meal choices ready" : "Choices not set"}
            </span>
            <h2 className="mt-3 text-2xl font-semibold text-[#2f231b] dark:text-[#f3eee7]">
              {user?.name ? capitalizeName(user.name) : "Your profile"}
            </h2>
            <p className="mt-1 text-sm text-[#75665b] dark:text-[#acbcb3]">{user?.email ?? "Loading account details..."}</p>
            {joinedDate && (
              <p className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-[#887464] dark:text-[#a8b8af]">
                <CalendarDays className="size-3.5" /> Joined {joinedDate}
              </p>
            )}
          </div>
        </div>
        <Link
          href="/user/settings"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-[#ddc7aa] bg-white/80 px-5 py-3 text-sm font-semibold text-[#4c3a2d] transition hover:bg-[#fff5e7] dark:border-white/12 dark:bg-white/[0.04] dark:text-[#ede7de] dark:hover:bg-white/[0.08]"
        >
          <Settings className="size-4" />
          Edit account
        </Link>
      </div>
    </section>
  );
};

export default BannerCard;
