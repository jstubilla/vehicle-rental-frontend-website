"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Animates its own height whenever its content grows or shrinks (for example a total appearing in a
 * summary), instead of the layout jumping. The content is measured, so nothing needs a fixed height.
 */
export function AutoHeight({ children, className }: { children: ReactNode; className?: string }) {
  const inner = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setHeight(el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={cn("overflow-hidden transition-[height] duration-(--duration-base) ease-out-strong", className)}
      style={{ height }}
    >
      <div ref={inner}>{children}</div>
    </div>
  );
}
