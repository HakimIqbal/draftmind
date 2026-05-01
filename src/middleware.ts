import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { createServerClient } from '@supabase/ssr';

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
    pathname.startsWith('/search') ||
    pathname.startsWith('/settings');
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
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user — enforce role-based access
  if (user && (isAdminRoute || isUserRoute || isAuthRoute)) {
    // Check if super admin
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            /* read-only in middleware check */
          },
        },
      },
    );

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    const isSuperAdmin = profile?.is_super_admin ?? false;

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

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|fonts/|logo/|og/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
