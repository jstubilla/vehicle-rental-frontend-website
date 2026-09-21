"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary } from "@/api/dashboard";

export function useDashboardSummary() {
  return useQuery({ queryKey: ["dashboard", "summary"], queryFn: getDashboardSummary });
}
