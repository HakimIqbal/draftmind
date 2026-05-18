import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { user, response } = await updateSession(request);

  const { pathname, searchParams } = request.nextUrl;

  // Handle auth code at root — redirect to auth callback
  if (pathname === '/' && searchParams.get('code')) {
    const callbackUrl = new URL('/api/auth/callback', request.url);
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
    pathname.startsWith('/api/webhooks/') ||
    pathname.startsWith('/api/auth/');

  // Remember me check: session cookie "remember_me=false" disappears when browser closes.
  // If user is logged in but remember_me cookie is missing and was never set to "true",
  // the Supabase session persists but we don't force logout here — Supabase handles token expiry.

  // Unauthenticated user trying to access protected route
  if (!user && !isAuthRoute && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);

    // If session cookies exist but user is null → stale/banned session, clear cookies
    const hasSessionCookie = request.cookies.getAll().some((c) => c.name.startsWith('sb-'));
    if (hasSessionCookie) {
      loginUrl.searchParams.set('reason', 'session_expired');
      const redirectResponse = NextResponse.redirect(loginUrl);
      // Clear all Supabase auth cookies
      for (const cookie of request.cookies.getAll()) {
        if (cookie.name.startsWith('sb-')) {
          redirectResponse.cookies.delete(cookie.name);
        }
      }
      return redirectResponse;
    }

    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user — enforce role-based access
  if (user && (isAdminRoute || isUserRoute || isAuthRoute)) {
    // Use native fetch + service role key — fully compatible with Edge Runtime.
    // @supabase/supabase-js createClient may not reliably resolve in Edge Runtime.
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

    // Force password change — intercept before all other routing
    if (profile?.force_password_change && !isChangePasswordRoute) {
      return NextResponse.redirect(new URL('/change-password', request.url));
    }

    // Guard: no longer forced but trying to access /change-password → back to dashboard
    if (!profile?.force_password_change && isChangePasswordRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Auth route — redirect to correct dashboard
    if (isAuthRoute) {
      return NextResponse.redirect(new URL(isSuperAdmin ? '/admin' : '/dashboard', request.url));
    }

    // Admin trying to access user routes → redirect to admin
    if (isSuperAdmin && isUserRoute) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    // User trying to access admin routes → redirect to home
    if (!isSuperAdmin && isAdminRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
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
