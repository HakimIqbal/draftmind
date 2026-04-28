'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function HomeQuickInput() {
  const [brief, setBrief] = useState('');
  const router = useRouter();

  function handleDraft() {
    if (!brief.trim()) return;
    router.push(`/prds/new?brief=${encodeURIComponent(brief.trim())}`);
  }

  return (
    <div className="space-y-xs">
      <span className="font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
        Start with AI
      </span>
      <Input
        className="h-11 text-sm"
        placeholder="Reduce cart abandonment by 15% with inline address validation..."
        value={brief}
        onChange={(e) => setBrief(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleDraft();
        }}
      />
      <div className="flex items-center gap-sm">
        <Button variant="primary-fill" size="sm" onClick={handleDraft}>
          Draft PRD
        </Button>
        <Link
          href="/templates"
          className="font-mono text-xs text-ink-tertiary transition-colors hover:text-ink-secondary"
        >
          From template
        </Link>
      </div>
    </div>
  );
}
