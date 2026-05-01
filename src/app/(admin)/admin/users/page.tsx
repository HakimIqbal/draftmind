import { createAdminClient } from '@/lib/supabase/admin';
import { AdminUsersTable } from '@/components/admin/admin-users-table';

export const metadata = { title: 'Admin — DraftMind' };

export default async function AdminUsersPage() {
  const admin = createAdminClient();

  const { data: users } = await admin
    .from('profiles')
    .select(
      'id, email, full_name, role_self_reported, is_super_admin, onboarding_completed_at, created_at',
    )
    .order('created_at', { ascending: false });

  return <AdminUsersTable users={users ?? []} />;
}
