import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { getPublicOrigin } from '@/lib/http/public-origin';
import { logError } from '@/lib/logging/system-log';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const publicOrigin = getPublicOrigin({
    nextUrlOrigin: request.nextUrl.origin,
    headers: request.headers,
    envAppUrl: process.env.NEXT_PUBLIC_APP_URL,
  });
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/auto';

  if (!code) {
    logError('auth.callback.failed', 'Auth callback missing code', { reason: 'missing_code' });
    return NextResponse.redirect(new URL('/login?error=missing_code', publicOrigin));
  }

  const cookiesToSet: { name: string; value: string; options?: object }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies: { name: string; value: string; options?: object }[]) {
          cookiesToSet.push(...cookies);
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    logError('auth.callback.failed', error.message, { reason: 'exchange_code_failed' });
    return NextResponse.redirect(new URL('/login?error=auth_failed', publicOrigin));
  }

  // Auto-detect: check if user is super admin
  let redirectTo = next;
  if (next === '/auto') {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        // Profile query failed — default to /home, middleware will handle re-check
        redirectTo = '/dashboard';
      } else {
        redirectTo = profile.is_super_admin ? '/admin' : '/dashboard';
      }
    } else {
      redirectTo = '/dashboard';
    }
  }

  const response = NextResponse.redirect(new URL(redirectTo, publicOrigin));
  for (const { name, value, options } of cookiesToSet) {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
  }

  return response;
}
