import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'DraftMind',
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link
        href="/login"
        className="mb-8 inline-flex items-center gap-2 text-sm text-ink-secondary hover:text-ink-primary"
      >
        <ArrowLeft size={16} />
        Back to login
      </Link>

      <div className="mb-8 flex items-center gap-3">
        <Image src="/logo/logo.jpg" width={36} height={36} alt="DraftMind" className="rounded-lg" />
        <span className="text-lg font-bold text-ink-primary">DraftMind</span>
      </div>

      <h1 className="mb-2 font-display text-3xl font-bold text-ink-primary">Privacy Policy</h1>
      <p className="mb-8 font-mono text-xs text-ink-tertiary">Last updated: April 27, 2026</p>

      <div className="space-y-6 text-sm leading-relaxed text-ink-secondary">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink-primary">1. Information We Collect</h2>
          <p>
            When you use DraftMind, we collect information you provide directly, including your
            name, email address, and workspace data. We also collect PRD content you create,
            AI-generated outputs, and usage analytics to improve our service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink-primary">
            2. How We Use Your Information
          </h2>
          <p>We use your information to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Provide and maintain the DraftMind service</li>
            <li>Generate and refine PRD documents using AI providers</li>
            <li>Authenticate your identity and manage your account</li>
            <li>Send service-related notifications</li>
            <li>Improve and optimize our platform</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink-primary">3. AI Provider Data</h2>
          <p>
            When you use AI features, your PRD content is sent to third-party AI providers (such as
            Anthropic, OpenAI, or Google) based on your workspace configuration. API keys are
            encrypted at rest using AES-256-GCM and are never exposed to client-side code.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink-primary">
            4. Data Storage & Security
          </h2>
          <p>
            Your data is stored securely in Supabase (PostgreSQL) with Row Level Security (RLS)
            enforced on all tables. We implement industry-standard security measures including
            encrypted connections, secure authentication, and regular security audits.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink-primary">5. Data Sharing</h2>
          <p>
            We do not sell your personal data. We share data only with AI providers as necessary to
            deliver the service, and with workspace members based on your permission settings.
            Public share links expose only the specific PRD content you choose to share.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink-primary">6. Your Rights</h2>
          <p>
            You have the right to access, update, or delete your personal data at any time through
            your account settings. You can also export your PRD data in multiple formats (PDF, DOCX,
            Markdown, HTML).
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink-primary">7. Contact</h2>
          <p>
            For privacy-related inquiries, contact us at{' '}
            <a href="mailto:privacy@draftmind.web.id" className="text-accent hover:underline">
              privacy@draftmind.web.id
            </a>
          </p>
        </section>
      </div>

      <div className="mt-12 border-t border-subtle pt-6">
        <p className="font-mono text-[11px] text-ink-tertiary">
          &copy; 2026 DraftMind &middot;{' '}
          <Link href="/terms" className="hover:text-ink-secondary hover:underline">
            Terms of Service
          </Link>
        </p>
      </div>
    </div>
  );
}
