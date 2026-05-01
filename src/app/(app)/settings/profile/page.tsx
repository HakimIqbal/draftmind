import { requireUser } from '@/lib/auth/permissions';
import { createClient } from '@/lib/supabase/server';
import { ProfileForm } from '@/components/settings/profile-form';

export const metadata = {
  title: 'DraftMind',
};

export default async function ProfileSettingsPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  return (
    <>
      <h1 className="mb-lg font-display text-xl font-bold">Profile</h1>
      <ProfileForm
        profile={{
          full_name: profile?.full_name ?? null,
          role_self_reported: profile?.role_self_reported ?? null,
          experience_level: profile?.experience_level ?? null,
          default_locale: profile?.default_locale ?? null,
          primary_use_cases: profile?.primary_use_cases ?? null,
          created_at: profile?.created_at ?? null,
        }}
        email={user.email ?? ''}
      />
    </>
  );
}
