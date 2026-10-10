"use client";
import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const toggleVisibility = () => {
      const scrollPosition = window.scrollY;
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress =
        maxScroll > 0 ? Math.min((scrollPosition / maxScroll) * 100, 100) : 0;
      setScrollProgress(progress);
      setIsVisible(scrollPosition > 500);
    };

    toggleVisibility();
    window.addEventListener("scroll", toggleVisibility, { passive: true });

    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) return null;

  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={scrollToTop}
      className="scroll-progress-control group fixed bottom-[4.55rem] right-3 z-[55] flex size-[48px] cursor-pointer items-center justify-center rounded-full bg-[#fffdf8] shadow-[0_14px_30px_-14px_rgba(45,29,18,0.58)] transition hover:-translate-y-0.5 md:bottom-5 md:right-5"
    >
      <svg
        viewBox="0 0 48 48"
        aria-hidden="true"
        className="absolute inset-0 size-full -rotate-90"
      >
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke="#eddfcc"
          strokeWidth="2.5"
        />
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke="#c73a27"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeOffset}
          className="scroll-progress-ring transition-[stroke-dashoffset] duration-150"
        />
      </svg>
      <span className="scroll-progress-core flex size-9 items-center justify-center rounded-full bg-white text-[#44362c] transition group-hover:text-primary">
        <ChevronUp className="size-4" />
      </span>
    </button>
  );
};

export default ScrollToTopButton;
