'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

export function HomeQuickInput() {
  const [brief, setBrief] = useState('');
  const router = useRouter();

  function handleDraft() {
    if (!brief.trim()) return;
    router.push(`/prds/new?brief=${encodeURIComponent(brief.trim())}`);
  }

  return (
    <div>
      <p className="mb-2 text-[13px] font-medium text-[#1a1a1a]">What are you working on?</p>
      <div className="flex gap-2">
        <input
          className="focus:ring-accent/30 h-10 flex-1 rounded-lg border border-[#e5e5e3] bg-[#fafaf9] px-3 text-[13px] text-[#1a1a1a] placeholder:text-[#bbb] focus:border-accent focus:bg-white focus:outline-none focus:ring-1"
          placeholder="Describe your product idea or problem..."
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleDraft();
          }}
        />
        <button
          onClick={handleDraft}
          disabled={!brief.trim()}
          className="inline-flex h-10 items-center gap-1 rounded-lg bg-[#1a1a1a] px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-30"
        >
          Draft PRD
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
