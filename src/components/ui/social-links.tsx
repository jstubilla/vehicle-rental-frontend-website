import { cn } from "@/lib/cn";
import { content } from "@/content";

export interface SocialLink {
  label: string;
  href: string;
}

/** Row of social media links. Web links open in a new tab; app links (e.g. viber://) open the app directly. */
export function SocialLinks({ links, className }: { links: readonly SocialLink[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-4", className)}>
      {links.map((link) => {
        const isWeb = link.href.startsWith("http");
        return (
          <li key={link.label}>
            <a
              href={link.href}
              target={isWeb ? "_blank" : undefined}
              rel={isWeb ? "noopener noreferrer" : undefined}
              className="text-sm underline underline-offset-4 hover:no-underline"
            >
              {link.label}
              {isWeb && <span className="sr-only"> ({content.ui.opensInNewTab})</span>}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
