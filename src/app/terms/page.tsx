import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'DraftMind',
};

export default function TermsPage() {
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

      <h1 className="mb-2 font-display text-3xl font-bold text-ink-primary">Terms of Service</h1>
      <p className="mb-8 font-mono text-xs text-ink-tertiary">Last updated: April 27, 2026</p>

      <div className="space-y-6 text-sm leading-relaxed text-ink-secondary">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink-primary">1. Acceptance of Terms</h2>
          <p>
            By accessing or using DraftMind, you agree to be bound by these Terms of Service. If you
            do not agree, please do not use the service. DraftMind is an AI-powered Product
            Requirement Document generator designed for product teams.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink-primary">2. Account Registration</h2>
          <p>
            You must provide accurate and complete information when creating an account. You are
            responsible for maintaining the confidentiality of your account credentials and for all
            activities that occur under your account. Each workspace administrator is responsible
            for managing member access and permissions.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink-primary">3. Use of Service</h2>
          <p>You agree to use DraftMind only for lawful purposes. You may not:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Use the service to generate harmful, misleading, or illegal content</li>
            <li>Attempt to bypass security measures or access restrictions</li>
            <li>Interfere with the operation of the service or its infrastructure</li>
            <li>Share your API keys or account credentials with unauthorized parties</li>
            <li>Reverse-engineer, decompile, or disassemble any part of the service</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink-primary">4. Content Ownership</h2>
          <p>
            You retain full ownership of all PRD content you create using DraftMind. AI-generated
            content is provided as a starting point and becomes your property upon generation. We do
            not claim ownership of your documents, templates, or workspace data.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink-primary">5. AI-Generated Content</h2>
          <p>
            AI-generated PRD content is provided &ldquo;as is&rdquo; without warranty of accuracy or
            completeness. You are responsible for reviewing, editing, and validating all
            AI-generated content before using it in production. DraftMind is not liable for
            decisions made based on AI-generated documents.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink-primary">
            6. Third-Party AI Providers
          </h2>
          <p>
            DraftMind integrates with third-party AI providers. Your use of these providers is
            subject to their respective terms of service. You are responsible for providing valid
            API keys and ensuring compliance with each provider&apos;s usage policies.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink-primary">7. Service Availability</h2>
          <p>
            We strive to maintain high availability but do not guarantee uninterrupted access. We
            reserve the right to modify, suspend, or discontinue any part of the service with
            reasonable notice. Scheduled maintenance will be communicated in advance when possible.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink-primary">
            8. Limitation of Liability
          </h2>
          <p>
            DraftMind is provided &ldquo;as is&rdquo; without warranties of any kind. To the maximum
            extent permitted by law, we shall not be liable for any indirect, incidental, or
            consequential damages arising from your use of the service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink-primary">9. Changes to Terms</h2>
          <p>
            We may update these terms from time to time. We will notify you of significant changes
            via email or in-app notification. Continued use of the service after changes constitutes
            acceptance of the updated terms.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink-primary">10. Contact</h2>
          <p>
            For questions about these terms, contact us at{' '}
            <a href="mailto:legal@draftmind.web.id" className="text-accent hover:underline">
              legal@draftmind.web.id
            </a>
          </p>
        </section>
      </div>

      <div className="mt-12 border-t border-subtle pt-6">
        <p className="font-mono text-[11px] text-ink-tertiary">
          &copy; 2026 DraftMind &middot;{' '}
          <Link href="/privacy" className="hover:text-ink-secondary hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
