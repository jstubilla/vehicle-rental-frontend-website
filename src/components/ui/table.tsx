import type {
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";
import { content } from "@/content";

export type TableVariant = "default" | "striped";
export type SortDirection = "asc" | "desc" | "none";

const variants: Record<TableVariant, string> = {
  default: "",
  striped: "[&_tbody_tr:nth-child(even)]:bg-surface-muted",
};

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  variant?: TableVariant;
  /** Accessible name for the scrollable area. Makes wide tables keyboard-scrollable. */
  label?: string;
  wrapperClassName?: string;
}

export function Table({ variant = "default", label, wrapperClassName, className, ...props }: TableProps) {
  return (
    <div
      className={cn("w-full overflow-x-auto rounded-lg border border-border", wrapperClassName)}
      {...(label ? { role: "region", "aria-label": label, tabIndex: 0 } : {})}
    >
      <table
        className={cn("w-full border-collapse text-left text-sm", variants[variant], className)}
        {...props}
      />
    </div>
  );
}

export function TableCaption({ className, ...props }: HTMLAttributes<HTMLTableCaptionElement>) {
  return <caption className={cn("p-3 text-left text-sm text-muted", className)} {...props} />;
}

export function TableHeader({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("bg-surface-muted", className)} {...props} />;
}

export function TableBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />;
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("border-b border-border last:border-b-0", className)} {...props} />;
}

export interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  /** Pass to make the column sortable. */
  sortDirection?: SortDirection;
  onSort?: () => void;
}

export function TableHead({ sortDirection, onSort, className, children, ...props }: TableHeadProps) {
  const sortable = sortDirection !== undefined;
  const ariaSort =
    sortDirection === "asc" ? "ascending" : sortDirection === "desc" ? "descending" : sortable ? "none" : undefined;

  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={cn("px-4 py-3 font-semibold whitespace-nowrap text-foreground", className)}
      {...props}
    >
      {sortable ? (
        <button
          type="button"
          onClick={onSort}
          className="inline-flex items-center gap-1 font-semibold"
        >
          {children}
          <span aria-hidden="true">
            {sortDirection === "asc" ? "▲" : sortDirection === "desc" ? "▼" : "↕"}
          </span>
          {sortDirection !== "none" && (
            <span className="sr-only">
              ({sortDirection === "asc" ? content.ui.sort.ascending : content.ui.sort.descending})
            </span>
          )}
        </button>
      ) : (
        children
      )}
    </th>
  );
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3 align-middle", className)} {...props} />;
}
