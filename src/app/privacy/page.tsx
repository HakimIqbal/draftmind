import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-static';
export const metadata = {
  title: 'Privacy Policy · DraftMind',
};

const EFFECTIVE_DATE = 'May 23, 2026';
const PRIVACY_EMAIL = 'privacy@draftmind.web.id';
const SUPPORT_EMAIL = 'support@draftmind.web.id';

type Section = {
  id: string;
  title: string;
};

const sections: Section[] = [
  { id: 'overview', title: '1. Overview' },
  { id: 'information-we-collect', title: '2. Information We Collect' },
  { id: 'how-we-use-information', title: '3. How We Use Information' },
  { id: 'legal-basis', title: '4. Legal Basis for Processing' },
  { id: 'ai-providers', title: '5. AI Provider Processing' },
  { id: 'cookies', title: '6. Cookies & Local Storage' },
  { id: 'storage-security', title: '7. Storage & Security' },
  { id: 'sharing', title: '8. Sharing & Disclosure' },
  { id: 'subprocessors', title: '9. Subprocessors' },
  { id: 'international-transfers', title: '10. International Data Transfers' },
  { id: 'retention', title: '11. Data Retention' },
  { id: 'your-rights', title: '12. Your Rights' },
  { id: 'account-deletion', title: '13. Account Deletion' },
  { id: 'children', title: '14. Children & Minimum Age' },
  { id: 'breach-notification', title: '15. Breach Notification' },
  { id: 'changes', title: '16. Changes to This Policy' },
  { id: 'contact', title: '17. Contact' },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/login"
        className="mb-8 inline-flex items-center gap-2 text-sm text-ink-secondary hover:text-ink-primary"
      >
        <ArrowLeft size={16} />
        Back to sign in
      </Link>

      <div className="mb-8 flex items-center gap-3">
        <Image src="/logo/logo.jpg" width={36} height={36} alt="DraftMind" className="rounded-lg" />
        <span className="text-lg font-bold text-ink-primary">DraftMind</span>
      </div>

      <h1 className="mb-2 font-display text-3xl font-bold text-ink-primary">Privacy Policy</h1>
      <p className="mb-2 font-mono text-xs text-ink-tertiary">
        Effective from <span className="text-ink-secondary">{EFFECTIVE_DATE}</span>
      </p>
      <p className="mb-10 max-w-prose text-sm leading-6 text-ink-secondary">
        This Privacy Policy explains how DraftMind (&ldquo;we&rdquo;, &ldquo;us&rdquo;) collects,
        uses, shares, and protects information when you use our AI-assisted product documentation
        service.
      </p>

      <nav
        aria-label="Table of contents"
        className="mb-10 rounded-xl border border-subtle bg-bg-surface p-5"
      >
        <p className="mb-3 font-mono text-[11px] uppercase tracking-wide text-ink-tertiary">
          On this page
        </p>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="text-sm text-ink-secondary underline-offset-2 hover:text-accent hover:underline"
              >
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-8 text-sm leading-6 text-ink-secondary">
        <Section id="overview" title="1. Overview">
          <p>
            DraftMind is an AI-assisted Product Requirement Document (PRD) workspace for product
            teams. We provide editor tools, AI generation features, and collaboration spaces. This
            policy describes our practices as a data controller for the workspace data you and your
            team submit through the service.
          </p>
          <p>
            DraftMind workspaces are administered by a workspace administrator. Accounts are created
            and managed by that administrator rather than by self-service registration.
          </p>
        </Section>

        <Section id="information-we-collect" title="2. Information We Collect">
          <p>We collect the following categories of information:</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-6">
            <li>
              <strong>Account data:</strong> name, email address, profile image, role, workspace
              membership, and any optional profile fields you set.
            </li>
            <li>
              <strong>Authentication data:</strong> credentials handled by our authentication
              provider, session tokens, and login event logs (success, failure, sign-out).
            </li>
            <li>
              <strong>Workspace content:</strong> PRDs, templates, comments, attachments,
              AI-generated drafts, share links, and other content you create.
            </li>
            <li>
              <strong>Usage data:</strong> feature actions, AI prompt metadata, error logs, browser
              type, IP address, and timestamps required to operate the service.
            </li>
            <li>
              <strong>Provider configuration:</strong> AI provider API keys you configure for your
              workspace. Keys are encrypted at rest using AES-256-GCM and are never returned to the
              browser after they are stored.
            </li>
          </ul>
        </Section>

        <Section id="how-we-use-information" title="3. How We Use Information">
          <p>We use information to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Provide, secure, and maintain the DraftMind service.</li>
            <li>
              Generate, refine, and review PRDs using third-party AI providers based on your
              workspace configuration.
            </li>
            <li>
              Authenticate users, manage access, enforce permissions, and detect abuse or fraud.
            </li>
            <li>
              Communicate operational notices (security, password resets initiated by an admin,
              service incidents).
            </li>
            <li>
              Improve and debug the platform, and produce aggregated, non-identifying analytics.
            </li>
          </ul>
        </Section>

        <Section id="legal-basis" title="4. Legal Basis for Processing">
          <p>
            Where applicable law requires a legal basis, we rely on the following bases under
            Indonesia&apos;s Personal Data Protection Law (UU No. 27/2022) and analogous regimes
            such as the EU GDPR:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              <strong>Contract:</strong> to deliver the service to your workspace.
            </li>
            <li>
              <strong>Legitimate interests:</strong> to secure the service, prevent abuse, and
              improve product quality.
            </li>
            <li>
              <strong>Consent:</strong> for optional features such as opt-in analytics or marketing
              communications, where applicable.
            </li>
            <li>
              <strong>Legal obligation:</strong> to comply with binding requests from competent
              authorities.
            </li>
          </ul>
        </Section>

        <Section id="ai-providers" title="5. AI Provider Processing">
          <p>
            When you use AI features, DraftMind transmits the relevant PRD content, prompts, and
            metadata to the AI provider configured for your workspace (for example Anthropic,
            OpenAI, or Google). Each provider processes data under its own terms and privacy policy.
            We do not share data with providers other than those you select.
          </p>
          <p>
            Your AI provider API keys are encrypted at rest and used only to perform requests on
            your behalf. We do not use your PRD content to train third-party models or our own
            models.
          </p>
        </Section>

        <Section id="cookies" title="6. Cookies & Local Storage">
          <p>DraftMind uses a small set of strictly functional storage items:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              <strong>Authentication cookies</strong> (set by our auth provider) to keep you signed
              in.
            </li>
            <li>
              <strong>&ldquo;Remember me&rdquo; preference</strong> stored in your browser to
              control whether the session persists across browser restarts (up to 7 days).
            </li>
            <li>
              <strong>Workspace UI preferences</strong> (theme, sidebar state) stored locally in
              your browser.
            </li>
          </ul>
          <p>
            DraftMind does not currently use advertising, retargeting, or cross-site tracking
            cookies.
          </p>
        </Section>

        <Section id="storage-security" title="7. Storage & Security">
          <p>
            Workspace data is stored in Supabase (PostgreSQL) with Row Level Security enforced on
            all tables that contain user data. We use TLS in transit, encrypted backups, scoped
            service-role keys, and admin access auditing. AI provider keys are encrypted at rest
            using AES-256-GCM with keys stored separately from the application database.
          </p>
        </Section>

        <Section id="sharing" title="8. Sharing & Disclosure">
          <p>
            We do not sell personal data. We share information only as needed to operate the
            service:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>With subprocessors listed below to deliver core functionality.</li>
            <li>
              With workspace members, based on the permissions you configure inside DraftMind.
            </li>
            <li>
              With recipients of public share links you choose to create, limited to the specific
              PRD content you share.
            </li>
            <li>
              With competent authorities where required by law, subject to a careful review of every
              request.
            </li>
          </ul>
        </Section>

        <Section id="subprocessors" title="9. Subprocessors">
          <p>
            We currently rely on the following subprocessors. We update this list whenever a
            material change occurs.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              <strong>Supabase</strong> &mdash; managed PostgreSQL, authentication, file storage
              (Singapore region).
            </li>
            <li>
              <strong>Cloudflare</strong> &mdash; DNS, edge proxying, email routing for our support
              inboxes.
            </li>
            <li>
              <strong>Vercel / VPS provider</strong> &mdash; compute and edge delivery for the
              DraftMind application.
            </li>
            <li>
              <strong>AI providers</strong> selected by your workspace (for example Anthropic,
              OpenAI, Google) &mdash; PRD content is transmitted only when you trigger an AI
              feature.
            </li>
          </ul>
        </Section>

        <Section id="international-transfers" title="10. International Data Transfers">
          <p>
            Our primary database region is Singapore. Selected subprocessors and AI providers may
            process data in the United States or other regions. Where transfers occur, we rely on
            contractual safeguards and provider commitments to maintain a level of protection
            comparable to your home jurisdiction.
          </p>
        </Section>

        <Section id="retention" title="11. Data Retention">
          <p>
            We retain data only for as long as needed to provide the service or comply with our
            obligations. Specifically:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              <strong>Workspace content & profiles:</strong> retained for the lifetime of the
              account.
            </li>
            <li>
              <strong>Deleted accounts:</strong> hard-deleted within 30 days after the deletion
              request, except where law requires longer retention.
            </li>
            <li>
              <strong>Audit and security logs:</strong> retained for up to 12 months.
            </li>
            <li>
              <strong>AI usage logs:</strong> retained for up to 6 months for billing and debugging.
            </li>
            <li>
              <strong>Encrypted backups:</strong> retained by our infrastructure provider for up to
              7 days.
            </li>
          </ul>
        </Section>

        <Section id="your-rights" title="12. Your Rights">
          <p>Subject to applicable law, you have the right to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Access the personal data we hold about you.</li>
            <li>Request correction of inaccurate or outdated information.</li>
            <li>Request deletion of your account and associated data.</li>
            <li>Export your PRDs in PDF, DOCX, Markdown, or HTML format.</li>
            <li>Withdraw consent for optional processing at any time.</li>
            <li>Lodge a complaint with a competent data protection authority.</li>
          </ul>
          <p>
            To exercise any of these rights, contact{' '}
            <a href={`mailto:${PRIVACY_EMAIL}`} className="text-accent hover:underline">
              {PRIVACY_EMAIL}
            </a>
            . We respond within 30 days.
          </p>
        </Section>

        <Section id="account-deletion" title="13. Account Deletion">
          <p>
            Workspace administrators can disable or delete member accounts from the admin dashboard.
            Individual users can request deletion of their own account by emailing{' '}
            <a href={`mailto:${PRIVACY_EMAIL}`} className="text-accent hover:underline">
              {PRIVACY_EMAIL}
            </a>
            . Hard deletion completes within 30 days. After that period, residual data may remain
            only inside encrypted backups for up to 7 days before being overwritten.
          </p>
        </Section>

        <Section id="children" title="14. Children & Minimum Age">
          <p>
            DraftMind is not directed at children under 13 years of age. We do not knowingly collect
            personal data from children under 13. If we learn that we have collected such data, we
            will delete it. Workspace administrators are responsible for ensuring invited users meet
            this minimum age requirement.
          </p>
        </Section>

        <Section id="breach-notification" title="15. Breach Notification">
          <p>
            If a personal data breach is likely to result in significant risk to your rights, we
            will notify affected users and the relevant authority without undue delay and, where
            feasible, within 72 hours of becoming aware of the incident. Notifications will describe
            the nature of the breach, likely consequences, and the measures we are taking in
            response.
          </p>
        </Section>

        <Section id="changes" title="16. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. Significant changes will be
            communicated through the service or by email to workspace administrators. The
            &ldquo;Effective from&rdquo; date at the top of this page reflects the latest revision.
          </p>
        </Section>

        <Section id="contact" title="17. Contact">
          <p>
            For privacy questions, data subject requests, or breach disclosures, contact{' '}
            <a href={`mailto:${PRIVACY_EMAIL}`} className="text-accent hover:underline">
              {PRIVACY_EMAIL}
            </a>
            . For general support, contact{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-accent hover:underline">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </Section>
      </div>

      <div className="mt-12 border-t border-subtle pt-6">
        <p className="font-mono text-[11px] text-ink-tertiary">
          &copy; {new Date().getFullYear()} DraftMind &middot;{' '}
          <Link href="/terms" className="hover:text-ink-secondary hover:underline">
            Terms of Service
          </Link>
        </p>
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-3 text-lg font-semibold text-ink-primary">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
