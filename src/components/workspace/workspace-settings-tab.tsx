'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { Building2, AlertTriangle, Camera, Loader2, ZoomIn } from 'lucide-react';
import AvatarEditor, { type AvatarEditorRef } from 'react-avatar-editor';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editorScale, setEditorScale] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<AvatarEditorRef>(null);
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

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File too large. Max 2MB.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG, or WebP allowed');
      return;
    }
    setSelectedFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleUploadAvatar() {
    if (!selectedFile || !editorRef.current) return;
    setUploadingAvatar(true);
    try {
      const canvas = editorRef.current.getImageScaledToCanvas();
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png', 0.92),
      );
      if (!blob) throw new Error('Failed to export image');
      const file = new File([blob], 'avatar.png', { type: 'image/png' });
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
        setSelectedFile(null);
        setEditorScale(1);
        setAvatarDialogOpen(false);
        router.refresh();
      }
    } catch {
      toast.error('Failed to process image');
    }
    setUploadingAvatar(false);
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
      else {
        toast.success('Workspace updated');
        router.refresh();
      }
    });
  }

  return (
    <>
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
                    onClick={() => {
                      setAvatarDialogOpen(true);
                      setSelectedFile(null);
                    }}
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
                      <Camera size={18} className="text-white" />
                    </div>
                  </button>
                  <div>
                    <p className="text-[12px] text-[#888]">
                      Click to upload. JPG, PNG, or WebP. Max 2MB.
                    </p>
                  </div>
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
              <p />
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

      {/* Workspace Avatar Upload Dialog */}
      <Dialog
        open={avatarDialogOpen}
        onOpenChange={(v) => {
          setAvatarDialogOpen(v);
          if (!v) {
            setSelectedFile(null);
            setEditorScale(1);
          }
        }}
      >
        <DialogContent className="max-w-[380px] gap-0 overflow-hidden rounded-2xl border border-[#e8e8e6] p-0 shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
          <DialogTitle className="sr-only">Upload Workspace Photo</DialogTitle>
          <DialogDescription className="sr-only">
            Position and crop your workspace photo
          </DialogDescription>
          <div className="px-6 pb-2 pt-6">
            <p className="text-[15px] font-bold text-[#1a1a1a]">Upload Workspace Photo</p>
          </div>

          <div className="flex flex-col items-center gap-3 px-6 py-4">
            {selectedFile ? (
              <>
                <AvatarEditor
                  ref={editorRef}
                  image={selectedFile}
                  width={220}
                  height={220}
                  border={24}
                  borderRadius={16}
                  color={[255, 255, 255, 0.55]}
                  scale={editorScale}
                  rotate={0}
                  style={{ borderRadius: '12px', cursor: 'move' }}
                />
                <div className="flex w-full items-center gap-2.5 px-1">
                  <ZoomIn size={13} className="shrink-0 text-[#aaa]" />
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.05}
                    value={editorScale}
                    onChange={(e) => setEditorScale(parseFloat(e.target.value))}
                    className="flex-1 accent-accent"
                  />
                </div>
                <p className="text-[11px] text-[#bbb]">Drag photo to reposition · scroll to zoom</p>
              </>
            ) : (
              <>
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#e5e5e3] shadow-md">
                  {wsAvatarUrl ? (
                    <Image
                      src={wsAvatarUrl}
                      alt={workspace.name}
                      width={80}
                      height={80}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-accent text-[26px] font-bold text-white">
                      {workspace.name[0]}
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-[#999]">Max 2MB · JPG, PNG, WebP</p>
              </>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-[#f0f0ee] bg-[#fafaf9] px-6 py-4">
            <button
              onClick={() => {
                if (selectedFile) {
                  setSelectedFile(null);
                  setEditorScale(1);
                } else {
                  setAvatarDialogOpen(false);
                }
              }}
              className="rounded-xl px-4 py-2.5 text-[13px] font-medium text-[#888] transition-colors hover:bg-white hover:text-[#1a1a1a]"
            >
              {selectedFile ? 'Change photo' : 'Cancel'}
            </button>
            {selectedFile ? (
              <button
                onClick={handleUploadAvatar}
                disabled={uploadingAvatar}
                className="rounded-xl bg-accent px-4 py-2.5 text-[13px] font-medium text-white shadow-sm transition-all hover:bg-accent-deep disabled:opacity-40"
              >
                {uploadingAvatar ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 size={12} className="animate-spin" /> Uploading...
                  </span>
                ) : (
                  'Save photo'
                )}
              </button>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl bg-accent px-4 py-2.5 text-[13px] font-medium text-white shadow-sm transition-all hover:bg-accent-deep"
              >
                Choose file
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
