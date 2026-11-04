import { NextRequest, NextResponse } from 'next/server';

const API_PROXY_TARGET = process.env.API_PROXY_TARGET || 'http://localhost:5000';

export async function POST(req: NextRequest) {
  // Forward logout to backend with a short timeout (non-blocking if backend is down)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    const cookieHeader = req.headers.get('cookie') || '';
    const authHeader = req.headers.get('authorization') || '';

    await fetch(`${API_PROXY_TARGET}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
        ...(authHeader ? { authorization: authHeader } : {}),
      },
      signal: controller.signal,
    }).catch(() => {});

    clearTimeout(timeoutId);
  } catch {
    // Ignore backend network errors; always clear cookies on the frontend response
  }

  const response = NextResponse.json(
    { message: 'Logged out successfully' },
    { status: 200 }
  );

  const cookiesToClear = [
    'token',
    'jwt',
    'access_token',
    'refreshToken',
    'refresh_token',
  ];

  for (const name of cookiesToClear) {
    response.cookies.set(name, '', {
      httpOnly: true,
      path: '/',
      maxAge: 0,
      expires: new Date(0),
      sameSite: 'lax',
    });
  }

  return response;
}

