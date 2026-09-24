import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { logo } from "@/assets/config";

const imageClass = "h-10 w-auto";

/** Site logo. Plain-text wordmark until `logo.src` is set in assets/config.ts. Can use a second file in dark mode. */
export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  const hasDark = Boolean(logo.src && logo.srcDark);

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center py-2 font-heading text-xl font-bold tracking-tight text-foreground no-underline",
        className,
      )}
    >
      {logo.src ? (
        <>
          <Image
            src={logo.src}
            alt={logo.alt}
            width={logo.width}
            height={logo.height}
            className={cn(imageClass, hasDark && "dark:hidden")}
            loading="eager"
          />
          {hasDark && logo.srcDark && (
            // Hidden with CSS (display: none), so screen readers only ever meet one logo.
            <Image
              src={logo.srcDark}
              alt={logo.alt}
              width={logo.darkWidth}
              height={logo.darkHeight}
              className={cn(imageClass, "hidden dark:block")}
              loading="eager"
            />
          )}
        </>
      ) : (
        logo.wordmark
      )}
    </Link>
  );
}
