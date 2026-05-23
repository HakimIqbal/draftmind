import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { getPublicOrigin } from '@/lib/http/public-origin';

async function logSecurityEvent(
  source: string,
  message: string,
  metadata: Record<string, unknown> = {},
  userId?: string,
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) return;

    await fetch(`${supabaseUrl}/rest/v1/system_logs`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        level: 'warn',
        source,
        message,
        metadata,
        user_id: userId ?? null,
        workspace_id: null,
      }),
    });
  } catch {}
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const publicOrigin = getPublicOrigin({
    nextUrlOrigin: request.nextUrl.origin,
    headers: request.headers,
    envAppUrl: process.env.NEXT_PUBLIC_APP_URL,
  });

  // Handle auth code at root — redirect to auth callback
  if (pathname === '/' && searchParams.get('code')) {
    const callbackUrl = new URL('/api/auth/callback', publicOrigin);
    callbackUrl.searchParams.set('code', searchParams.get('code')!);
    callbackUrl.searchParams.set('next', '/auto');
    return NextResponse.redirect(callbackUrl);
  }

  const isAuthRoute = pathname.startsWith('/login');
  const isAdminRoute = pathname.startsWith('/admin');
  const isUserRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/prds') ||
    pathname.startsWith('/templates') ||
    pathname.startsWith('/workspace') ||
    pathname.startsWith('/ai-runs') ||
    pathname.startsWith('/invite') ||
    pathname === '/change-password';
  const isPublicRoute =
    pathname.startsWith('/share/') ||
    pathname === '/' ||
    pathname === '/privacy' ||
    pathname === '/terms' ||
    pathname === '/forgot-password' ||
    pathname.startsWith('/api/webhooks/') ||
    pathname.startsWith('/api/auth/');

  // Public + auth routes must stay fast and must NOT block on Supabase session refresh.
  // Login/landing pages handle their own session-driven redirect on the client.
  if (isPublicRoute || isAuthRoute) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-pathname', pathname);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const { user, error: sessionError, response } = await updateSession(request);
  if (sessionError) {
    await logSecurityEvent('auth.session_refresh_failed', sessionError.message, {
      path: request.nextUrl.pathname,
    });
  }

  // Unauthenticated user trying to access protected route
  if (!user) {
    const loginUrl = new URL('/login', publicOrigin);
    loginUrl.searchParams.set('redirectTo', pathname);

    const hasSessionCookie = request.cookies.getAll().some((c) => c.name.startsWith('sb-'));
    if (hasSessionCookie) {
      await logSecurityEvent(
        'auth.stale_session',
        'Session cookies existed but user could not be resolved',
        { pathname },
      );
      loginUrl.searchParams.set('reason', 'session_expired');
      const redirectResponse = NextResponse.redirect(loginUrl);
      for (const cookie of request.cookies.getAll()) {
        if (cookie.name.startsWith('sb-')) {
          redirectResponse.cookies.delete(cookie.name);
        }
      }
      return redirectResponse;
    }

    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user — enforce role-based access for admin/user routes
  if (isAdminRoute || isUserRoute) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}&select=is_super_admin,force_password_change&limit=1`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const responseText = await profileRes.text();
    let profiles: { is_super_admin: boolean; force_password_change: boolean }[] = [];
    try {
      profiles = JSON.parse(responseText);
    } catch {
      // malformed response — profile stays empty, isSuperAdmin defaults to false
    }
    const profile = profiles?.[0] ?? null;

    const isSuperAdmin = profile?.is_super_admin ?? false;
    const isChangePasswordRoute = pathname === '/change-password';

    if (profile?.force_password_change && !isChangePasswordRoute) {
      return NextResponse.redirect(new URL('/change-password', publicOrigin));
    }

    if (!profile?.force_password_change && isChangePasswordRoute) {
      return NextResponse.redirect(new URL('/dashboard', publicOrigin));
    }

    if (isSuperAdmin && isUserRoute && !isChangePasswordRoute) {
      return NextResponse.redirect(new URL('/admin', publicOrigin));
    }

    if (!isSuperAdmin && isAdminRoute) {
      await logSecurityEvent(
        'security.unauthorized_admin_access',
        'Non-admin user attempted to access admin route',
        { pathname },
        user.id,
      );
      return NextResponse.redirect(new URL('/dashboard', publicOrigin));
    }
  }

  // Forward pathname as request header so server components (layout) can read it via headers()
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);
  const responseWithHeader = NextResponse.next({ request: { headers: requestHeaders } });
  for (const cookie of response.cookies.getAll()) {
    responseWithHeader.cookies.set(cookie);
  }
  return responseWithHeader;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|fonts/|logo/|og/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
