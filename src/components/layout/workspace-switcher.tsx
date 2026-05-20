'use client';

import { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { ChevronDown, Plus, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { setCurrentWorkspace } from '@/app/(app)/actions';
import { createWorkspace } from '@/app/(app)/workspace/settings/actions';
import type { WorkspaceListItem } from '@/lib/db/queries/workspace';

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

interface WorkspaceSwitcherProps {
  workspaces: WorkspaceListItem[];
  currentWorkspaceId?: string;
}

export function WorkspaceSwitcher({ workspaces, currentWorkspaceId }: WorkspaceSwitcherProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  // Create form
  const [newName, setNewName] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [customIndustry, setCustomIndustry] = useState('');
  const [newTeamSize, setNewTeamSize] = useState('');

  const current = workspaces.find((w) => w.id === currentWorkspaceId) ?? workspaces[0];

  const updatePos = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.top, left: rect.left, width: rect.width });
    }
  }, []);

  // Click outside to close dropdown — use mouseup + RAF to ensure portal DOM is ready
  useEffect(() => {
    if (!dropdownOpen) return;
    updatePos();
    function handleClick(e: MouseEvent) {
      requestAnimationFrame(() => {
        if (
          triggerRef.current?.contains(e.target as Node) ||
          dropdownRef.current?.contains(e.target as Node)
        )
          return;
        setDropdownOpen(false);
      });
    }
    document.addEventListener('mouseup', handleClick);
    return () => document.removeEventListener('mouseup', handleClick);
  }, [dropdownOpen, updatePos]);

  function handleSwitch(wsId: string) {
    if (wsId === currentWorkspaceId) {
      setDropdownOpen(false);
      return;
    }
    startTransition(async () => {
      await setCurrentWorkspace(wsId);
      setDropdownOpen(false);
    });
  }

  function handleCreate() {
    if (!newName.trim()) return;
    const finalIndustry = newIndustry === 'Other' ? customIndustry.trim() : newIndustry;
    startTransition(async () => {
      const result = await createWorkspace({
        name: newName.trim(),
        industry: finalIndustry || undefined,
        team_size: newTeamSize || undefined,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Workspace created');
        setCreateOpen(false);
        setNewName('');
        setNewIndustry('');
        setCustomIndustry('');
        setNewTeamSize('');
        if (result.workspaceId) {
          await setCurrentWorkspace(result.workspaceId);
        }
        router.refresh();
      }
    });
  }

  return (
    <>
      {/* Trigger — normal switcher OR no-workspace fallback */}
      {current ? (
        <button
          ref={triggerRef}
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/60"
          disabled={isPending}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#f0f0ee] text-[11px] font-bold text-[#555]">
            {current.icon_custom_url ? (
              <Image
                src={current.icon_custom_url}
                alt=""
                width={24}
                height={24}
                className="h-full w-full object-cover"
              />
            ) : (
              current.name[0]
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium text-[#1a1a1a]">{current.name}</p>
          </div>
          <ChevronDown
            size={12}
            className={`shrink-0 text-[#bbb] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>
      ) : (
        <button
          onClick={() => setCreateOpen(true)}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/60"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-dashed border-[#ccc]">
            <Plus size={11} className="text-[#bbb]" />
          </span>
          <p className="truncate text-[12px] font-medium text-[#aaa]">No workspace</p>
        </button>
      )}

      {/* Dropdown via portal — only when workspace exists */}
      {current &&
        dropdownOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999] rounded-xl border border-[#eee] bg-white shadow-xl"
            style={{
              top: pos.top - 8,
              left: pos.left,
              width: Math.max(pos.width, 280),
              transform: 'translateY(-100%)',
            }}
          >
            {/* Header */}
            <div className="px-4 pb-1 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#aaa]">
                Your workspaces
              </p>
            </div>

            {/* Workspace list */}
            <div className="px-2 py-1">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[#f5f5f4]"
                  onClick={() => handleSwitch(ws.id)}
                  disabled={isPending}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#f0f0ee] text-[12px] font-bold text-[#555]">
                    {ws.icon_custom_url ? (
                      <Image
                        src={ws.icon_custom_url}
                        alt=""
                        width={32}
                        height={32}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      ws.name[0]
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-[#1a1a1a]">{ws.name}</p>
                    <p className="text-[11px] text-[#aaa]">{ws.role}</p>
                  </div>
                  {ws.id === currentWorkspaceId && (
                    <Check size={14} className="shrink-0 text-accent" />
                  )}
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-[#f0f0f0] px-4 py-2.5">
              <button
                onClick={() => {
                  setCreateOpen(true);
                  setDropdownOpen(false);
                }}
                className="flex items-center gap-1.5 text-[12px] font-medium text-[#555] transition-colors hover:text-[#1a1a1a]"
              >
                <Plus size={13} />
                Create workspace
              </button>
            </div>
          </div>,
          document.body,
        )}

      {/* Create Workspace Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCreateOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-[#eee] bg-white p-8 shadow-2xl">
            <button
              onClick={() => setCreateOpen(false)}
              className="absolute right-4 top-4 text-[#bbb] hover:text-[#666]"
            >
              <X size={18} />
            </button>

            <h2 className="text-[18px] font-bold text-[#1a1a1a]">Create workspace</h2>
            <p className="mt-1 text-[13px] text-[#888]">A new workspace for your team</p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-[#1a1a1a]">
                  Workspace name <span className="text-red-400">*</span>
                </label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Marketing Team"
                  className="focus:ring-accent/30 h-10 w-full rounded-lg border border-[#e5e5e3] bg-white px-3 text-[13px] text-[#1a1a1a] placeholder:text-[#bbb] focus:border-accent focus:outline-none focus:ring-1"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-[#1a1a1a]">
                  Industry
                </label>
                <select
                  value={newIndustry}
                  onChange={(e) => {
                    setNewIndustry(e.target.value);
                    if (e.target.value !== 'Other') setCustomIndustry('');
                  }}
                  className="focus:ring-accent/30 h-10 w-full rounded-lg border border-[#e5e5e3] bg-white px-3 text-[13px] text-[#1a1a1a] focus:border-accent focus:outline-none focus:ring-1"
                >
                  <option value="">Select industry...</option>
                  {INDUSTRY_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                {newIndustry === 'Other' && (
                  <input
                    value={customIndustry}
                    onChange={(e) => setCustomIndustry(e.target.value)}
                    placeholder="Enter your industry..."
                    className="focus:ring-accent/30 mt-2 h-10 w-full rounded-lg border border-[#e5e5e3] bg-white px-3 text-[13px] text-[#1a1a1a] placeholder:text-[#bbb] focus:border-accent focus:outline-none focus:ring-1"
                  />
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-[#1a1a1a]">
                  Team size
                </label>
                <select
                  value={newTeamSize}
                  onChange={(e) => setNewTeamSize(e.target.value)}
                  className="focus:ring-accent/30 h-10 w-full rounded-lg border border-[#e5e5e3] bg-white px-3 text-[13px] text-[#1a1a1a] focus:border-accent focus:outline-none focus:ring-1"
                >
                  <option value="">Select team size...</option>
                  {TEAM_SIZE_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o} people
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setCreateOpen(false)}
                  className="flex-1 rounded-lg border border-[#e5e5e3] bg-white py-2.5 text-[13px] font-medium text-[#666] transition-colors hover:bg-[#fafaf9]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={isPending || !newName.trim()}
                  className="flex-1 rounded-lg bg-[#1a1a1a] py-2.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
