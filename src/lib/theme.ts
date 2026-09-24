/**
 * Light/dark theme. Lives outside React (like features/booking/flow-store.ts) so the
 * toggle works from any page, and so the inline script in the root layout — which sets
 * the theme before the page paints, to avoid a flash of the wrong one — can use the same
 * rule. If this resolution logic changes, update that inline script to match.
 */
export type Theme = "light" | "dark";

const STORAGE_KEY = "car-rental-theme";

function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Saved choice if there is one, otherwise the device's own light/dark setting. */
function resolveInitialTheme(): Theme {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // Blocked storage: fall back to the system preference below.
  }
  return systemTheme();
}

function applyTheme(next: Theme): void {
  document.documentElement.dataset.theme = next;
  document.documentElement.style.colorScheme = next;
}

let theme: Theme | null = null;
const listeners = new Set<() => void>();

function load(): Theme {
  if (theme === null) {
    theme = resolveInitialTheme();
    applyTheme(theme);
  }
  return theme;
}

export function getTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return load();
}

/** Used while the server renders: the inline script corrects this in the browser before paint. */
export function getServerTheme(): Theme {
  return "light";
}

export function setTheme(next: Theme): void {
  theme = next;
  applyTheme(next);
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Storage full or blocked: the choice still applies for this page view.
  }
  listeners.forEach((listener) => listener());
}

export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

if (typeof window !== "undefined") {
  // Keep every open tab in sync when the theme changes in another one.
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    const next = event.newValue === "dark" ? "dark" : "light";
    theme = next;
    applyTheme(next);
    listeners.forEach((listener) => listener());
  });
}

/**
 * Source for the inline script in src/app/layout.tsx. Kept here as one string so the
 * rule it implements — saved choice, else system preference — has a single home, even
 * though the script itself has to run standalone before any module loads.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){}})();`;
