import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-static';
export const metadata = {
  title: 'Terms of Service · DraftMind',
};

const EFFECTIVE_DATE = 'May 23, 2026';
const LEGAL_EMAIL = 'legal@draftmind.web.id';
const SUPPORT_EMAIL = 'support@draftmind.web.id';

type Section = {
  id: string;
  title: string;
};

const sections: Section[] = [
  { id: 'acceptance', title: '1. Acceptance of Terms' },
  { id: 'service-description', title: '2. Service Description' },
  { id: 'accounts', title: '3. Accounts & Administration' },
  { id: 'acceptable-use', title: '4. Acceptable Use' },
  { id: 'content-ownership', title: '5. Content Ownership & License' },
  { id: 'ai-content', title: '6. AI-Generated Content' },
  { id: 'third-party', title: '7. Third-Party AI Providers' },
  { id: 'service-availability', title: '8. Service Availability' },
  { id: 'security', title: '9. Security & Responsibility' },
  { id: 'dmca', title: '10. Intellectual Property Complaints' },
  { id: 'termination', title: '11. Suspension & Termination' },
  { id: 'fees', title: '12. Fees & Free Tier' },
  { id: 'disclaimer', title: '13. Disclaimers' },
  { id: 'liability', title: '14. Limitation of Liability' },
  { id: 'indemnity', title: '15. Indemnity' },
  { id: 'governing-law', title: '16. Governing Law' },
  { id: 'dispute-resolution', title: '17. Dispute Resolution' },
  { id: 'changes', title: '18. Changes to Terms' },
  { id: 'contact', title: '19. Contact' },
];

