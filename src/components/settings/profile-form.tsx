'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Pencil, X, Check } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { updateProfile } from '@/app/(app)/settings/profile/actions';

const ROLE_OPTIONS = [
  'Product Manager',
  'Product Owner',
  'Engineering Manager',
  'Software Engineer',
  'UX Designer',
  'Data Analyst',
  'Founder / CEO',
  'Other',
];

const EXPERIENCE_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'expert', label: 'Expert' },
];

const LOCALE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'id', label: 'Bahasa Indonesia' },
];

interface ProfileFormProps {
  profile: {
    full_name: string | null;
    role_self_reported: string | null;
    experience_level: string | null;
    default_locale: string | null;
    primary_use_cases: string[] | null;
    created_at: string | null;
  };
  email: string;
}

export function ProfileForm({ profile, email }: ProfileFormProps) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [fullName, setFullName] = useState(profile.full_name ?? '');
  const [role, setRole] = useState(profile.role_self_reported ?? '');
  const [experience, setExperience] = useState(profile.experience_level ?? '');
  const [locale, setLocale] = useState(profile.default_locale ?? 'en');

  function handleCancel() {
    setFullName(profile.full_name ?? '');
    setRole(profile.role_self_reported ?? '');
    setExperience(profile.experience_level ?? '');
    setLocale(profile.default_locale ?? 'en');
    setEditing(false);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateProfile({
        full_name: fullName,
        role_self_reported: role,
        experience_level: experience,
        default_locale: locale,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Profile updated');
        setEditing(false);
      }
    });
  }

  return (
    <Card>
      <CardContent className="p-lg">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-md">
            <Avatar name={fullName || email} size="lg" />
            <div>
              {editing ? (
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full name"
                  className="h-9 text-lg font-medium"
                />
              ) : (
                <h2 className="text-lg font-medium text-ink-primary">
                  {profile.full_name ?? 'Not set'}
                </h2>
              )}
              <p className="mt-0.5 font-mono text-sm text-ink-tertiary">{email}</p>
            </div>
          </div>
          {!editing ? (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil size={14} className="mr-1" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-xs">
              <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isPending}>
                <X size={14} className="mr-1" />
                Cancel
              </Button>
              <Button variant="primary-fill" size="sm" onClick={handleSave} disabled={isPending}>
                <Check size={14} className="mr-1" />
                {isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
        </div>

        <Separator className="my-lg" />

        {/* Fields */}
        <div className="grid grid-cols-2 gap-lg">
          <div>
            <label className="mb-xs block font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
              Role
            </label>
            {editing ? (
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-9 w-full rounded-md border border-subtle bg-bg-canvas px-sm text-sm text-ink-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="">Select role</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-ink-primary">{profile.role_self_reported ?? 'Not set'}</p>
            )}
          </div>

          <div>
            <label className="mb-xs block font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
              Experience
            </label>
            {editing ? (
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="h-9 w-full rounded-md border border-subtle bg-bg-canvas px-sm text-sm text-ink-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="">Select level</option>
                {EXPERIENCE_OPTIONS.map((e) => (
                  <option key={e.value} value={e.value}>
                    {e.label}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm capitalize text-ink-primary">
                {profile.experience_level ?? 'Not set'}
              </p>
            )}
          </div>

          <div>
            <label className="mb-xs block font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
              Language
            </label>
            {editing ? (
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                className="h-9 w-full rounded-md border border-subtle bg-bg-canvas px-sm text-sm text-ink-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {LOCALE_OPTIONS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-ink-primary">
                {profile.default_locale === 'id' ? 'Bahasa Indonesia' : 'English'}
              </p>
            )}
          </div>

          <div>
            <label className="mb-xs block font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
              Member since
            </label>
            <p className="text-sm text-ink-primary">
              {profile.created_at
                ? new Date(profile.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Unknown'}
            </p>
          </div>
        </div>

        {profile.primary_use_cases && profile.primary_use_cases.length > 0 && (
          <>
            <Separator className="my-lg" />
            <div>
              <label className="mb-sm block font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
                Primary use cases
              </label>
              <div className="flex flex-wrap gap-xs">
                {profile.primary_use_cases.map((uc: string) => (
                  <span
                    key={uc}
                    className="rounded-sm border border-subtle px-2 py-0.5 font-mono text-xs text-ink-secondary"
                  >
                    {uc}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
