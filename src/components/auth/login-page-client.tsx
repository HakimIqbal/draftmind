'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { createClient, setRememberMePreference } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { checkBannedStatus, checkUserRole, logLoginFailure } from '@/app/(auth)/login/actions';

export function LoginPageClient() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get('reason') === 'session_expired';
  const passwordChanged = searchParams.get('password_changed') === '1';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [disabledMessage, setDisabledMessage] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);
  const submittingRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function bootstrapSession() {
      try {
        const supabase = createClient();
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;

        if (!active) return;

        if (!user) {
          setCheckingSession(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('is_super_admin')
          .eq('id', user.id)
          .single();

        window.location.replace(profile?.is_super_admin ? '/admin' : '/dashboard');
      } catch {
        if (active) setCheckingSession(false);
      }
    }

    void bootstrapSession();

    return () => {
      active = false;
    };
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current || loading || checkingSession) return;

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) return;

    submittingRef.current = true;
    setLoading(true);
    setDisabledMessage('');

    try {
      // Bind cookie lifetime to Remember Me choice BEFORE the auth handshake
      // so the first cookie write already uses the correct mode.
      setRememberMePreference(rememberMe);
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error || !data.user) {
        // Check if user is banned/disabled. Keep this awaited so disabled accounts
        // show the correct message instead of a generic credential error.
        const banned = await checkBannedStatus(normalizedEmail);
        if (banned?.disabled) {
          await logLoginFailure(normalizedEmail, 'disabled_account');
          setDisabledMessage(
            'Your account has been disabled by an administrator. Please contact your workspace admin for assistance.',
          );
        } else {
          await logLoginFailure(normalizedEmail, 'invalid_credentials');
          toast.error('Invalid email or password');
        }
        return;
      }

      const redirectTo = searchParams.get('redirectTo');
      if (redirectTo) {
        window.location.replace(redirectTo);
        return;
      }

      // Centralize post-login routing so admin users, regular users, forced
      // password changes, and login audit logging all follow the same server path.
      const roleResult = await checkUserRole();
      window.location.replace(roleResult.redirect ?? '/dashboard');
    } catch {
      toast.error('Unable to sign in right now. Please try again.');
    } finally {
      // If redirect starts, this is harmless. If it fails or validation rejects,
      // the form becomes usable again.
      submittingRef.current = false;
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-canvas px-4">
      {checkingSession && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center">
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/90 px-4 py-2 text-xs text-ink-secondary shadow-sm backdrop-blur">
            <Loader2 size={14} className="animate-spin" />
            Checking session...
          </div>
        </div>
      )}
      <div className="w-full max-w-[460px]">
        {/* Back to home */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] text-[#999] hover:text-[#555]"
          >
            <ArrowLeft size={13} />
            Back to home
          </Link>
        </div>

        {/* Branding */}
        <div className="mb-10 flex flex-col items-center text-center">
          <Image
            src="/logo/logo.jpg"
            width={100}
            height={100}
            alt="DraftMind"
            className="mb-5 rounded-2xl shadow-md"
            priority
          />
          <h1 className="font-display text-3xl font-bold text-ink-primary">DraftMind</h1>
          <p className="mt-2 text-base text-ink-secondary">Think Less. Draft Smarter.</p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-subtle bg-bg-surface p-10 shadow-sm">
          {sessionExpired && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-700">
              Your session has expired. Please sign in again.
            </div>
          )}
          {passwordChanged && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700">
              Your password has been updated. Please sign in with your new password.
            </div>
          )}
          {disabledMessage && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
              {disabledMessage}
            </div>
          )}
          <h2 className="text-xl font-semibold text-ink-primary">Sign in</h2>
          <p className="mb-5 mt-1.5 text-sm text-ink-secondary">
            Enter your credentials to access your workspace
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[15px] font-medium text-ink-primary">Email</label>
              <Input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-base"
                required
                disabled={loading || checkingSession}
                autoComplete="email"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[15px] font-medium text-ink-primary">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pr-10 text-base"
                  required
                  disabled={loading || checkingSession}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading || checkingSession}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink-secondary"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading || checkingSession}
                  className="h-3.5 w-3.5 rounded border-[#ddd] accent-accent"
                />
                <span className="text-sm text-ink-secondary">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-[12px] font-medium text-ink-secondary underline-offset-2 transition hover:text-accent hover:underline"
              >
                Forgot your password?
              </Link>
            </div>
            <Button
              type="submit"
              variant="primary-fill"
              className="h-12 w-full text-base"
              disabled={loading || checkingSession}
            >
              {loading && <Loader2 size={16} className="mr-2 animate-spin" />}
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center font-mono text-[11px] text-ink-tertiary">
          &copy; {new Date().getFullYear()} DraftMind &middot;{' '}
          <a
            href="/privacy"
            className="underline-offset-2 hover:text-ink-secondary hover:underline"
          >
            Privacy
          </a>{' '}
          &middot;{' '}
          <a href="/terms" className="underline-offset-2 hover:text-ink-secondary hover:underline">
            Terms
          </a>
        </p>
      </div>
    </div>
  );
}
