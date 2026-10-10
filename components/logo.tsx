"use client";

import Image from "next/image";
import Link from "next/link";

const Logo = ({ compact = false }: { compact?: boolean }) => {
  return (
    <Link href="/" className="flex items-center justify-start">
      <div
        className={
          compact
            ? "relative h-[38px] w-[122px]"
            : "relative h-[44px] w-[146px] sm:h-[48px] sm:w-[156px] md:h-[50px] md:w-[162px]"
        }
      >
        <Image
          alt="logo"
          src="/assets/images/kyakhayen-logo.png"
          //src="/assets/images/logo.png"
          priority
          fill
          sizes={compact ? "122px" : "(max-width: 640px) 146px, 162px"}
        />
      </div>
    </Link>
  );
};

export default Logo;
