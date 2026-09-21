"use client";

import type { ReactNode } from "react";
import type { Permission } from "@/lib/constants";
import { useAuth } from "../hooks/use-auth";

/** Shows its children only if the signed-in person's role has the permission. */
export function Can({
  permission,
  children,
  fallback = null,
}: {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { can } = useAuth();
  return <>{can(permission) ? children : fallback}</>;
}
