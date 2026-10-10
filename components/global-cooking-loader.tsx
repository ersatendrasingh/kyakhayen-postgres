"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const navigationTargets = "a[href], button[type=submit], [data-global-loading]";

/** A lightweight navigation overlay that gives slow server transitions an
 * immediate, friendly visual response without blocking the page on startup. */
export function GlobalCookingLoader() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const lastPathname = useRef(pathname);

  useEffect(() => {
    if (lastPathname.current !== pathname) {
      lastPathname.current = pathname;
      setIsLoading(false);
    }
  }, [pathname]);

  useEffect(() => {
    const start = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const element = target?.closest(navigationTargets) as HTMLElement | null;
      if (!element || event.defaultPrevented) return;

      const link = element instanceof HTMLAnchorElement ? element : null;
      if (
        link &&
        (link.target === "_blank" ||
          link.hasAttribute("download") ||
          link.href.startsWith("mailto:") ||
          link.href.startsWith("tel:") ||
          new URL(link.href, window.location.href).origin !== window.location.origin ||
          new URL(link.href, window.location.href).pathname === window.location.pathname &&
            new URL(link.href, window.location.href).search === window.location.search)
      ) {
        return;
      }
      setIsLoading(true);
    };

    const stop = () => setIsLoading(false);
    document.addEventListener("click", start, true);
    document.addEventListener("submit", start, true);
    window.addEventListener("pageshow", stop);
    window.addEventListener("popstate", stop);
    return () => {
      document.removeEventListener("click", start, true);
      document.removeEventListener("submit", start, true);
      window.removeEventListener("pageshow", stop);
      window.removeEventListener("popstate", stop);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div className="global-cooking-loader" role="status" aria-live="polite" aria-label="Loading">
      <div className="global-cooking-loader__backdrop" />
      <div className="global-cooking-loader__card">
        <div className="global-cooking-loader__scene" aria-hidden="true">
          <span className="global-cooking-loader__steam global-cooking-loader__steam--one" />
          <span className="global-cooking-loader__steam global-cooking-loader__steam--two" />
          <span className="global-cooking-loader__steam global-cooking-loader__steam--three" />
          <span className="global-cooking-loader__pan" />
          <span className="global-cooking-loader__handle" />
          <span className="global-cooking-loader__food global-cooking-loader__food--one" />
          <span className="global-cooking-loader__food global-cooking-loader__food--two" />
          <span className="global-cooking-loader__food global-cooking-loader__food--three" />
        </div>
        <p className="global-cooking-loader__eyebrow">Kya Khayen?</p>
        <p className="global-cooking-loader__message">Setting the table for you<span className="global-cooking-loader__dots">...</span></p>
        <div className="global-cooking-loader__progress" aria-hidden="true"><span /></div>
      </div>
    </div>
  );
}
