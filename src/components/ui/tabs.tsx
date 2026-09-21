"use client";

import { createContext, useContext, type ComponentProps } from "react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { cn } from "@/lib/cn";

export type TabsVariant = "line" | "boxed";

const VariantContext = createContext<TabsVariant>("line");

const listVariants: Record<TabsVariant, string> = {
  line: "gap-1 border-b border-border",
  boxed: "gap-1 rounded-md bg-surface-muted p-1",
};

const triggerVariants: Record<TabsVariant, string> = {
  line: "-mb-px border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:font-semibold",
  boxed:
    "rounded-md border border-transparent data-[state=active]:border-border data-[state=active]:bg-surface data-[state=active]:font-semibold",
};

export function Tabs({
  variant = "line",
  ...props
}: ComponentProps<typeof TabsPrimitive.Root> & { variant?: TabsVariant }) {
  return (
    <VariantContext value={variant}>
      <TabsPrimitive.Root {...props} />
    </VariantContext>
  );
}

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  const variant = useContext(VariantContext);
  return (
    <TabsPrimitive.List
      className={cn("flex overflow-x-auto", listVariants[variant], className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  const variant = useContext(VariantContext);
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex min-h-control items-center justify-center px-4 text-base whitespace-nowrap text-muted data-[state=active]:text-foreground",
        triggerVariants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn("pt-4", className)} {...props} />;
}
