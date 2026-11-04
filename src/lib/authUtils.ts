/**
 * Centralized Client Authentication Utilities
 * Handles thorough, synchronous cleanup of tokens, session records, and cookies on logout.
 */

export function clearClientAuth(): void {
  if (typeof window === 'undefined') return;

  // 1. Thoroughly remove all auth tokens and cached users from localStorage synchronously
  const authKeys = [
    'token',
    'access_token',
    'accessToken',
    'auth_token',
    'user',
    'customer_user',
    'staff_user',
    'manager_user',
    'admin_user',
    'current_user',
    'auth_user',
  ];

  for (const key of authKeys) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }

  // 2. Clear entire sessionStorage
  try {
    sessionStorage.clear();
    sessionStorage.setItem('ss_logged_out', '1');
  } catch {
    // ignore
  }

  // 3. Clear non-HttpOnly cookies on client side
  const cookiesToClear = [
    'jwt',
    'token',
    'access_token',
    'refreshToken',
    'refresh_token',
  ];

  const host = window.location.hostname;
  for (const name of cookiesToClear) {
    document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0;`;
    if (host) {
      document.cookie = `${name}=; Path=/; Domain=${host}; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0;`;
      document.cookie = `${name}=; Path=/; Domain=.${host}; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0;`;
    }
  }

  // 4. Fire non-blocking keepalive request to Next.js /api/auth/logout route to wipe HttpOnly cookies
  try {
    fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    }).catch(() => {});
  } catch {
    // ignore
  }
}
