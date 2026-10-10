"use client";

import dynamic from "next/dynamic";

const MembershipPromptModal = dynamic(
  () => import("@/components/sections/membership-prompt-modal"),
  { ssr: false },
);

export default function LazyMembershipPromptModal() {
  return <MembershipPromptModal />;
}
