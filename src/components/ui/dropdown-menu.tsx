"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { DropdownMenu as MenuPrimitive } from "radix-ui";
import { cn } from "@/lib/cn";

export interface MenuItem {
  label: string;
  onSelect?: () => void;
  /** If set, the item is a link. */
  href?: string;
  destructive?: boolean;
  disabled?: boolean;
}

export type MenuEntry = MenuItem | "separator";

export interface DropdownMenuProps {
  /** The button that opens the menu, e.g. <Button variant="outline">Actions</Button>. */
  trigger: ReactNode;
  items: MenuEntry[];
  align?: "start" | "center" | "end";
  className?: string;
}

const itemStyles =
  "flex min-h-control-sm cursor-default items-center rounded-md px-3 text-sm text-foreground no-underline outline-none data-disabled:cursor-not-allowed data-disabled:opacity-50 data-highlighted:bg-surface-muted";

/** Action menu: full keyboard support (arrows, Enter, Escape, type-ahead). */
export function DropdownMenu({ trigger, items, align = "end", className }: DropdownMenuProps) {
  return (
    <MenuPrimitive.Root>
      <MenuPrimitive.Trigger asChild>{trigger}</MenuPrimitive.Trigger>
      <MenuPrimitive.Portal>
        <MenuPrimitive.Content
          align={align}
          sideOffset={4}
          className={cn(
            "z-(--z-overlay) min-w-48 rounded-md border border-border-strong bg-surface p-1 shadow-md",
            className,
          )}
        >
          {items.map((entry, index) =>
            entry === "separator" ? (
              <MenuPrimitive.Separator key={`sep-${index}`} className="my-1 h-px bg-border" />
            ) : (
              <MenuPrimitive.Item
                key={entry.label}
                asChild={Boolean(entry.href)}
                disabled={entry.disabled}
                onSelect={entry.onSelect}
                className={cn(itemStyles, entry.destructive && "font-medium text-danger")}
              >
                {entry.href ? <Link href={entry.href}>{entry.label}</Link> : entry.label}
              </MenuPrimitive.Item>
            ),
          )}
        </MenuPrimitive.Content>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Root>
  );
}
