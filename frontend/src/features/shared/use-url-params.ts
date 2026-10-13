"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Keeps a list's settings (search, sort, filters, page) in the URL, so a refresh or
 * the Back button keeps them and a link can be shared.
 * `parse` and `serialize` must be plain functions defined outside the component.
 */
export function useUrlParams<T>(
  parse: (params: URLSearchParams) => T,
  serialize: (base: URLSearchParams, value: T) => URLSearchParams,
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const value = useMemo(() => parse(searchParams), [parse, searchParams]);

  const update = useCallback(
    (patch: Partial<T>) => {
      const next = serialize(new URLSearchParams(searchParams.toString()), { ...value, ...patch });
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams, serialize, value],
  );

  return [value, update] as const;
}
