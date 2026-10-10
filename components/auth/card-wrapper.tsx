import Image from "next/image";
import Logo from "@/components/logo";
import { AuthHeader } from "@/components/auth/auth-header";
import { Social } from "@/components/auth/social";
import { BackButton } from "@/components/auth/back-button";

interface CardWrapperProps {
  children: React.ReactNode;
  headerLabel: string;
  description?: string;
  backButtonLabel: string;
  backButtonHref: string;
  showSocial?: boolean;
  compact?: boolean;
  visualImage?: string;
  visualAlt?: string;
  visualPosition?: string;
  visualHeadline?: string;
  callbackUrl?: string | null;
}

export const CardWrapper = ({
  children,
  headerLabel,
  description,
  backButtonLabel,
  backButtonHref,
  showSocial,
  compact = false,
  visualImage = "/assets/images/auth-kitchen-hero.webp",
  visualAlt = "Woman preparing fresh ingredients in her kitchen",
  visualPosition = "object-[68%_center]",
  visualHeadline = "Fresh meals begin with one good idea.",
  callbackUrl,
}: CardWrapperProps) => {
  if (compact) {
    return (
      <div className="w-full rounded-2xl bg-white p-1 dark:bg-[#101916]">
        <div className="mb-6 flex justify-center">
          <div className="rounded-2xl border border-[#ebddca] bg-[#fffaf2] px-5 py-2 shadow-sm dark:border-white/12 dark:bg-white/[0.04]">
            <Logo compact />
          </div>
        </div>
        <AuthHeader label={headerLabel} description={description} compact />
        <div className="mt-6 [&_input]:h-11 [&_input]:rounded-xl [&_button[type=submit]]:h-11 [&_button[type=submit]]:rounded-xl">
          {children}
        </div>
        {showSocial && <Social callbackUrl={callbackUrl} />}
        <BackButton label={backButtonLabel} href={backButtonHref} />
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-[1140px] overflow-hidden rounded-[1.8rem] border border-[#eadbc8] bg-[#fffdf9] shadow-[0_30px_75px_-38px_rgba(67,41,17,0.3)] dark:border-white/12 dark:bg-[#101916] dark:shadow-[0_34px_90px_-34px_rgba(0,0,0,0.68)] lg:h-[min(760px,calc(100dvh-4rem))] lg:grid-cols-[0.9fr_1.1fr]">
      <section className="flex min-h-0 flex-col bg-[#fffdf9] px-6 py-7 dark:bg-[#101916] sm:px-10 sm:py-9 lg:overflow-y-auto lg:px-12">
        <div className="flex flex-col justify-center py-3 sm:py-5 lg:flex-1">
          <div className="mb-7 flex justify-center">
            <div className="rounded-2xl border border-[#eadbc7] bg-white px-7 py-3 shadow-[0_12px_30px_-18px_rgba(67,41,17,0.35)] dark:border-white/12 dark:bg-[#faf7f0]">
              <Logo />
            </div>
          </div>
          <AuthHeader label={headerLabel} description={description} />
          <div className="mt-6 [&_input]:h-12 [&_input]:rounded-xl [&_input]:border-[#e3d4c2] [&_input]:bg-white [&_input]:px-4 [&_label]:text-sm [&_label]:font-medium [&_label]:text-[#35271c] dark:[&_input]:border-white/12 dark:[&_input]:bg-white/[0.04] dark:[&_input]:text-[#f4f1ea] dark:[&_label]:text-[#efe8de] [&_button[type=submit]]:h-12 [&_button[type=submit]]:rounded-xl [&_button[type=submit]]:text-sm [&_button[type=submit]]:font-semibold">
            {children}
          </div>
          {showSocial && (
            <div className="mt-6">
              <Social callbackUrl={callbackUrl} />
            </div>
          )}
          <div className="mt-6">
            <BackButton label={backButtonLabel} href={backButtonHref} />
          </div>
        </div>
      </section>
      <aside className="relative hidden min-h-full lg:block">
        <Image
          src={visualImage}
          alt={visualAlt}
          fill
          priority
          className={`object-cover ${visualPosition}`}
          sizes="(min-width: 1024px) 55vw, 0px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#281911]/35 via-transparent to-white/10 dark:from-[#140d09]/52 dark:to-transparent" />
        <div className="absolute left-7 top-7 rounded-full border border-white/65 bg-white/88 px-4 py-2 text-xs font-medium text-[#553723] shadow-sm backdrop-blur-md dark:border-white/20 dark:bg-[#1e1510]/76 dark:text-white">
          Fresh ideas for your table
        </div>
        <div className="absolute inset-x-0 bottom-0 p-9">
          <div className="rounded-[1.4rem] border border-white/70 bg-white/[0.94] p-6 text-[#271c14] shadow-[0_18px_48px_-22px_rgba(45,24,10,0.4)] backdrop-blur-md dark:border-white/15 dark:bg-[#17120f]/88 dark:text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-primary dark:text-[#f2bd78]">
              Kya Khayen?
            </p>
            <h2 className="mt-3 max-w-md text-[2rem] font-semibold leading-tight tracking-tight">
              {visualHeadline}
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-[#645343] dark:text-white/84">
              Discover recipes, save favourites and build your weekly food
              plan in one place.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
};
