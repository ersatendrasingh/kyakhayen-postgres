"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

interface LogoutButtonProps {
  children?: React.ReactNode;
  callbackUrl?: string;
}

export const LogoutButton = ({ children, callbackUrl }: LogoutButtonProps) => {
  const router = useRouter();
  const onClick = async () => {
    const encodedCallbackUrl = encodeURIComponent(callbackUrl || "");
    const redirectTo = "/auth/login?callbackUrl=" + encodedCallbackUrl;

    await signOut({ redirect: false, redirectTo });
    router.replace(redirectTo);
    router.refresh();
  };

  return (
    <div onClick={onClick} className="w-full cursor-pointer">
      {children}
    </div>
  );
};
