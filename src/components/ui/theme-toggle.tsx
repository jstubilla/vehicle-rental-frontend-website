"use client";

import { content } from "@/content";
import { useTheme } from "@/features/shared/use-theme";
import { cn } from "@/lib/cn";
import { Button } from "./button";
import { MoonIcon, SunIcon } from "./icons";

/** Switches between light and dark. The choice is remembered for next time. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const t = content.ui.theme;
  const label = theme === "dark" ? t.toggleToLight : t.toggleToDark;

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={label}
      title={label}
      onClick={toggleTheme}
      className={cn(className)}
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}
