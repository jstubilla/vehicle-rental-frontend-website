/** Cache keys for admin data. Kept together so any screen can refresh what another screen changed. */
export const customerKeys = {
  all: ["customers"] as const,
  list: (params: unknown) => [...customerKeys.all, "list", params] as const,
  profile: (id: string) => [...customerKeys.all, "profile", id] as const,
};

export const leadKeys = {
  all: ["leads"] as const,
  list: (params: unknown) => [...leadKeys.all, "list", params] as const,
  detail: (id: string) => [...leadKeys.all, "detail", id] as const,
};
