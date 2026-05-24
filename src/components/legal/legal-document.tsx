'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Globe2 } from 'lucide-react';

type Lang = 'en' | 'id';

type LegalSection = {
  title: string;
  body: readonly string[];
  bullets?: readonly string[];
};

type LegalCopy = {
  eyebrow: string;
  title: string;
  effectiveLabel: string;
  effectiveDate: string;
  summary: readonly string[];
  sections: readonly LegalSection[];
  footerNote: string;
};

type LegalDocumentProps = {
  kind: 'privacy' | 'terms';
  copies: Record<Lang, LegalCopy>;
};

const languageLabels: Record<Lang, string> = {
  en: 'English',
  id: 'Indonesia',
};

export function LegalDocument({ kind, copies }: LegalDocumentProps) {
  const [language, setLanguage] = useState<Lang>('en');
  const copy = copies[language];

  const relatedLink = useMemo(() => {
    if (kind === 'privacy')
      return {
        href: '/terms',
        label: language === 'en' ? 'Terms of Service' : 'Ketentuan Layanan',
      };
    return { href: '/privacy', label: language === 'en' ? 'Privacy Policy' : 'Kebijakan Privasi' };
  }, [kind, language]);

  return (
    <main className="min-h-screen bg-[#f7f4ed] text-[#191814]">
      <div className="border-b border-[#d8d0c3] bg-[#f7f4ed]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-[#5f5a50] transition hover:text-[#191814]"
          >
            <ArrowLeft size={16} />
            Back to sign in
          </Link>
          <Link
            href="/"
            className="font-display text-xl font-semibold tracking-tight text-[#191814]"
          >
            DraftMind
          </Link>
        </div>
      </div>

      <article className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[280px_minmax(0,760px)_220px] lg:py-16">
        <aside className="hidden lg:block">
          <div className="sticky top-8 space-y-8 text-sm text-[#6f675b]">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9a8f80]">
                Document
              </p>
              <p className="text-[#191814]">{copy.title}</p>
            </div>
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9a8f80]">
                {copy.effectiveLabel}
              </p>
              <p className="text-[#191814]">{copy.effectiveDate}</p>
            </div>
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9a8f80]">
                Related
              </p>
              <Link
                href={relatedLink.href}
                className="underline decoration-[#b8aa98] underline-offset-4 transition hover:text-[#b45309]"
              >
                {relatedLink.label}
              </Link>
            </div>
          </div>
        </aside>

        <div>
          <header className="border-b border-[#d8d0c3] pb-10">
            <p className="mb-5 text-[12px] font-semibold uppercase tracking-[0.28em] text-[#9a4f18]">
              {copy.eyebrow}
            </p>
            <h1 className="font-display text-[46px] font-semibold leading-[0.98] tracking-[-0.04em] text-[#191814] sm:text-[64px]">
              {copy.title}
            </h1>
            <div className="mt-8 grid gap-6 border-t border-[#d8d0c3] pt-6 sm:grid-cols-[1fr_auto] sm:items-start">
              <div className="space-y-2 text-sm text-[#5f5a50]">
                <p>
                  <span className="font-medium text-[#191814]">{copy.effectiveLabel}</span>{' '}
                  {copy.effectiveDate}
                </p>
                <p>{copy.summary[0]}</p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-[#cfc5b8] bg-[#fffaf2] p-1 text-sm shadow-sm">
                <Globe2 size={15} className="ml-2 text-[#9a8f80]" />
                {(['en', 'id'] as Lang[]).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className={`rounded-full px-3 py-1.5 transition ${
                      language === lang
                        ? 'bg-[#191814] text-white'
                        : 'text-[#5f5a50] hover:bg-[#efe6d8] hover:text-[#191814]'
                    }`}
                    aria-pressed={language === lang}
                  >
                    {languageLabels[lang]}
                  </button>
                ))}
              </div>
            </div>
          </header>

          <section className="space-y-5 border-b border-[#d8d0c3] py-9 text-[17px] leading-8 text-[#3f3a33]">
            {copy.summary.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </section>

          <div className="divide-y divide-[#d8d0c3]">
            {copy.sections.map((section, index) => (
              <section key={section.title} id={`section-${index + 1}`} className="scroll-mt-8 py-9">
                <h2 className="font-display text-2xl font-semibold tracking-[-0.02em] text-[#191814]">
                  {index + 1}. {section.title}
                </h2>
                <div className="mt-5 space-y-4 text-[16px] leading-8 text-[#3f3a33]">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {section.bullets && (
                    <ul className="ml-5 list-disc space-y-2 marker:text-[#b45309]">
                      {section.bullets.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))}
          </div>

          <footer className="border-t border-[#d8d0c3] py-10 text-sm leading-6 text-[#6f675b]">
            <p>{copy.footerNote}</p>
            <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-[#9a8f80]">
              © {new Date().getFullYear()} DraftMind
            </p>
          </footer>
        </div>

        <aside className="hidden xl:block">
          <nav className="sticky top-8 max-h-[calc(100vh-4rem)] overflow-auto text-sm">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9a8f80]">
              On this page
            </p>
            <ol className="space-y-3 text-[#6f675b]">
              {copy.sections.map((section, index) => (
                <li key={section.title}>
                  <a href={`#section-${index + 1}`} className="transition hover:text-[#b45309]">
                    {index + 1}. {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>
      </article>
    </main>
  );
}
