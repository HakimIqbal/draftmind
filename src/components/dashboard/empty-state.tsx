'use client';

import Link from 'next/link';
import { FileText, LayoutTemplate, Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function EmptyState({ templateCount = 0 }: { templateCount?: number }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-lg">
      {/* Document illustration */}
      <div className="mb-lg">
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-ink-tertiary"
        >
          <rect
            x="25"
            y="15"
            width="70"
            height="90"
            rx="4"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <line x1="40" y1="35" x2="80" y2="35" stroke="currentColor" strokeWidth="1.5" />
          <line x1="40" y1="48" x2="75" y2="48" stroke="currentColor" strokeWidth="1.5" />
          <line x1="40" y1="61" x2="65" y2="61" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="85" cy="80" r="4" className="fill-accent" />
        </svg>
      </div>

      <h2 className="font-display text-2xl font-bold text-ink-primary">
        Your first PRD is a paste away
      </h2>
      <p className="mt-sm max-w-md text-center text-sm text-ink-secondary">
        Drop in meeting notes, a Jira epic, or just a rough idea. AI turns it into a structured,
        reviewable spec your team can ship from.
      </p>

      {/* 3 action cards */}
      <div className="mt-xl grid grid-cols-1 gap-md sm:grid-cols-3">
        <Link href="/prds/new">
          <Card className="cursor-pointer transition-colors hover:border-strong">
            <CardContent className="flex flex-col items-center gap-sm p-lg text-center">
              <FileText size={24} className="text-ink-secondary" />
              <p className="text-sm font-medium text-ink-primary">Draft from brief</p>
              <p className="text-xs text-ink-tertiary">Paste any text to start</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/prds/new?focus=template">
          <Card className="cursor-pointer transition-colors hover:border-strong">
            <CardContent className="flex flex-col items-center gap-sm p-lg text-center">
              <LayoutTemplate size={24} className="text-ink-secondary" />
              <p className="text-sm font-medium text-ink-primary">Start from template</p>
              <p className="font-mono text-xs text-ink-tertiary">{templateCount}+ templates</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/templates">
          <Card className="cursor-pointer transition-colors hover:border-strong">
            <CardContent className="flex flex-col items-center gap-sm p-lg text-center">
              <Upload size={24} className="text-ink-secondary" />
              <p className="text-sm font-medium text-ink-primary">Browse templates</p>
              <p className="font-mono text-xs text-ink-tertiary">{templateCount}+ templates</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
