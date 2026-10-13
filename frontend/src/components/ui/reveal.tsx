"use client";

import { useEffect, useRef, useState, type ElementType, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Lets a block settle into place the first time it scrolls into view (a short fade and lift; the
 * look lives in globals.css under [data-reveal]). Content that is already on screen when the page
 * opens is never hidden, and without JavaScript nothing is hidden at all. Use sparingly: a few key
 * blocks of a marketing page, never every element.
 */
export function Reveal({
  as: Tag = "div",
  className,
  ...props
}: HTMLAttributes<HTMLElement> & { as?: ElementType }) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<"idle" | "pending" | "shown">("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    // Already visible on arrival: leave it alone.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setState("shown");
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    // Hide only once the observer is watching, so nothing can get stuck hidden.
    setState("pending");
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return <Tag ref={ref} data-reveal={state === "idle" ? undefined : state} className={cn(className)} {...props} />;
}
