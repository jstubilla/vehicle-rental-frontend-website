import { newId, readTable, writeTable } from "@/mocks/store";
import type { Account, AccountProfile } from "@/types";
import { ApiError, simulateNetwork } from "./client";

/**
 * MOCK CUSTOMER LOGIN for website visitors (staff use /src/api/auth.ts).
 * The signed-in account id is kept in the browser; a real back end would use a
 * secure session cookie and would email real login codes.
 */
const SESSION_KEY = "car-rental-account";

export type LoginProvider = "google" | "apple";

/** Demo profiles for "Continue with Google / Apple". A real back end gets these from the provider. */
const PROVIDER_PROFILES: Record<LoginProvider, { name: string; email: string }> = {
  google: { name: "Google Demo User", email: "google.demo@example.com" },
  apple: { name: "Apple Demo User", email: "apple.demo@example.com" },
};

const normalize = (email: string) => email.trim().toLowerCase();

function toProfile(account: Account): AccountProfile {
  const { id, name, email, phone, licenseNumber, createdAt } = account;
  return { id, name, email, phone, licenseNumber, createdAt };
}

function remember(account: Account): AccountProfile {
  try {
    window.localStorage.setItem(SESSION_KEY, account.id);
  } catch {
    // Storage blocked: the visitor stays signed in until the page is closed only.
  }
  return toProfile(account);
}

function findByEmail(email: string): Account | undefined {
  return readTable("accounts").find((a) => a.email.toLowerCase() === normalize(email));
}

function create(name: string, email: string, password: string): Account {
  const account: Account = {
    id: newId("acc"),
    name: name.trim(),
    email: normalize(email),
    password,
    phone: "",
    licenseNumber: "",
    createdAt: new Date().toISOString(),
  };
  writeTable("accounts", [...readTable("accounts"), account]);
  return account;
}

/** The signed-in customer, or null. */
export async function getCurrentAccount(): Promise<AccountProfile | null> {
  if (typeof window === "undefined") return null;
  let id: string | null = null;
  try {
    id = window.localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
  const account = id ? readTable("accounts").find((a) => a.id === id) : undefined;
  return account ? toProfile(account) : null;
}

export async function signUp(input: { name: string; email: string; password: string }): Promise<AccountProfile> {
  await simulateNetwork();
  if (findByEmail(input.email)) throw new ApiError("An account with this email already exists", 409, "duplicate_email");
  return remember(create(input.name, input.email, input.password));
}

export async function loginWithPassword(email: string, password: string): Promise<AccountProfile> {
  await simulateNetwork();
  const account = findByEmail(email);
  if (!account || account.password !== password) {
    throw new ApiError("Wrong email or password", 401, "invalid_credentials");
  }
  return remember(account);
}

/** Step 1 of "log in with an email code". The mock sends nothing: a real back end emails the code here. */
export async function requestLoginCode(email: string): Promise<void> {
  await simulateNetwork();
  if (!findByEmail(email)) throw new ApiError("No account with this email", 404, "no_account");
}

/** Step 2. DEMO ONLY: any 6 digits are accepted. */
export async function loginWithCode(email: string, code: string): Promise<AccountProfile> {
  await simulateNetwork();
  const account = findByEmail(email);
  if (!account) throw new ApiError("No account with this email", 404, "no_account");
  if (!/^\d{6}$/.test(code.trim())) throw new ApiError("That code is not right", 401, "invalid_code");
  return remember(account);
}

/** DEMO ONLY: signs in as a fixed demo profile, creating it the first time. */
export async function loginWithProvider(provider: LoginProvider): Promise<AccountProfile> {
  await simulateNetwork();
  const profile = PROVIDER_PROFILES[provider];
  // Provider accounts have no password of their own: the random one can never be typed.
  return remember(findByEmail(profile.email) ?? create(profile.name, profile.email, newId("provider")));
}

export async function logout(): Promise<void> {
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // Nothing stored.
  }
}

/** Called after a booking is made while signed in, so the next booking can be filled in. */
export function saveSignedInDetails(details: { phone: string; licenseNumber: string }): void {
  let id: string | null = null;
  try {
    id = window.localStorage.getItem(SESSION_KEY);
  } catch {
    return;
  }
  if (!id) return;
  writeTable(
    "accounts",
    readTable("accounts").map((a) => (a.id === id ? { ...a, phone: details.phone, licenseNumber: details.licenseNumber } : a)),
  );
}
