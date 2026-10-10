"use client";

import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";

import { Button } from "@/components/ui/button";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

type SocialProps = {
  callbackUrl?: string | null;
};

export const Social = ({ callbackUrl }: SocialProps) => {
  const onClick = () => {
    signIn("google", {
      callbackUrl: callbackUrl || DEFAULT_LOGIN_REDIRECT,
    });
  };
  return (
    <div className="w-full">
      <div className="mb-5 flex items-center gap-4">
        <span className="h-px flex-1 bg-[#ecdfcf] dark:bg-white/10" />
        <p className="text-xs font-medium text-[#8a796a] dark:text-[#9e9484]">or continue with</p>
        <span className="h-px flex-1 bg-[#ecdfcf] dark:bg-white/10" />
      </div>
      <Button
        type="button"
        variant="outline"
        className="h-12 w-full rounded-xl border-[#e3d4c2] bg-white font-medium text-[#35271c] hover:bg-[#fffaf2] dark:border-white/12 dark:bg-white/[0.04] dark:text-[#f4f1ea] dark:hover:bg-white/[0.08]"
        onClick={onClick}
      >
        <FcGoogle className="mr-2 size-5" />
        Continue with Google
      </Button>
    </div>
  );
};
