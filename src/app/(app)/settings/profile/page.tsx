import { requireUser } from '@/lib/auth/permissions';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Profile Settings — DraftMind',
};

export default async function ProfileSettingsPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, created_at')
    .eq('id', user.id)
    .single();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Profile</h1>
      <div className="border-surface-border bg-surface-primary space-y-4 rounded-lg border p-6">
        <div>
          <label className="text-sm font-medium text-ink-secondary">Email</label>
          <p className="mt-1 text-ink-primary">{user.email}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-ink-secondary">Full Name</label>
          <p className="mt-1 text-ink-primary">{profile?.full_name ?? 'Not set'}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-ink-secondary">Member Since</label>
          <p className="mt-1 text-ink-primary">
            {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
          </p>
        </div>
      </div>
    </div>
  );
}
