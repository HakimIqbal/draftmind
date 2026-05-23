import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, LifeBuoy, ShieldCheck, KeyRound } from 'lucide-react';

export const dynamic = 'force-static';
export const metadata = {
  title: 'Forgot Password · DraftMind',
};

export default function ForgotPasswordPage() {
  const supportEmail = 'support@draftmind.web.id';
  const subject = encodeURIComponent('Password reset assistance');
  const body = encodeURIComponent(
    [
      'Hello DraftMind Support,',
      '',
      'I need help regaining access to my account.',
      '',
      'Workspace name (if known):',
      'Account email:',
      'Issue summary:',
      '',
      'Thank you.',
    ].join('\n'),
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-canvas px-4 py-12">
      <div className="w-full max-w-[560px]">
        <div className="mb-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-[13px] text-[#999] hover:text-[#555]"
          >
            <ArrowLeft size={13} />
            Back to sign in
          </Link>
        </div>

        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/logo/logo.jpg"
            width={84}
            height={84}
            alt="DraftMind"
            className="mb-4 rounded-2xl shadow-md"
            priority
          />
          <h1 className="font-display text-3xl font-bold text-ink-primary">
            Forgot your password?
          </h1>
          <p className="mt-3 max-w-[44ch] text-sm leading-6 text-ink-secondary">
            DraftMind accounts are managed by a workspace administrator. For security reasons,
            password resets are handled by an admin rather than through self-service email reset.
          </p>
        </div>

        <div className="rounded-2xl border border-subtle bg-bg-surface p-8 shadow-sm">
          <div className="grid gap-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-amber-100 p-2 text-amber-700">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-ink-primary">
                    Why this works differently
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-ink-secondary">
                    DraftMind uses admin-managed access. This helps protect workspace data and
                    prevents unauthorized password-reset attempts.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-subtle bg-white p-5">
              <div className="flex items-start gap-3">
                <div className="bg-accent/10 mt-0.5 rounded-lg p-2 text-accent">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-ink-primary">What to do next</h2>
                  <ol className="mt-2 list-decimal space-y-2 pl-4 text-sm leading-6 text-ink-secondary">
                    <li>Contact your workspace administrator and ask for a password reset.</li>
                    <li>Sign in with the temporary password you receive.</li>
                    <li>Set a new password when DraftMind prompts you to continue.</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-subtle bg-white p-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-sky-100 p-2 text-sky-700">
                  <LifeBuoy size={18} />
                </div>
                <div className="w-full">
                  <h2 className="text-sm font-semibold text-ink-primary">
                    Need help finding the right admin?
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-ink-secondary">
                    If you are not sure who manages your workspace, contact DraftMind support and
                    include your account email plus any workspace details you know.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <a
                      href={`mailto:${supportEmail}?subject=${subject}&body=${body}`}
                      className="inline-flex h-11 items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-white transition hover:opacity-95"
                    >
                      Email support
                    </a>
                    <a
                      href={`mailto:${supportEmail}`}
                      className="inline-flex h-11 items-center justify-center rounded-lg border border-subtle px-4 text-sm font-medium text-ink-primary transition hover:bg-black/[0.02]"
                    >
                      {supportEmail}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center font-mono text-[11px] text-ink-tertiary">
          &copy; {new Date().getFullYear()} DraftMind &middot;{' '}
          <Link
            href="/privacy"
            className="underline-offset-2 hover:text-ink-secondary hover:underline"
          >
            Privacy
          </Link>{' '}
          &middot;{' '}
          <Link
            href="/terms"
            className="underline-offset-2 hover:text-ink-secondary hover:underline"
          >
            Terms
          </Link>
        </p>
      </div>
    </div>
  );
}
