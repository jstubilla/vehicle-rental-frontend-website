"use client";

import { useEffect, useRef, useState } from "react";
import { renterPhotos } from "@/assets/config";
import { Button, ChevronLeftIcon, ChevronRightIcon, Media } from "@/components/ui";
import { content } from "@/content";

const t = content.home.reviews.photos;
/** The gap between slides, in px (gap-3). */
const GAP = 12;
/** Long enough to take in a group photo before the next one slides in. */
const AUTO_SLIDE_MS = 4000;

/**
 * A small carousel of real renters with their van, closing the column of shorter reviews. One photo at a
 * time in a scroll-snap row with the next one peeking in. It moves on every few seconds until the visitor
 * takes over (swipes, scrolls it, uses the arrow keys or the previous/next buttons); it holds still while
 * hovered or focused, off screen, in a hidden tab, or when reduced motion is on.
 * Phones run it edge to edge so faces stay large enough to read. The photo the visitor moves to is
 * announced to screen readers (not the automatic ones, which would keep interrupting).
 */
export function RenterPhotos() {
  const regionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  // Where the row is heading. Quick repeated presses build on it rather than on the row's position,
  // which lags behind during the smooth scroll; it resyncs once any scroll (a swipe too) comes to rest.
  const targetRef = useRef(0);
  const total = renterPhotos.length;

  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  /** One step: a slide's width plus the gap after it. */
  const step = () => {
    const slide = trackRef.current?.firstElementChild as HTMLElement | null;
    return slide ? slide.offsetWidth + GAP : 1;
  };

  /** Moves to a photo, wrapping around at either end. */
  const scrollToSlide = (next: number) => {
    const track = trackRef.current;
    if (!track) return;
    targetRef.current = (next + total) % total;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({ left: targetRef.current * step(), behavior: smooth ? "smooth" : "auto" });
  };

  // Reduced motion, tab visibility and whether the carousel is on screen.
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => setReducedMotion(motion.matches);
    const onVisibility = () => setTabVisible(document.visibilityState === "visible");
    onMotion();
    onVisibility();
    motion.addEventListener("change", onMotion);
    document.addEventListener("visibilitychange", onVisibility);

    const region = regionRef.current;
    const observer =
      region && "IntersectionObserver" in window
        ? new IntersectionObserver(([entry]) => setOnScreen(Boolean(entry?.isIntersecting)), { threshold: 0.5 })
        : null;
    if (region) observer?.observe(region);

    return () => {
      motion.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", onVisibility);
      observer?.disconnect();
    };
  }, []);

  // Keep the counter current, and stop auto-sliding for good once the visitor moves the row themselves.
  // (Listening for input rather than for scroll events, so the auto-slide's own scrolling never counts.)
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const current = () => Math.min(total - 1, Math.round(track.scrollLeft / step()));
    const onScroll = () => setIndex(current());
    const onScrollEnd = () => {
      targetRef.current = current();
      setIndex(targetRef.current);
    };
    const stop = () => setPlaying(false);
    const onWheel = (e: WheelEvent) => {
      if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) stop();
    };
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown"].includes(e.key)) stop();
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    track.addEventListener("scrollend", onScrollEnd);
    track.addEventListener("pointerdown", stop);
    track.addEventListener("wheel", onWheel, { passive: true });
    track.addEventListener("keydown", onKey);
    return () => {
      track.removeEventListener("scroll", onScroll);
      track.removeEventListener("scrollend", onScrollEnd);
      track.removeEventListener("pointerdown", stop);
      track.removeEventListener("wheel", onWheel);
      track.removeEventListener("keydown", onKey);
    };
  }, [total]);

  const active = playing && !hovered && !focused && onScreen && tabVisible && !reducedMotion;

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => scrollToSlide(targetRef.current + 1), AUTO_SLIDE_MS);
    return () => window.clearInterval(timer);
    // scrollToSlide only reads refs, so the interval never needs rebuilding for it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  /** The previous/next buttons: the visitor has taken over, so auto-sliding stops. */
  const go = (delta: number) => {
    setPlaying(false);
    scrollToSlide(targetRef.current + delta);
  };

  return (
    <section
      ref={regionRef}
      aria-roledescription="carousel"
      aria-label={t.label}
      className="-mx-gutter flex flex-col gap-1 md:mx-0"
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <ul
        ref={trackRef}
        tabIndex={0}
        aria-label={t.label}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-gutter scroll-px-gutter [scrollbar-width:none] md:px-0 md:scroll-px-0 [&::-webkit-scrollbar]:hidden"
      >
        {renterPhotos.map((photo, i) => (
          <li
            key={photo.src}
            role="group"
            aria-roledescription="slide"
            aria-label={t.slide(i + 1, total)}
            className="w-[86%] shrink-0 snap-start"
          >
            <Media asset={photo} className="aspect-[5/2]!" sizes="(min-width: 1024px) 420px, 86vw" />
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-3 px-gutter text-sm md:px-0">
        <p className="min-w-0 text-muted">{t.caption}</p>
        <div className="-mr-2 flex shrink-0 items-center">
          <Button size="icon" variant="ghost" aria-label={t.previous} onClick={() => go(-1)}>
            <ChevronLeftIcon aria-hidden="true" className="size-5" />
          </Button>
          <span aria-hidden="true" className="min-w-10 text-center text-foreground tabular-nums">
            {t.counter(index + 1, total)}
          </span>
          <Button size="icon" variant="ghost" aria-label={t.next} onClick={() => go(1)}>
            <ChevronRightIcon aria-hidden="true" className="size-5" />
          </Button>
        </div>
      </div>
      {/* Announces only while it holds still, so the automatic slides never interrupt a screen reader. */}
      <p aria-live={active ? "off" : "polite"} className="sr-only">
        {t.slide(index + 1, total)}
      </p>
    </section>
  );
}
