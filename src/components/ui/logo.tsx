import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { logo } from "@/assets/config";

/** Site logo. Plain-text wordmark until `logo.src` is set in assets/config.ts. */
export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center font-heading text-xl font-bold tracking-tight text-foreground no-underline",
        className,
      )}
    >
      {logo.src ? (
        <Image src={logo.src} alt={logo.alt} width={logo.width} height={logo.height} priority />
      ) : (
        logo.wordmark
      )}
    </Link>
  );
}
