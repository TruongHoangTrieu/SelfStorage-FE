/**
 * Thin fetch wrapper for the SelfStorage backend.
 *
 * Base URL resolution order:
 *   1. NEXT_PUBLIC_API_URL — e.g. "https://api.example.com/api" to hit a backend directly.
 *   2. "/api" (default)    — same-origin, forwarded to the real backend by the rewrite
 *                            rule in next.config.ts. This is the recommended local-dev
 *                            setup because the browser never issues a cross-origin request,
 *                            so CORS can never break it.
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * Error thrown for both non-2xx responses and network-level failures.
 * `isNetworkError` is true when fetch() itself never got a response
 * (backend down, refused connection, CORS rejection, blocking extension, timeout).
 */
export class ApiError extends Error {
  /** HTTP status code, or 0 when the request never reached the server. */
  readonly status: number;
  /** True when the request failed before any HTTP response was received. */
  readonly isNetworkError: boolean;

  constructor(message: string, status = 0, isNetworkError = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isNetworkError = isNetworkError;
  }
}

interface FetchOptions extends RequestInit {
  data?: unknown;
  timeoutMs?: number;
}

/* eslint-disable @typescript-eslint/no-explicit-any --
   The default generic keeps the many existing untyped call sites working
   (`await api.get('/x')`). New code should pass an explicit response type. */
export const api = {
  get: <T = any>(endpoint: string, options?: FetchOptions) => request<T>(endpoint, { ...options, method: 'GET' }),
  post: <T = any>(endpoint: string, data?: unknown, options?: FetchOptions) => request<T>(endpoint, { ...options, method: 'POST', data }),
  patch: <T = any>(endpoint: string, data?: unknown, options?: FetchOptions) => request<T>(endpoint, { ...options, method: 'PATCH', data }),
  delete: <T = any>(endpoint: string, options?: FetchOptions) => request<T>(endpoint, { ...options, method: 'DELETE' }),
};
/* eslint-enable @typescript-eslint/no-explicit-any */

async function request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { data, headers, timeoutMs = DEFAULT_TIMEOUT_MS, signal, ...customConfig } = options;

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Abort if the backend hangs so the UI never spins on the loader forever.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  signal?.addEventListener('abort', () => controller.abort(), { once: true });

  const config: RequestInit = {
    ...customConfig,
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
  };

  if (data !== undefined) {
    config.body = JSON.stringify(data);
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, config);
  } catch {
    // fetch() only rejects on network-level failures: refused connection, DNS
    // failure, CORS rejection, a blocking browser extension, or our own abort.
    throw new ApiError(
      controller.signal.aborted
        ? `Request to ${endpoint} timed out after ${timeoutMs}ms. The API may be down.`
        : `Cannot reach the SelfStorage API at ${BASE_URL}${endpoint}. ` +
          `Check that the backend is running and that the URL is reachable.`,
      0,
      true
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let errorMsg = '';
    try {
      const errRes = await response.json();
      errorMsg = errRes?.message || errRes?.error || '';
    } catch {
      // Non-JSON body (e.g. the HTML error page Next renders when the proxy
      // cannot reach the backend) — fall through to a status-based message.
    }

    if (!errorMsg) {
      // A 5xx with a non-JSON body while going through the same-origin proxy
      // means the Next.js server could not reach the backend at all.
      errorMsg =
        response.status >= 500 && BASE_URL.startsWith('/')
          ? `The API request to ${endpoint} failed with status ${response.status}. ` +
            `The Next.js proxy could not reach the backend — make sure it is running and that API_PROXY_TARGET is correct.`
          : response.statusText || `Request failed with status ${response.status}`;
    }

    throw new ApiError(errorMsg, response.status);
  }

  // Handle empty responses
  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}
