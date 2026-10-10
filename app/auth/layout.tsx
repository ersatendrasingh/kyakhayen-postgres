import type { Metadata } from "next";

import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    default: "Account Access | Kya Khayen",
    template: "%s | Kya Khayen",
  },
  robots: noIndexRobots(),
};

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#fbf7f1] px-3 py-4 dark:bg-[#081411] sm:p-6 lg:h-dvh lg:overflow-hidden lg:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(213,167,101,0.22),transparent_30%),radial-gradient(circle_at_84%_88%,rgba(184,51,36,0.12),transparent_32%),linear-gradient(135deg,#fffdf9_0%,#f8f0e5_52%,#fbf4ec_100%)] dark:bg-[radial-gradient(circle_at_76%_14%,rgba(184,51,36,0.2),transparent_32%),radial-gradient(circle_at_14%_86%,rgba(207,147,66,0.14),transparent_28%),linear-gradient(135deg,#081411_0%,#101916_52%,#17130f_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-55 [background-image:linear-gradient(rgba(115,84,53,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(115,84,53,0.06)_1px,transparent_1px)] [background-size:76px_76px] dark:opacity-35 dark:[background-image:linear-gradient(rgba(229,197,145,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(229,197,145,0.1)_1px,transparent_1px)]" />
      <div className="pointer-events-none absolute left-[8%] top-[12%] size-36 rounded-full border border-[#ddb985]/28 dark:border-[#d9ad71]/12 sm:size-56" />
      <div className="pointer-events-none absolute left-[12%] top-[18%] size-24 rounded-full border border-[#ddb985]/20 dark:border-[#d9ad71]/10 sm:size-40" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[60%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ecd4b1]/26 blur-[100px] dark:bg-primary/8" />
      <div className="relative flex min-h-[calc(100dvh-2rem)] items-center justify-center sm:min-h-[calc(100dvh-3rem)] lg:h-full lg:min-h-0">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
