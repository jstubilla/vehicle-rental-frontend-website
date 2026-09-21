import { cn } from "@/lib/cn";
import { content } from "@/content";

export interface SocialLink {
  label: string;
  href: string;
}

/** Row of social media links. Opens in a new tab. */
export function SocialLinks({ links, className }: { links: readonly SocialLink[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-4", className)}>
      {links.map((link) => (
        <li key={link.label}>
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm underline underline-offset-4 hover:no-underline"
          >
            {link.label}
            <span className="sr-only"> ({content.ui.opensInNewTab})</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
