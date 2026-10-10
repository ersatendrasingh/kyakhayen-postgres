"use client";

import { Copy, Mail, Share2 } from "lucide-react";
import { FaFacebookF, FaLinkedinIn, FaWhatsapp } from "react-icons/fa6";
import { toast } from "sonner";

type ArticleSharingProps = {
  url: string;
  title: string;
  description: string;
};

export default function ArticleSharing({
  url,
  title,
  description,
}: ArticleSharingProps) {
  const message = `${title}\n${description}\n${url}`;
  const shareLinks = [
    {
      label: "WhatsApp",
      icon: FaWhatsapp,
      href: `https://wa.me/?text=${encodeURIComponent(message)}`,
    },
    {
      label: "Facebook",
      icon: FaFacebookF,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      label: "LinkedIn",
      icon: FaLinkedinIn,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Article link copied.");
    } catch {
      toast.error("Could not copy this link.");
    }
  };

  const share = async () => {
    if (!navigator.share) {
      await copyLink();
      return;
    }

    try {
      await navigator.share({ title, text: description, url });
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        toast.error("Could not share this article right now.");
      }
    }
  };

  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {shareLinks.map(({ label, icon: Icon, href }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${label}`}
          className="inline-flex h-8 items-center gap-2 rounded-full border border-[#e5d4bb] bg-[#fffaf0] px-3 text-xs font-semibold text-[#49392e] transition hover:border-[#d5b475] hover:bg-white dark:border-white/10 dark:bg-[#173128] dark:text-[#eaf0ea]"
        >
          <Icon className="size-3.5 text-[#a77838] dark:text-[#dfb36c]" />
          {label}
        </a>
      ))}
      <a
        href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(message)}`}
        className="inline-flex h-8 items-center gap-2 rounded-full border border-[#e5d4bb] px-3 text-xs font-semibold text-[#49392e] dark:border-white/10 dark:text-[#eaf0ea]"
      >
        <Mail className="size-3.5" /> Email
      </a>
      <button
        type="button"
        onClick={() => void share()}
        className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-full border border-[#e5d4bb] px-3 text-xs font-semibold text-[#49392e] dark:border-white/10 dark:text-[#eaf0ea]"
      >
        <Share2 className="size-3.5" /> Share
      </button>
      <button
        type="button"
        onClick={() => void copyLink()}
        className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-full border border-[#e5d4bb] px-3 text-xs font-semibold text-[#49392e] dark:border-white/10 dark:text-[#eaf0ea]"
      >
        <Copy className="size-3.5" /> Copy link
      </button>
    </div>
  );
}
