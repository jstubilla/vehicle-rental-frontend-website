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
  board: () => [...leadKeys.all, "board"] as const,
};

export const bookingKeys = {
  all: ["bookings"] as const,
  list: (params: unknown) => [...bookingKeys.all, "list", params] as const,
  detail: (id: string) => [...bookingKeys.all, "detail", id] as const,
};

export const reviewKeys = {
  all: ["reviews"] as const,
  admin: () => [...reviewKeys.all, "admin"] as const,
  public: () => [...reviewKeys.all, "public"] as const,
};

export const taskKeys = {
  all: ["tasks"] as const,
  list: (params: unknown) => [...taskKeys.all, "list", params] as const,
  linked: (type: string, id: string) => [...taskKeys.all, "linked", type, id] as const,
  options: (type: string) => [...taskKeys.all, "options", type] as const,
};
