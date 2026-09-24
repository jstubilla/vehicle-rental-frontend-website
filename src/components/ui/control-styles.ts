/** Shared look for text-like form controls (Input, Textarea, Select, DatePicker). */
export const controlStyles =
  "block w-full min-h-control rounded-md border border-border-strong bg-field px-3 text-base text-foreground placeholder:text-muted disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted aria-[invalid=true]:border-2 aria-[invalid=true]:border-danger";

export type ControlVariant = "default" | "filled";

export const controlVariants: Record<ControlVariant, string> = {
  default: "",
  filled: "bg-surface-muted",
};
