import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/auto';

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', origin));
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
    return NextResponse.redirect(new URL('/login?error=auth_failed', origin));
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

  const response = NextResponse.redirect(new URL(redirectTo, origin));
  for (const { name, value, options } of cookiesToSet) {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
  }

  return response;
}
