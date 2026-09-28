"use client";

import { useEffect, useState } from "react";
import { LoadingScreen } from "@/components/ui";
import { SPLASH_MIN_MS } from "@/lib/site";

/**
 * The screen shown on every full page load or refresh of the public site. It is part of the page's
 * first HTML, so it is there before anything else, and it leaves once the page has finished loading
 * and SPLASH_MIN_MS have passed since the load began. Moving between pages does not bring it back.
 */
export function SiteSplash() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const leave = () => {
      // performance.now() counts from the start of the page load, so this is "at least SPLASH_MIN_MS in total".
      timer = setTimeout(() => setDone(true), Math.max(0, SPLASH_MIN_MS - performance.now()));
    };
    if (document.readyState === "complete") leave();
    else window.addEventListener("load", leave, { once: true });
    return () => {
      window.removeEventListener("load", leave);
      clearTimeout(timer);
    };
  }, []);

  if (done) return null;
  return (
    <>
      <LoadingScreen fullscreen />
      {/* Without JavaScript nothing could remove the screen, so hide it. */}
      <noscript>
        <style>{"[data-splash]{display:none}"}</style>
      </noscript>
    </>
  );
}
