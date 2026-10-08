"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLink, Price } from "@/components/ui";
import { content } from "@/content";

const AUTO_SLIDE_MS = 2500;
const PAGE_HREF = "/special-offers";

/** Every transfer route and tour package, read from the same lists the Tours & Transfers page shows. */
const offers = content.specialOffers.priceLists.flatMap((list) =>
  list.items.map((item) => ({ ...item, listId: list.id, capacity: list.capacity })),
);

/**
 * The home hero's teaser of transfers and tours, set as type in the slot opposite the headline (no card:
 * the booking bar stays the hero's one raised object). One offer at a time slides past in a scroll-snap
 * row; each is a link to its list on the Tours & Transfers page. It moves on every few seconds until the
 * visitor takes over (swipes or scrolls it); it holds still while hovered or focused, off screen, in a
 * hidden tab, or when reduced motion is on. Moving it never moves focus.
 */
export function ToursCarousel() {
  const t = content.home.toursTransfers;
  const scrollerRef = useRef<HTMLUListElement>(null);
  const regionRef = useRef<HTMLElement>(null);

  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [index, setIndex] = useState(0);

  /** The slide nearest the row's left edge (every slide is the row's full width). */
  const currentIndex = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !scroller.clientWidth) return 0;
    return Math.round(scroller.scrollLeft / scroller.clientWidth);
  }, []);

  // Reduced motion, tab visibility and whether the teaser is on screen.
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

  // Keep the counter current, and stop auto-sliding for good once the visitor moves the row themselves:
  // a swipe or drag, a sideways wheel or trackpad scroll, or the arrow keys inside it.
  // (Listening for input rather than for scroll events, so the auto-slide's own scrolling never counts.)
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const onScroll = () => setIndex(currentIndex());
    const stop = () => setPlaying(false);
    const onWheel = (e: WheelEvent) => {
      if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) stop();
    };
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown"].includes(e.key)) stop();
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    scroller.addEventListener("pointerdown", stop);
    scroller.addEventListener("wheel", onWheel, { passive: true });
    scroller.addEventListener("keydown", onKey);
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      scroller.removeEventListener("pointerdown", stop);
      scroller.removeEventListener("wheel", onWheel);
      scroller.removeEventListener("keydown", onKey);
    };
  }, [currentIndex]);

  const active = playing && !hovered && !focused && onScreen && tabVisible && !reducedMotion;

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      const next = (currentIndex() + 1) % offers.length;
      scroller.scrollTo({ left: next * scroller.clientWidth, behavior: "smooth" });
    }, AUTO_SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [active, currentIndex]);

  return (
    <section
      ref={regionRef}
      aria-roledescription="carousel"
      aria-labelledby="hero-tours-heading"
      className="flex flex-col gap-2"
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <h2 id="hero-tours-heading" className="font-body text-sm font-semibold tracking-normal text-muted">
          {t.title}
        </h2>
        <span aria-hidden="true" className="text-muted tabular-nums">
          {t.counter(index + 1, offers.length)}
        </span>
      </div>

      {/*
        Full-width slides. The small inset keeps each link's focus ring inside the scroll box, and the gap
        equals the inset on both sides, so one slide step is exactly the box's width and no neighbour shows.
      */}
      <ul
        ref={scrollerRef}
        className="-mx-1 flex gap-2 snap-x snap-mandatory overflow-x-auto overscroll-x-contain px-1 py-1 scroll-px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {offers.map((offer, i) => (
          <li
            key={offer.name}
            role="group"
            aria-roledescription="slide"
            aria-label={t.slide(i + 1, offers.length)}
            className="w-full shrink-0 snap-start"
          >
            <Link
              href={`${PAGE_HREF}#${offer.listId}`}
              className="group flex flex-col gap-1 rounded-sm text-inherit no-underline"
            >
              <span className="font-heading text-xl font-semibold tracking-tight text-foreground underline-offset-4 group-hover:underline lg:text-2xl">
                {offer.name}
              </span>
              <span className="flex flex-wrap items-baseline gap-x-2 text-sm text-muted">
                {offer.capacity}
                <span aria-hidden="true">·</span>
                <Price amount={offer.price} size="sm" usd="inline" />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <ArrowLink href={PAGE_HREF} className="self-start text-sm whitespace-nowrap">
        {t.viewAll}
      </ArrowLink>
    </section>
  );
}
