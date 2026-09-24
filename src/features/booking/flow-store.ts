/**
 * What the visitor has filled in so far. It lives outside React so every step page
 * shares it, and it is saved in sessionStorage so a refresh or the Back button
 * does not lose progress. It is cleared when the booking is confirmed.
 */
export interface FlowRental {
  pickupLocation: string;
  returnLocation: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
}

export interface FlowCustomer {
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  notes: string;
}

export interface FlowState {
  vehicleSlug: string | null;
  rental: FlowRental | null;
  customer: FlowCustomer | null;
}

const EMPTY: FlowState = { vehicleSlug: null, rental: null, customer: null };
const STORAGE_KEY = "car-rental-booking-flow";

let state: FlowState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const saved = window.sessionStorage.getItem(STORAGE_KEY);
    if (saved) state = { ...EMPTY, ...(JSON.parse(saved) as Partial<FlowState>) };
  } catch {
    // Unreadable or blocked storage: start with an empty booking.
  }
}

export function getFlowSnapshot(): FlowState {
  load();
  return state;
}

/** Used while the server renders: there is no saved booking on the server. */
export function getFlowServerSnapshot(): FlowState {
  return EMPTY;
}

export function subscribeFlow(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function updateFlow(patch: Partial<FlowState>): void {
  load();
  state = { ...state, ...patch };
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked: the booking still works until the page is closed.
  }
  listeners.forEach((listener) => listener());
}

export function resetFlow(): void {
  updateFlow({ ...EMPTY });
}