export default function TermsPage() {
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

      <h1 className="mb-2 font-display text-3xl font-bold text-ink-primary">Terms of Service</h1>
      <p className="mb-2 font-mono text-xs text-ink-tertiary">
        Effective from <span className="text-ink-secondary">{EFFECTIVE_DATE}</span>
      </p>
      <p className="mb-10 max-w-prose text-sm leading-6 text-ink-secondary">
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of DraftMind. By
        using the service, you agree to be bound by these Terms.
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
        <Section id="acceptance" title="1. Acceptance of Terms">
          <p>
            By accessing or using DraftMind, you confirm that you have read, understood, and agree
            to be bound by these Terms and our{' '}
            <Link href="/privacy" className="text-accent hover:underline">
              Privacy Policy
            </Link>
            . If you do not agree, you must not use the service.
          </p>
        </Section>

        <Section id="service-description" title="2. Service Description">
          <p>
            DraftMind is an AI-assisted Product Requirement Document (PRD) workspace. It provides
            editing, AI generation and review, sharing, and collaboration features for product
            teams. The service is offered &ldquo;as a service&rdquo; over the internet.
          </p>
        </Section>

        <Section id="accounts" title="3. Accounts & Administration">
          <p>
            DraftMind workspaces are managed by a workspace administrator. Accounts are created by
            an administrator and are not available through public self-service registration. You
            agree to:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Provide accurate information when invited or when updating your profile.</li>
            <li>Keep your credentials confidential and not share them with anyone.</li>
            <li>
              Notify us promptly at{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-accent hover:underline">
                {SUPPORT_EMAIL}
              </a>{' '}
              if you suspect unauthorized access to your account.
            </li>
          </ul>
          <p>
            Workspace administrators are responsible for managing member access, role assignments,
            and offboarding within their workspace.
          </p>
        </Section>

        <Section id="acceptable-use" title="4. Acceptable Use">
          <p>You agree not to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              Use the service to generate, store, or distribute unlawful, deceptive, or infringing
              content.
            </li>
            <li>Attempt to circumvent security, rate limits, or access controls.</li>
            <li>Disrupt or interfere with the integrity or performance of the service.</li>
            <li>
              Probe, scan, or test the vulnerability of any system without prior written consent.
            </li>
            <li>
              Reverse engineer, decompile, or attempt to extract source code or proprietary models,
              except where applicable law expressly permits.
            </li>
            <li>
              Use the service to build a competing product through scraping or systematic extraction
              of content.
            </li>
            <li>Share, resell, or expose your AI provider API keys outside your workspace.</li>
          </ul>
          <p>
            We may suspend or terminate access if we reasonably believe your use violates this
            section or creates risk to other users.
          </p>
        </Section>

        <Section id="content-ownership" title="5. Content Ownership & License">
          <p>
            You retain ownership of all PRD content, templates, comments, and other materials you
            create or upload in DraftMind (&ldquo;Workspace Content&rdquo;). To operate the service,
            you grant DraftMind a limited, worldwide, non-exclusive, royalty-free license to host,
            copy, transmit, render, and process Workspace Content solely for the purpose of
            providing the service to you and your workspace.
          </p>
          <p>
            We do not claim ownership of Workspace Content and do not use it to train third-party or
            our own AI models.
          </p>
        </Section>

        <Section id="ai-content" title="6. AI-Generated Content">
          <p>
            AI-generated outputs are provided &ldquo;as is&rdquo; and may contain inaccuracies or
            omissions. You are responsible for reviewing, editing, and validating any AI-generated
            content before relying on it for business or product decisions. DraftMind does not
            guarantee the accuracy, completeness, or fitness of any AI-generated output for a
            particular purpose.
          </p>
        </Section>

        <Section id="third-party" title="7. Third-Party AI Providers">
          <p>
            DraftMind integrates with third-party AI providers selected by your workspace
            administrator. Your use of those providers is subject to their respective terms and
            privacy policies. You are responsible for providing valid API keys and ensuring your use
            complies with each provider&apos;s acceptable use policy and applicable law.
          </p>
        </Section>

        <Section id="service-availability" title="8. Service Availability">
          <p>
            We aim to keep DraftMind available and performant. We do not guarantee uninterrupted
            access. We may temporarily suspend the service for maintenance, upgrades, or to address
            security or integrity concerns. Where reasonably possible, we will provide advance
            notice of planned maintenance.
          </p>
        </Section>

        <Section id="security" title="9. Security & Responsibility">
          <p>
            We implement industry-standard administrative, technical, and organizational safeguards
            to protect workspace data, including encryption in transit, encrypted backups, encrypted
            AI provider keys (AES-256-GCM), and Row Level Security on data tables. You are
            responsible for the security of your own account, devices, and any third-party API keys
            you configure.
          </p>
        </Section>

        <Section id="dmca" title="10. Intellectual Property Complaints">
          <p>
            If you believe content available through DraftMind infringes your intellectual property
            rights, send a notice to{' '}
            <a href={`mailto:${LEGAL_EMAIL}`} className="text-accent hover:underline">
              {LEGAL_EMAIL}
            </a>{' '}
            with: (a) identification of the work allegedly infringed, (b) the location of the
            allegedly infringing material, (c) your contact information, (d) a statement that you
            have a good-faith belief that the use is not authorized, and (e) a statement under
            penalty of perjury that the notice is accurate and you are authorized to act.
          </p>
        </Section>

        <Section id="termination" title="11. Suspension & Termination">
          <p>
            You or your workspace administrator may end your use of DraftMind at any time. We may
            suspend or terminate access if you breach these Terms, if continued access poses a
            security risk, or if required by law. On termination:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>You may request export of your Workspace Content prior to deletion.</li>
            <li>
              Account data is hard-deleted within 30 days of the deletion request, as described in
              our{' '}
              <Link href="/privacy" className="text-accent hover:underline">
                Privacy Policy
              </Link>
              .
            </li>
            <li>
              Encrypted backups containing residual data may persist for up to 7 additional days
              before being overwritten.
            </li>
          </ul>
        </Section>

        <Section id="fees" title="12. Fees & Free Tier">
          <p>
            Some plans of DraftMind are offered free of charge with usage limits. Paid plans and
            add-ons, where offered, are subject to the pricing displayed at the time of order. We
            may adjust pricing with reasonable prior notice. We do not provide availability or
            performance commitments on free-tier usage.
          </p>
        </Section>

        <Section id="disclaimer" title="13. Disclaimers">
          <p>
            The service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without
            warranties of any kind, whether express or implied, including warranties of
            merchantability, fitness for a particular purpose, non-infringement, and accuracy of
            AI-generated content. Use of the service is at your own risk.
          </p>
        </Section>

        <Section id="liability" title="14. Limitation of Liability">
          <p>
            To the maximum extent permitted by law, DraftMind, its operators, and contributors shall
            not be liable for any indirect, incidental, special, consequential, or punitive damages,
            or for loss of profits, revenue, data, or business opportunities, arising out of or
            related to your use of the service. Our aggregate liability for any claim arising from
            the service shall not exceed the greater of (a) the amount you paid us in the 12 months
            preceding the event giving rise to the claim, or (b) IDR 1,000,000.
          </p>
        </Section>

        <Section id="indemnity" title="15. Indemnity">
          <p>
            You agree to defend and indemnify DraftMind and its operators against any third- party
            claims, damages, and expenses (including reasonable legal fees) arising from (a) your
            violation of these Terms, (b) your Workspace Content, or (c) your misuse of the service.
          </p>
        </Section>

        <Section id="governing-law" title="16. Governing Law">
          <p>
            These Terms are governed by, and construed in accordance with, the laws of the Republic
            of Indonesia, without regard to conflict of laws principles.
          </p>
        </Section>

        <Section id="dispute-resolution" title="17. Dispute Resolution">
          <p>
            Any dispute, controversy, or claim arising out of or relating to these Terms or the
            service shall first be addressed through good-faith negotiation. If the parties cannot
            resolve the dispute within 30 days, it shall be finally settled by arbitration
            administered by <strong>Badan Arbitrase Nasional Indonesia (BANI)</strong> in Jakarta,
            in accordance with its then-current rules. The arbitration shall be conducted in
            Indonesian or English at the parties&apos; option, and the award shall be final and
            binding.
          </p>
          <p>
            For matters not subject to arbitration, the parties submit to the exclusive jurisdiction
            of the District Court of South Jakarta (Pengadilan Negeri Jakarta Selatan).
          </p>
        </Section>

        <Section id="changes" title="18. Changes to Terms">
          <p>
            We may update these Terms from time to time. Material changes will be communicated
            through the service or by email to workspace administrators with reasonable notice
            before they take effect. Continued use of the service after the effective date
            constitutes acceptance of the updated Terms.
          </p>
        </Section>

        <Section id="contact" title="19. Contact">
          <p>
            For legal notices, contact{' '}
            <a href={`mailto:${LEGAL_EMAIL}`} className="text-accent hover:underline">
              {LEGAL_EMAIL}
            </a>
            . For general questions, contact{' '}
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
          <Link href="/privacy" className="hover:text-ink-secondary hover:underline">
            Privacy Policy
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
