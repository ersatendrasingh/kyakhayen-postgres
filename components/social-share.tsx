"use client";

import { useState } from "react";
import { Copy, Download, Mail, Printer, Share2 } from "lucide-react";
import {
  FaFacebookF,
  FaLinkedinIn,
  FaWhatsapp,
  FaXTwitter,
} from "react-icons/fa6";
import { toast } from "sonner";

import {
  generateRecipePdf,
  type RecipePdfData,
} from "@/lib/generate-recipe-pdf";

const SocialShare = ({
  url,
  title,
  description,
  overview,
  imageUrl,
  ingredients = [],
  steps = [],
  totalMinutes,
  prepMinutes,
  cookMinutes,
  restMinutes,
  category,
  cuisine,
  difficulty,
  tags,
  nutrition,
}: RecipePdfData) => {
  const [pdfAction, setPdfAction] = useState<"print" | "download" | null>(null);
  const shareMessage = `${title}\n${description}\n${url}`;
  const socialLinks = [
    {
      label: "WhatsApp",
      icon: FaWhatsapp,
      href: `https://wa.me/?text=${encodeURIComponent(shareMessage)}`,
    },
    {
      label: "Facebook",
      icon: FaFacebookF,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      label: "X",
      icon: FaXTwitter,
      href: `https://x.com/intent/post?text=${encodeURIComponent(`${title} - ${description}`)}&url=${encodeURIComponent(url)}`,
    },
    {
      label: "LinkedIn",
      icon: FaLinkedinIn,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Recipe link copied.");
    } catch {
      toast.error("Could not copy the recipe link.");
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      await handleCopy();
      return;
    }

    try {
      await navigator.share({ title, text: description, url });
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        toast.error("Could not open sharing right now.");
      }
    }
  };

  const handlePdfAction = async (mode: "print" | "download") => {
    try {
      setPdfAction(mode);
      await generateRecipePdf(
        {
          url,
          title,
          description,
          overview,
          imageUrl,
          ingredients,
          steps,
          totalMinutes,
          prepMinutes,
          cookMinutes,
          restMinutes,
          category,
          cuisine,
          difficulty,
          tags,
          nutrition,
        },
        mode,
      );
      if (mode === "download") {
        toast.success("Recipe PDF downloaded.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not create the recipe PDF.",
      );
    } finally {
      setPdfAction(null);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {socialLinks.map((social) => {
          const Icon = social.icon;
          return (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Share on ${social.label}`}
              className="flex h-11 items-center gap-2 rounded-xl border border-[#eadbc5] bg-[#fffaf0] px-3 text-xs font-semibold text-[#43362d] transition hover:-translate-y-0.5 hover:border-[#d7b879] hover:bg-white dark:border-white/10 dark:bg-[#173128] dark:text-[#edf2ec] dark:hover:border-[#c59855]/55"
            >
              <span className="inline-flex size-7 items-center justify-center rounded-full bg-[#f0dfbd] text-[#7e5428] dark:bg-[#254138] dark:text-[#e4c078]">
                <Icon className="size-3.5" />
              </span>
              {social.label}
            </a>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <button
          id="recipe-share-toggle"
          type="button"
          onClick={handleNativeShare}
          className="inline-flex h-8 min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[#e8dac5] px-2 text-[11px] font-medium text-[#55483d] transition hover:border-[#d1b274] hover:bg-[#fffaf1] dark:border-white/10 dark:text-[#d4ded8] dark:hover:bg-[#173128] lg:text-xs"
        >
          <Share2 className="size-3.5" />
          Share
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex h-8 min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[#e8dac5] px-2 text-[11px] font-medium text-[#55483d] transition hover:border-[#d1b274] hover:bg-[#fffaf1] dark:border-white/10 dark:text-[#d4ded8] dark:hover:bg-[#173128] lg:text-xs"
        >
          <Copy className="size-3.5" />
          Copy link
        </button>
        <a
          href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareMessage)}`}
          className="inline-flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-full border border-[#e8dac5] px-2 text-[11px] font-medium text-[#55483d] transition hover:border-[#d1b274] hover:bg-[#fffaf1] dark:border-white/10 dark:text-[#d4ded8] dark:hover:bg-[#173128] lg:text-xs"
        >
          <Mail className="size-3.5" />
          Email
        </a>
        <button
          id="recipe-print-toggle"
          type="button"
          onClick={() => void handlePdfAction("print")}
          disabled={pdfAction !== null}
          className="inline-flex h-8 min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[#e8dac5] px-2 text-[11px] font-medium text-[#55483d] transition hover:border-[#d1b274] hover:bg-[#fffaf1] dark:border-white/10 dark:text-[#d4ded8] dark:hover:bg-[#173128] lg:text-xs"
        >
          <Printer className="size-3.5" />
          {pdfAction === "print" ? "Preparing..." : "Print"}
        </button>
        <button
          type="button"
          onClick={() => void handlePdfAction("download")}
          disabled={pdfAction !== null}
          className="inline-flex h-8 min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[#e8dac5] px-2 text-[11px] font-medium text-[#55483d] transition hover:border-[#d1b274] hover:bg-[#fffaf1] dark:border-white/10 dark:text-[#d4ded8] dark:hover:bg-[#173128] lg:text-xs"
        >
          <Download className="size-3.5" />
          {pdfAction === "download" ? "Preparing..." : "Download"}
        </button>
      </div>

      <p className="text-xs leading-5 text-[#8c7968] dark:text-[#94a69d]">
        Shared links include the recipe cover and description preview.
      </p>
    </div>
  );
};

export default SocialShare;
