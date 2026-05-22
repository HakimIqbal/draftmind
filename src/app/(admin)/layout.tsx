import { requireUser } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin/admin-shell';

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('profiles')
    .select('is_super_admin, full_name, email, avatar_url')
    .eq('id', user.id)
    .single();

  if (!profile?.is_super_admin) {
    redirect('/dashboard');
  }

  const nowIso = new Date().toISOString();

  const [{ count: openTicketCount }] = await Promise.all([
    admin.from('tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    admin.from('workspace_members').update({ last_active_at: nowIso }).eq('user_id', user.id),
    admin.from('profiles').update({ last_seen_at: nowIso }).eq('id', user.id),
  ]);

  return (
    <AdminShell
      userName={profile.full_name ?? user.email ?? 'Admin'}
      userEmail={profile.email ?? user.email ?? ''}
      userAvatarUrl={profile.avatar_url ?? undefined}
      openTicketCount={openTicketCount ?? 0}
    >
      {children}
    </AdminShell>
  );
}
