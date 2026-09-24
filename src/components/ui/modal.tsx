"use client";

import { useRef, type ReactNode } from "react";
import { Dialog } from "radix-ui";
import { cn } from "@/lib/cn";
import { content } from "@/content";
import { Button } from "./button";
import { CloseIcon } from "./icons";

export type ModalSize = "sm" | "md" | "lg";
export type ModalVariant = "default" | "danger";

const sizes: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

const variants: Record<ModalVariant, string> = {
  default: "border-border-strong",
  danger: "border-danger border-2",
};

export interface ModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Optional element that opens the modal when clicked. */
  trigger?: ReactNode;
  title: string;
  description?: string;
  children?: ReactNode;
  /** Buttons shown at the bottom. */
  footer?: ReactNode;
  size?: ModalSize;
  variant?: ModalVariant;
  className?: string;
}

/** Accessible dialog: traps focus, closes on Escape, restores focus on close. */
export function Modal({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  footer,
  size = "md",
  variant = "default",
  className,
}: ModalProps) {
  // Whatever had keyboard focus when the dialog opened, so focus can go back there when it closes.
  const openerRef = useRef<HTMLElement | null>(null);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-(--z-overlay) grid place-items-center overflow-y-auto bg-overlay p-gutter">
          <Dialog.Content
            data-surface="card"
            onOpenAutoFocus={() => {
              openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            }}
            onCloseAutoFocus={(event) => {
              // With a `trigger`, Radix returns focus to it. Dialogs opened from state have no trigger, so do it here.
              if (trigger) return;
              event.preventDefault();
              if (openerRef.current?.isConnected) openerRef.current.focus();
            }}
            {...(description ? {} : { "aria-describedby": undefined })}
            className={cn(
              "relative w-full rounded-lg border bg-card p-4 text-foreground shadow-lg md:p-6",
              sizes[size],
              variants[variant],
              className,
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <Dialog.Title className="text-xl font-semibold">{title}</Dialog.Title>
                {description ? (
                  <Dialog.Description className="text-sm text-muted">
                    {description}
                  </Dialog.Description>
                ) : null}
              </div>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" aria-label={content.ui.close}>
                  <CloseIcon />
                </Button>
              </Dialog.Close>
            </div>
            {children && <div className="mt-4">{children}</div>}
            {footer && <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
