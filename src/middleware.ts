import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { user, response } = await updateSession(request);

  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/onboarding');
  const isPublicRoute =
    pathname.startsWith('/share/') ||
    pathname === '/' ||
    pathname.startsWith('/api/webhooks/') ||
    pathname.startsWith('/api/auth/');

  // Unauthenticated user trying to access protected route
  if (!user && !isAuthRoute && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user trying to access auth route (except onboarding)
  if (user && isAuthRoute && !pathname.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|fonts/|logo/|og/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
