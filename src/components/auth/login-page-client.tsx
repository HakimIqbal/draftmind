'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { LogoTier1 } from '@/components/icons/logo-tier1';
import { LogoWithWordmark } from '@/components/icons/logo-with-wordmark';
import { GoogleIcon } from '@/components/icons/google-icon';
import { Avatar } from '@/components/ui/avatar';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

export function LoginPageClient() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  async function handleGoogleSignIn() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${appUrl}/api/auth/callback?next=/onboarding/step-1`,
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${appUrl}/api/auth/callback?next=/onboarding/step-1`,
      },
    });

    if (error) {
      toast.error(error.message);
    } else {
      setMagicLinkSent(true);
      toast.success('Magic link sent! Check your email.');
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel — brand */}
      <div className="hidden w-1/2 flex-col justify-between p-12 lg:flex">
        <div />
        <div className="flex flex-col items-center gap-8">
          <LogoTier1 size={240} />
          <div className="max-w-md text-center">
            <h1 className="font-display text-[56px] font-bold leading-[1.05] text-ink-primary">
              Think Less.
              <br />
              Draft Smarter.
            </h1>
            <p className="mt-4 text-lg text-ink-secondary">
              AI-powered Product Requirement Documents for modern teams.
            </p>
          </div>

          {/* Testimonial */}
          <div className="bg-bg-surface/50 mt-4 max-w-sm rounded-lg border border-subtle p-6">
            <p className="text-sm italic text-ink-secondary">
              &ldquo;DraftMind cut our PRD time by 60% — and the structure is consistent across the
              team.&rdquo;
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Avatar name="Maya Reyes" size="md" />
              <div>
                <p className="text-sm font-medium text-ink-primary">Maya R.</p>
                <p className="font-mono text-[11px] text-ink-tertiary">Senior PM at Northloop</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center font-mono text-[11px] text-ink-tertiary">
          Used by 1,200+ PMs &middot; 4.9/5 G2 &middot; SOC 2
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full flex-col items-center justify-center bg-bg-surface px-8 lg:w-1/2">
        <div className="w-full max-w-sm space-y-8">
          <div>
            <LogoWithWordmark className="mb-8" />
            <h2 className="text-2xl font-medium text-ink-primary">Welcome back</h2>
            <p className="mt-1 text-sm text-ink-secondary">Sign in to continue to your workspace</p>
          </div>

          {magicLinkSent ? (
            <div className="space-y-4 rounded-md border border-subtle p-6 text-center">
              <p className="text-sm text-ink-primary">Check your email</p>
              <p className="font-mono text-xs text-ink-tertiary">{email}</p>
              <p className="text-xs text-ink-secondary">
                Click the magic link to sign in.{' '}
                <a
                  href="http://127.0.0.1:54324"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline"
                >
                  Open Inbucket (local)
                </a>
              </p>
              <Button variant="ghost" size="sm" onClick={() => setMagicLinkSent(false)}>
                Try a different email
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Google OAuth */}
              <Button
                variant="primary-fill"
                className="w-full gap-2"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <GoogleIcon size={18} />
                )}
                Continue with Google
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="font-mono text-[11px] text-ink-tertiary">or with email</span>
                <Separator className="flex-1" />
              </div>

              {/* Magic link */}
              <form onSubmit={handleMagicLink} className="space-y-3">
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" variant="outline" className="w-full" disabled={loading}>
                  {loading && <Loader2 size={16} className="mr-2 animate-spin" />}
                  Send magic link
                </Button>
              </form>

              {/* SSO disabled */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      disabled
                      className="flex w-full items-center justify-center gap-2 rounded-md border border-subtle px-4 py-2 text-sm text-ink-quaternary opacity-60"
                    >
                      Continue with SSO
                      <Info size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Enterprise only — contact sales</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}

          {/* Footer */}
          <p className="pt-4 text-center font-mono text-[11px] text-ink-tertiary">
            &copy; 2026 DraftMind &middot; Privacy &middot; Terms &middot; Status
          </p>
        </div>
      </div>
    </div>
  );
}
