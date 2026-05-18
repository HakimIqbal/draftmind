import { requireUser } from '@/lib/auth/permissions';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin/admin-shell';

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_super_admin, full_name, email, avatar_url')
    .eq('id', user.id)
    .single();

  if (!profile?.is_super_admin) {
    redirect('/dashboard');
  }

  const admin = createAdminClient();
  const { count: openTicketCount } = await admin
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'open');

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
