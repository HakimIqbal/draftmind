'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Pencil, Loader2, Camera, Check, X, ZoomIn } from 'lucide-react';
import AvatarEditor, { type AvatarEditorRef } from 'react-avatar-editor';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { getProfile, updateProfile, changePassword, uploadAvatar } from '@/lib/actions/profile';
import { useUserStore } from '@/stores/user-store';

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
  const { setName: setStoreName, setAvatarUrl: setStoreAvatarUrl } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [workspaceRole, setWorkspaceRole] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [memberSince, setMemberSince] = useState('');

  // Avatar upload dialog
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editorScale, setEditorScale] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<AvatarEditorRef>(null);

  // Password
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setEditingName(false);
    setShowPasswordForm(false);
    getProfile().then((data) => {
      setEmail(data.email);
      setWorkspaceRole(data.workspaceRole ?? '');
      if (data.profile) {
        const name = data.profile.full_name ?? '';
        setFullName(name);
        setOriginalName(name);
        setJobTitle(data.profile.role_self_reported ?? '');
        setAvatarUrl(data.profile.avatar_url);
        setMemberSince(
          data.profile.created_at
            ? new Date(data.profile.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : '',
        );
        // Seed the store with fresh data from the server
        setStoreName(name);
        setStoreAvatarUrl(data.profile.avatar_url);
      }
      setLoading(false);
    });
  }, [open, setStoreName, setStoreAvatarUrl]);

  async function handleSaveName() {
    if (!fullName.trim() || fullName === originalName) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    const newName = fullName.trim();
    // Optimistic update
    setStoreName(newName);
    const result = await updateProfile({ full_name: newName });
    if (result.error) {
      // Rollback on failure
      setStoreName(originalName);
      setFullName(originalName);
      toast.error(result.error);
    } else {
      toast.success('Name updated');
      setOriginalName(newName);
    }
    setSavingName(false);
    setEditingName(false);
  }

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
      formData.append('avatar', file);
      const result = await uploadAvatar(formData);
      if (result.error) toast.error(result.error);
      else {
        toast.success('Avatar updated');
        if (result.avatarUrl) {
          setAvatarUrl(result.avatarUrl);
          // Optimistic update — all Avatar components for current user refresh immediately
          setStoreAvatarUrl(result.avatarUrl);
        }
        setSelectedFile(null);
        setEditorScale(1);
        setAvatarDialogOpen(false);
      }
    } catch {
      toast.error('Failed to process image');
    }
    setUploadingAvatar(false);
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword)) {
      toast.error(
        'Password must be at least 8 characters, include one uppercase letter and one number.',
      );
      return;
    }
    setChangingPw(true);
    const result = await changePassword(oldPassword, newPassword);
    if (result.error) toast.error(result.error);
    else {
      toast.success('Password changed');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    }
    setChangingPw(false);
  }

  const roleLabel = workspaceRole
    ? workspaceRole.charAt(0).toUpperCase() + workspaceRole.slice(1)
    : '';

  return (
    <>
      {/* Profile Modal */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[440px] gap-0 overflow-hidden rounded-2xl border border-[#e8e8e6] p-0 shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
          <DialogTitle className="sr-only">Profile</DialogTitle>
          <DialogDescription className="sr-only">Manage your profile settings</DialogDescription>
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 size={22} className="animate-spin text-accent" />
            </div>
          ) : (
            <>
              {/* Header — avatar + name + email */}
              <div className="from-accent/5 flex items-center gap-4 bg-gradient-to-b to-transparent px-6 pb-5 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setAvatarDialogOpen(true);
                    setSelectedFile(null);
                  }}
                  className="group relative shrink-0 overflow-hidden rounded-full shadow-md ring-2 ring-white"
                >
                  <Avatar name={fullName || email} size="lg" avatarUrl={avatarUrl} />
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <Camera size={16} className="text-white" />
                  </div>
                </button>
                <div className="min-w-0 flex-1">
                  {editingName ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveName();
                          if (e.key === 'Escape') {
                            setFullName(originalName);
                            setEditingName(false);
                          }
                        }}
                        className="border-accent/30 focus:ring-accent/20 min-w-0 flex-1 rounded-lg border bg-white px-2.5 py-1 text-[16px] font-bold text-[#1a1a1a] focus:outline-none focus:ring-2"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveName}
                        disabled={savingName}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white hover:bg-accent-deep disabled:opacity-50"
                      >
                        {savingName ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Check size={13} />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setFullName(originalName);
                          setEditingName(false);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[#bbb] hover:bg-[#f0f0ee] hover:text-[#666]"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingName(true)}
                      className="group flex items-center gap-1.5 text-left"
                    >
                      <p className="truncate text-[17px] font-bold text-[#1a1a1a]">
                        {fullName || 'Not set'}
                      </p>
                      <Pencil
                        size={12}
                        className="shrink-0 text-[#ccc] opacity-0 transition-opacity group-hover:opacity-100"
                      />
                    </button>
                  )}
                  <p className="mt-0.5 truncate text-[13px] text-[#888]">{email}</p>
                  {memberSince && (
                    <p className="mt-0.5 text-[11px] text-[#bbb]">Member since {memberSince}</p>
                  )}
                </div>
              </div>

              {/* Info fields */}
              <div className="px-6 py-5">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#aaa]">
                      Job title
                    </p>
                    <p className="mt-1 text-[14px] font-medium text-[#1a1a1a]">{jobTitle || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#aaa]">
                      Workspace role
                    </p>
                    <p className="mt-1 text-[14px] font-medium capitalize text-[#1a1a1a]">
                      {roleLabel || '-'}
                    </p>
                  </div>
                </div>

                {/* Change password */}
                <div className="mt-6 border-t border-[#f0f0ee] pt-4">
                  {!showPasswordForm ? (
                    <button
                      onClick={() => setShowPasswordForm(true)}
                      className="text-[12px] font-medium text-accent transition-colors hover:text-accent-deep hover:underline"
                    >
                      Change password
                    </button>
                  ) : (
                    <div className="space-y-3 rounded-xl border border-[#f0f0ee] bg-[#fafaf9] p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#aaa]">
                          Change password
                        </p>
                        <button
                          onClick={() => {
                            setShowPasswordForm(false);
                            setOldPassword('');
                            setNewPassword('');
                            setConfirmPassword('');
                          }}
                          className="text-[11px] text-[#bbb] transition-colors hover:text-[#666]"
                        >
                          Cancel
                        </button>
                      </div>
                      <Input
                        type="password"
                        placeholder="Current password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="h-10 rounded-xl text-[13px]"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          type="password"
                          placeholder="New password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="h-10 rounded-xl text-[13px]"
                        />
                        <Input
                          type="password"
                          placeholder="Confirm"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="h-10 rounded-xl text-[13px]"
                        />
                      </div>
                      <button
                        onClick={handleChangePassword}
                        disabled={changingPw || !oldPassword || !newPassword || !confirmPassword}
                        className="rounded-xl bg-[#1a1a1a] px-4 py-2 text-[12px] font-medium text-white transition-colors hover:bg-[#333] disabled:opacity-40"
                      >
                        {changingPw ? 'Updating...' : 'Update password'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Avatar Upload Dialog */}
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
          <DialogTitle className="sr-only">Upload Profile Photo</DialogTitle>
          <DialogDescription className="sr-only">
            Position and crop your profile photo
          </DialogDescription>
          <div className="px-6 pb-2 pt-6">
            <p className="text-[15px] font-bold text-[#1a1a1a]">Upload Profile Photo</p>
          </div>

          <div className="flex flex-col items-center gap-3 px-6 py-4">
            {selectedFile ? (
              <>
                {/* Canvas editor with circular mask */}
                <AvatarEditor
                  ref={editorRef}
                  image={selectedFile}
                  width={220}
                  height={220}
                  border={24}
                  borderRadius={110}
                  color={[255, 255, 255, 0.55]}
                  scale={editorScale}
                  rotate={0}
                  style={{ borderRadius: '12px', cursor: 'move' }}
                />

                {/* Zoom slider */}
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
                {/* File picker state */}
                <div className="overflow-hidden rounded-full shadow-md ring-2 ring-[#f0f0ee]">
                  <Avatar
                    name={fullName || email}
                    size="lg"
                    avatarUrl={avatarUrl}
                    className="h-24 w-24 text-2xl"
                  />
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
