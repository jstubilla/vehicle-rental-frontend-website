/**
 * Shared helpers for the mock API. When a real backend replaces the mocks, this
 * file is where the base URL, auth headers and error handling would live.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status = 500,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const MOCK_LATENCY_MS = 300;

/** Pretends the network takes a moment, so loading states are visible in demos. Skipped on the server. */
export async function simulateNetwork(): Promise<void> {
  if (typeof window === "undefined") return;
  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
}
