"use client";

import { useEffect, useState } from "react";
import { LoadingScreen } from "@/components/ui";
import { SPLASH_MIN_MS } from "@/lib/site";

/** A little longer than the fade itself (--duration-modal, 250ms), so the fade always finishes first. */
const SPLASH_FADE_MS = 300;

/**
 * The screen shown on every full page load or refresh of the public site. It is part of the page's
 * first HTML, so it is there before anything else, and it leaves once the page has finished loading
 * and SPLASH_MIN_MS have passed since the load began, with a short fade. Moving between pages does not bring it back.
 */
export function SiteSplash() {
  // "showing" → "leaving" (a short fade, so the page is revealed rather than swapped in) → "done" (removed).
  const [phase, setPhase] = useState<"showing" | "leaving" | "done">("showing");

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const leave = () => {
      // performance.now() counts from the start of the page load, so this is "at least SPLASH_MIN_MS in total".
      timer = setTimeout(() => setPhase("leaving"), Math.max(0, SPLASH_MIN_MS - performance.now()));
    };
    if (document.readyState === "complete") leave();
    else window.addEventListener("load", leave, { once: true });
    return () => {
      window.removeEventListener("load", leave);
      clearTimeout(timer);
    };
  }, []);

  // Remove the screen once the fade is over (a timer rather than transitionend, which a background tab may never fire).
  useEffect(() => {
    if (phase !== "leaving") return;
    const timer = setTimeout(() => setPhase("done"), SPLASH_FADE_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  if (phase === "done") return null;
  return (
    <>
      <LoadingScreen fullscreen leaving={phase === "leaving"} />
      {/* Without JavaScript nothing could remove the screen, so hide it. */}
      <noscript>
        <style>{"[data-splash]{display:none}"}</style>
      </noscript>
    </>
  );
}
