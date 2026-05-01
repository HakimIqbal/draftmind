'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, Eye, EyeOff, ArrowLeft, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { checkUserRole } from '@/app/(auth)/login/actions';

export function LoginPageClient() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error('Invalid email or password');
      setLoading(false);
      return;
    }

    if (data.user) {
      // Set remember_me cookie
      if (rememberMe) {
        document.cookie = 'remember_me=true; path=/; max-age=2592000'; // 30 days
      } else {
        document.cookie = 'remember_me=false; path=/';
      }

      // Check role via backend
      const result = await checkUserRole();

      if (result.error) {
        toast.error(result.error);
        setLoading(false);
        return;
      }

      router.push(result.redirect);
    } else {
      router.push('/dashboard');
    }
    router.refresh();
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!forgotEmail) return;

    setForgotLoading(true);
    const supabase = createClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${appUrl}/api/auth/callback?next=/auto`,
    });

    if (error) toast.error(error.message);
    else setForgotSent(true);
    setForgotLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-canvas px-4">
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
          {forgotMode ? (
            forgotSent ? (
              <div className="text-center">
                <div className="bg-accent/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
                  <Mail size={22} className="text-accent" />
                </div>
                <h2 className="text-xl font-semibold text-ink-primary">Check your email</h2>
                <p className="mt-1.5 text-[13px] text-ink-secondary">
                  We sent a password reset link to
                </p>
                <p className="mt-1 font-mono text-xs text-ink-tertiary">{forgotEmail}</p>
                <button
                  onClick={() => {
                    setForgotMode(false);
                    setForgotSent(false);
                    setForgotEmail('');
                  }}
                  className="mt-5 text-[13px] text-accent hover:underline"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setForgotMode(false)}
                  className="mb-5 flex items-center gap-1.5 text-[13px] text-[#999] hover:text-[#555]"
                >
                  <ArrowLeft size={14} />
                  Back to sign in
                </button>
                <h2 className="text-xl font-semibold text-ink-primary">Reset password</h2>
                <p className="mb-5 mt-1.5 text-[13px] text-ink-secondary">
                  Enter your email and we&apos;ll send you a reset link.
                </p>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-[15px] font-medium text-ink-primary">
                      Email
                    </label>
                    <Input
                      type="email"
                      placeholder="you@company.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="h-12 text-base"
                      required
                      autoFocus
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="primary-fill"
                    className="h-12 w-full text-base"
                    disabled={forgotLoading}
                  >
                    {forgotLoading && <Loader2 size={16} className="mr-2 animate-spin" />}
                    Send reset link
                  </Button>
                </form>
              </>
            )
          ) : (
            <>
              <h2 className="text-xl font-semibold text-ink-primary">Sign in</h2>
              <p className="mb-5 mt-1.5 text-sm text-ink-secondary">
                Enter your credentials to access your workspace
              </p>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-[15px] font-medium text-ink-primary">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 text-base"
                    required
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
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
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
                      className="h-3.5 w-3.5 rounded border-[#ddd] accent-accent"
                    />
                    <span className="text-sm text-ink-secondary">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotMode(true);
                      setForgotEmail(email);
                    }}
                    className="text-sm text-accent hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <Button
                  type="submit"
                  variant="primary-fill"
                  className="h-12 w-full text-base"
                  disabled={loading}
                >
                  {loading && <Loader2 size={16} className="mr-2 animate-spin" />}
                  Sign in
                </Button>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="mt-8 text-center font-mono text-[11px] text-ink-tertiary">
          &copy; 2026 DraftMind &middot;{' '}
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
