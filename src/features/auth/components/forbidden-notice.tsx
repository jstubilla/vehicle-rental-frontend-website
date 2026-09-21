"use client";

import Link from "next/link";
import { Button, EmptyState } from "@/components/ui";
import { content } from "@/content";
import { firstAllowedPath } from "@/lib/permissions";
import { useAuth } from "../hooks/use-auth";

/** Shown when a signed-in person opens a page their role does not include. */
export function ForbiddenNotice() {
  const { session } = useAuth();
  const startPath = session ? firstAllowedPath(session.permissions) : null;

  return (
    <EmptyState
      headingAs="h1"
      title={content.admin.forbidden.title}
      description={content.admin.forbidden.description}
      action={
        startPath ? (
          <Button asChild>
            <Link href={startPath}>{content.admin.forbidden.action}</Link>
          </Button>
        ) : undefined
      }
    />
  );
}
