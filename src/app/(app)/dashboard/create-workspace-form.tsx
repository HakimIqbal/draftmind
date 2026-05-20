'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createWorkspace } from '@/app/(app)/workspace/settings/actions';
import { setCurrentWorkspace } from '@/app/(app)/actions';

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function CreateWorkspaceForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('');

  const slug = toSlug(name.trim());

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    startTransition(async () => {
      const result = await createWorkspace({ name: name.trim() });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.workspaceId) {
        await setCurrentWorkspace(result.workspaceId);
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4 text-left">
      <div>
        <label className="mb-1.5 block text-[13px] font-medium text-[#333]">
          Workspace name <span className="text-red-400">*</span>
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Marketing Team"
          required
          autoFocus
          maxLength={80}
          className="focus:ring-accent/30 h-10 w-full rounded-lg border border-[#e5e5e3] bg-white px-3 text-[13px] text-[#1a1a1a] placeholder:text-[#bbb] focus:border-accent focus:outline-none focus:ring-1"
        />
        {slug && (
          <p className="mt-1.5 text-[11px] text-[#aaa]">
            Slug:{' '}
            <span className="font-mono text-[#888]">
              {slug}-<span className="opacity-50">…</span>
            </span>
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={isPending || !name.trim()}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1a1a1a] px-6 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending && <Loader2 size={14} className="animate-spin" />}
        {isPending ? 'Creating…' : 'Create workspace'}
      </button>
    </form>
  );
}
