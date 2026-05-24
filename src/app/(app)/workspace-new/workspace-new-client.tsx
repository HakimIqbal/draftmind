'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const INDUSTRY_OPTIONS = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'E-commerce',
  'Media',
  'Gaming',
  'Consulting',
  'Government',
  'Other',
];
const TEAM_SIZE_OPTIONS = ['1-5', '6-20', '21-50', '51-200', '200+'];

export function WorkspaceNewClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [customIndustry, setCustomIndustry] = useState('');
  const [teamSize, setTeamSize] = useState('');

  const isOther = industry === 'Other';

  function handleCreate() {
    if (!name.trim()) return;
    const finalIndustry = isOther ? customIndustry.trim() : industry;

    startTransition(async () => {
      const res = await fetch('/api/workspaces/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          industry: finalIndustry || undefined,
          team_size: teamSize || undefined,
        }),
      });

      const data = (await res.json().catch(() => null)) as {
        workspaceId?: string;
        error?: string;
      } | null;

      if (!res.ok || data?.error) {
        toast.error(data?.error ?? 'Failed to create workspace');
        return;
      }

      toast.success('Workspace created');
      router.push('/dashboard');
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-md px-8 py-24">
      <h1 className="text-[22px] font-bold text-[#1a1a1a]">Create workspace</h1>
      <p className="mt-2 text-[13px] text-[#888]">Set up workspace to start using DraftMind.</p>

      <div className="mt-8 space-y-4">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[#1a1a1a]">
            Workspace name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Acme"
            className="focus:ring-accent/30 h-11 w-full rounded-xl border border-[#e5e5e3] bg-white px-3 text-[13px] text-[#1a1a1a] focus:border-accent focus:outline-none focus:ring-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[#1a1a1a]">Industry</label>
            <select
              value={industry}
              onChange={(e) => {
                setIndustry(e.target.value);
                if (e.target.value !== 'Other') setCustomIndustry('');
              }}
              className="focus:ring-accent/30 h-11 w-full rounded-xl border border-[#e5e5e3] bg-white px-3 text-[13px] text-[#1a1a1a] focus:border-accent focus:outline-none focus:ring-1"
            >
              <option value="">Select...</option>
              {INDUSTRY_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            {isOther && (
              <input
                value={customIndustry}
                onChange={(e) => setCustomIndustry(e.target.value)}
                placeholder="Enter your industry..."
                className="focus:ring-accent/30 mt-2 h-11 w-full rounded-xl border border-[#e5e5e3] bg-white px-3 text-[13px] text-[#1a1a1a] placeholder:text-[#bbb] focus:border-accent focus:outline-none focus:ring-1"
              />
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[#1a1a1a]">Team size</label>
            <select
              value={teamSize}
              onChange={(e) => setTeamSize(e.target.value)}
              className="focus:ring-accent/30 h-11 w-full rounded-xl border border-[#e5e5e3] bg-white px-3 text-[13px] text-[#1a1a1a] focus:border-accent focus:outline-none focus:ring-1"
            >
              <option value="">Select...</option>
              {TEAM_SIZE_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o} people
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={isPending || !name.trim()}
          className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-[#1a1a1a] px-6 text-[13px] font-medium text-white hover:bg-[#333] disabled:opacity-40"
        >
          {isPending ? 'Creating...' : 'Create workspace'}
        </button>
      </div>
    </div>
  );
}
