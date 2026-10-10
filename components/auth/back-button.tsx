"use client";

import Link from "next/link";

interface BackButtonProps {
  label: string;
  href: string;
}

export const BackButton = ({ label, href }: BackButtonProps) => {
  return (
    <p className="text-center text-sm text-[#6e6053] dark:text-[#aaa192]">
      <Link
        href={href}
        className="font-medium text-primary underline decoration-primary/35 underline-offset-4 transition hover:decoration-primary"
      >
        {label}
      </Link>
    </p>
  );
};
