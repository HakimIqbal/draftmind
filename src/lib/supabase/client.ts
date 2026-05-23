import { createBrowserClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';

/**
 * "Remember Me" behavior for the Supabase browser client.
 *
 * We control Supabase auth-cookie lifetime ON THE WRITE PATH, not via Supabase config:
 *
 * - Remember Me ON  → cookies are written with maxAge = 7 days (persistent).
 * - Remember Me OFF → cookies are written without maxAge / expires (session cookies),
 *   so the browser drops them when it closes and the user must sign in again.
 *
 * The choice is read from localStorage so it survives across the auth handshake
 * (where Supabase rotates the refresh token and re-writes cookies several times).
 *
 * IMPORTANT: callers must set `draftmind_remember_me` BEFORE calling
 * `supabase.auth.signInWithPassword(...)`, otherwise the very first cookie write
 * will fall back to the default (which is "session" here).
 */

const REMEMBER_ME_STORAGE_KEY = 'draftmind_remember_me';
const REMEMBER_ME_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export function setRememberMePreference(value: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (value) {
      window.localStorage.setItem(REMEMBER_ME_STORAGE_KEY, 'true');
    } else {
      window.localStorage.setItem(REMEMBER_ME_STORAGE_KEY, 'false');
    }
  } catch {
    // localStorage may be unavailable (private mode, quota) — fall through to session-cookie default.
  }
}

function readRememberMePreference(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(REMEMBER_ME_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function isSupabaseAuthCookie(name: string): boolean {
  // Supabase SSR writes the auth token under names like:
  //   sb-<project-ref>-auth-token
  //   sb-<project-ref>-auth-token.0
  //   sb-<project-ref>-auth-token.1
  // We only touch lifetime for auth-token cookies, never PKCE/verifier helpers
  // which Supabase manages internally with its own lifetime.
  return /^sb-.*-auth-token(\.[0-9]+)?$/.test(name);
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        // Anything not explicitly overridden below uses these defaults.
        sameSite: 'lax',
        secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
        path: '/',
      },
      cookies: {
        getAll() {
          if (typeof document === 'undefined') return [];
          return document.cookie
            .split('; ')
            .filter(Boolean)
            .map((pair) => {
              const eq = pair.indexOf('=');
              const name = eq === -1 ? pair : pair.slice(0, eq);
              const value = eq === -1 ? '' : decodeURIComponent(pair.slice(eq + 1));
              return { name, value };
            });
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          if (typeof document === 'undefined') return;
          const remember = readRememberMePreference();
          for (const { name, value, options } of cookiesToSet) {
            const opts: CookieOptions = { ...(options ?? {}) };
            if (isSupabaseAuthCookie(name)) {
              if (remember) {
                opts.maxAge = REMEMBER_ME_MAX_AGE_SECONDS;
                delete opts.expires;
              } else {
                // Session cookie: drop maxAge AND expires so the browser
                // discards it on close.
                delete opts.maxAge;
                delete opts.expires;
              }
            }
            document.cookie = serializeCookie(name, value, opts);
          }
        },
      },
    },
  );
}

function serializeCookie(name: string, value: string, options: CookieOptions): string {
  const parts: string[] = [`${name}=${encodeURIComponent(value)}`];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${Math.floor(options.maxAge)}`);
  if (options.expires) {
    const exp = options.expires instanceof Date ? options.expires : new Date(options.expires);
    parts.push(`Expires=${exp.toUTCString()}`);
  }
  if (options.domain) parts.push(`Domain=${options.domain}`);
  parts.push(`Path=${options.path ?? '/'}`);
  if (options.sameSite) {
    const s = String(options.sameSite);
    parts.push(`SameSite=${s.charAt(0).toUpperCase()}${s.slice(1)}`);
  }
  if (options.secure) parts.push('Secure');
  if (options.httpOnly) parts.push('HttpOnly');
  return parts.join('; ');
}
