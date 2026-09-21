"use client";

import { cn } from "@/lib/cn";
import { content } from "@/content";
import { Button } from "./button";

export interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/** Previous / numbered pages / Next. `page` starts at 1. */
export function Pagination({ page, pageCount, onPageChange, className }: PaginationProps) {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  const t = content.ui.pagination;

  return (
    <nav aria-label={t.label} className={cn("flex flex-wrap items-center justify-center gap-1", className)}>
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        {t.previous}
      </Button>
      {pages.map((n) => (
        <Button
          key={n}
          variant={n === page ? "primary" : "ghost"}
          size="sm"
          aria-current={n === page ? "page" : undefined}
          aria-label={`${t.page} ${n}`}
          onClick={() => onPageChange(n)}
        >
          {n}
        </Button>
      ))}
      <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
        {t.next}
      </Button>
    </nav>
  );
}
