'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { Building2, AlertTriangle, Camera, Loader2 } from 'lucide-react';
import {
  updateWorkspaceSettings,
  leaveWorkspace,
  deleteWorkspace,
} from '@/app/(app)/workspace/settings/actions';

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

interface Props {
  workspace: {
    id: string;
    name: string;
    slug: string;
    industry: string | null;
    team_size: string | null;
    owner_id: string;
    icon_custom_url: string | null;
  };
  isOwner: boolean;
  isAdmin: boolean;
}

export function WorkspaceSettingsTab({ workspace, isOwner, isAdmin }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(workspace.name);
  const [wsAvatarUrl, setWsAvatarUrl] = useState(workspace.icon_custom_url);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [industry, setIndustry] = useState(
    INDUSTRY_OPTIONS.includes(workspace.industry ?? '')
      ? (workspace.industry ?? '')
      : workspace.industry
        ? 'Other'
        : '',
  );
  const [customIndustry, setCustomIndustry] = useState(
    !INDUSTRY_OPTIONS.includes(workspace.industry ?? '') && workspace.industry
      ? workspace.industry
      : '',
  );
  const [teamSize, setTeamSize] = useState(workspace.team_size ?? '');
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const isOtherIndustry = industry === 'Other';

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('workspaceId', workspace.id);
      formData.append('avatar', file);
      const res = await fetch('/api/workspace/avatar', { method: 'POST', body: formData });
      const result = await res.json();
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Workspace avatar updated');
        if (result.avatarUrl) setWsAvatarUrl(result.avatarUrl);
        router.refresh();
      }
    } catch {
      toast.error('Failed to upload avatar');
    }
    setUploadingAvatar(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleSave() {
    const finalIndustry = isOtherIndustry ? customIndustry.trim() : industry;
    startTransition(async () => {
      const result = await updateWorkspaceSettings(workspace.id, {
        name,
        industry: finalIndustry,
        team_size: teamSize,
      });
      if (result.error) toast.error(result.error);
      else toast.success('Workspace updated');
    });
  }

  return (
    <div className="space-y-6">
      {/* General */}
      <div className="rounded-xl border border-[#eee] bg-white">
        <div className="flex items-center gap-2.5 border-b border-[#f0f0f0] px-6 py-4">
          <Building2 size={15} className="text-[#999]" />
          <h2 className="text-[14px] font-semibold text-[#1a1a1a]">General</h2>
        </div>
        <div className="space-y-5 px-6 py-5">
          {/* Workspace Avatar */}
          {isAdmin && (
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[#1a1a1a]">
                Workspace photo
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#e5e5e3] bg-[#fafaf9] transition-colors hover:border-accent"
                >
                  {wsAvatarUrl ? (
                    <Image
                      src={wsAvatarUrl}
                      alt={workspace.name}
                      width={64}
                      height={64}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-accent text-[22px] font-bold text-white">
                      {workspace.name[0]}
                    </span>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    {uploadingAvatar ? (
                      <Loader2 size={18} className="animate-spin text-white" />
                    ) : (
                      <Camera size={18} className="text-white" />
                    )}
                  </div>
                </button>
                <div>
                  <p className="text-[12px] text-[#888]">
                    Click to upload. JPG, PNG, or WebP. Max 2MB.
                  </p>
                  {wsAvatarUrl && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-1 text-[12px] text-accent hover:underline"
                    >
                      Change photo
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
            </div>
          )}

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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[#1a1a1a]">
                Industry
              </label>
              <select
                value={isOtherIndustry ? 'Other' : industry}
                onChange={(e) => {
                  setIndustry(e.target.value);
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
              {isOtherIndustry && (
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
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
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
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-[#bbb]">Slug: {workspace.slug}</p>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="h-9 rounded-lg bg-[#1a1a1a] px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {isPending ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-red-200 bg-white">
        <div className="flex items-center gap-2.5 border-b border-red-100 px-6 py-4">
          <AlertTriangle size={15} className="text-red-400" />
          <h2 className="text-[14px] font-semibold text-red-600">Danger Zone</h2>
        </div>
        <div className="divide-y divide-red-50 px-6">
          {!isOwner && (
            <div className="flex items-center justify-between py-4">
              <div>
                <p className="text-[13px] font-medium text-[#1a1a1a]">Leave workspace</p>
                <p className="mt-0.5 text-[12px] text-[#888]">You will lose access to all PRDs</p>
              </div>
              <button
                onClick={() =>
                  startTransition(async () => {
                    const r = await leaveWorkspace(workspace.id);
                    if (r.error) toast.error(r.error);
                    else {
                      toast.success('Left workspace');
                      router.push('/dashboard');
                    }
                  })
                }
                disabled={isPending}
                className="h-8 rounded-lg border border-red-200 px-3 text-[12px] font-medium text-red-500 hover:bg-red-50 disabled:opacity-40"
              >
                Leave
              </button>
            </div>
          )}
          {isOwner && (
            <div className="py-4">
              <p className="text-[13px] font-medium text-[#1a1a1a]">Delete workspace</p>
              <p className="mt-0.5 text-[12px] text-[#888]">
                Permanently delete this workspace and all its PRDs
              </p>
              <div className="mt-3 flex items-center gap-3">
                <input
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder={`Type "${workspace.name}" to confirm`}
                  className="focus:ring-red/30 h-8 flex-1 rounded-lg border border-red-200 px-3 text-[12px] text-[#1a1a1a] placeholder:text-[#ccc] focus:border-red-400 focus:outline-none focus:ring-1"
                />
                <button
                  onClick={() =>
                    startTransition(async () => {
                      const r = await deleteWorkspace(workspace.id);
                      if (r.error) toast.error(r.error);
                      else {
                        toast.success('Workspace deleted');
                        router.push('/dashboard');
                      }
                    })
                  }
                  disabled={isPending || deleteConfirm !== workspace.name}
                  className="h-8 rounded-lg bg-red-500 px-3 text-[12px] font-medium text-white hover:opacity-90 disabled:opacity-40"
                >
                  Delete permanently
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
