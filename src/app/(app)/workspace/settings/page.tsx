'use client';

import { useState, useEffect, useTransition } from 'react';
import { toast } from 'sonner';
import { Building2, Trash2 } from 'lucide-react';
import { getWorkspaceSettings, updateWorkspaceName } from './actions';

export default function WorkspaceSettingsPage() {
  const [workspace, setWorkspace] = useState<{
    id: string;
    name: string;
    slug: string;
    industry: string | null;
    team_size: string | null;
  } | null>(null);
  const [name, setName] = useState('');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function load() {
      const ws = await getWorkspaceSettings();
      if (ws) {
        setWorkspace(ws);
        setName(ws.name);
      }
    }
    load();
  }, []);

  function handleSave() {
    if (!workspace || !name.trim()) return;
    startTransition(async () => {
      const result = await updateWorkspaceName(workspace.id, name);
      if (result.error) toast.error(result.error);
      else toast.success('Workspace updated');
    });
  }

  if (!workspace)
    return (
      <div className="mx-auto max-w-2xl px-8 py-10">
        <p className="text-[13px] text-[#aaa]">Loading...</p>
      </div>
    );

  return (
    <div className="mx-auto max-w-2xl px-8 py-10">
      <h1 className="text-[22px] font-bold text-[#1a1a1a]">Workspace Settings</h1>
      <p className="mt-0.5 text-[13px] text-[#888]">Manage your workspace</p>

      <div className="mt-8 rounded-xl border border-[#eee] bg-white">
        <div className="flex items-center gap-2.5 border-b border-[#f0f0f0] px-6 py-4">
          <Building2 size={15} className="text-[#999]" />
          <h2 className="text-[14px] font-semibold text-[#1a1a1a]">General</h2>
        </div>
        <div className="space-y-5 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[#1a1a1a]">
              Workspace name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="focus:ring-accent/30 h-10 w-full rounded-lg border border-[#e5e5e3] bg-white px-3 text-[13px] text-[#1a1a1a] focus:border-accent focus:outline-none focus:ring-1"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#aaa]">
                Slug
              </label>
              <p className="text-[13px] text-[#666]">{workspace.slug}</p>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#aaa]">
                Industry
              </label>
              <p className="text-[13px] text-[#666]">{workspace.industry ?? '—'}</p>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#aaa]">
                Team size
              </label>
              <p className="text-[13px] text-[#666]">{workspace.team_size ?? '—'}</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="h-9 rounded-lg bg-[#1a1a1a] px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {isPending ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-red-200 bg-white">
        <div className="flex items-center gap-2.5 border-b border-red-100 px-6 py-4">
          <Trash2 size={15} className="text-red-400" />
          <h2 className="text-[14px] font-semibold text-red-600">Danger Zone</h2>
        </div>
        <div className="px-6 py-5">
          <p className="text-[13px] text-[#888]">
            Permanently delete this workspace and all data. This cannot be undone.
          </p>
          <button
            disabled
            className="mt-3 h-9 rounded-lg border border-red-200 bg-white px-4 text-[13px] font-medium text-red-500 opacity-50"
          >
            Delete workspace
          </button>
        </div>
      </div>
    </div>
  );
}
