"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Toast as ToastPrimitive } from "radix-ui";
import { cn } from "@/lib/cn";
import { content } from "@/content";
import { CloseIcon } from "./icons";

export type ToastVariant = "default" | "success" | "danger";

const variants: Record<ToastVariant, string> = {
  default: "border-border-strong",
  success: "border-success border-2",
  danger: "border-danger border-2",
};

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Milliseconds before auto-dismiss. */
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

/** Mount once near the app root. Then call `useToast().toast({...})` anywhere. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((options: ToastOptions) => {
    setItems((current) => [...current, { id: nextId++, ...options }]);
  }, []);

  const remove = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext value={value}>
      <ToastPrimitive.Provider swipeDirection="right" label={content.ui.notifications}>
        {children}
        {items.map((item) => (
          <ToastPrimitive.Root
            key={item.id}
            duration={item.duration ?? 5000}
            onOpenChange={(open) => {
              if (!open) remove(item.id);
            }}
            data-surface="card"
            className={cn(
              "flex items-start gap-3 rounded-lg border bg-card p-4 text-foreground shadow-lg",
              variants[item.variant ?? "default"],
            )}
          >
            <div className="flex flex-1 flex-col gap-1">
              <ToastPrimitive.Title className="font-semibold">{item.title}</ToastPrimitive.Title>
              {item.description && (
                <ToastPrimitive.Description className="text-sm text-muted">
                  {item.description}
                </ToastPrimitive.Description>
              )}
            </div>
            <ToastPrimitive.Close
              aria-label={content.ui.dismiss}
              className="inline-flex size-control-sm items-center justify-center rounded-md hover:bg-surface-muted"
            >
              <CloseIcon />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed right-0 bottom-0 z-(--z-toast) flex w-full max-w-sm flex-col gap-2 p-gutter outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
