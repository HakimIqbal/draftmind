import { createAdminClient } from '@/lib/supabase/admin';
import { AdminUsersTable } from '@/components/admin/admin-users-table';

export const metadata = { title: 'Users — Admin — DraftMind' };
export const dynamic = 'force-dynamic';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  const admin = createAdminClient();

  const { data: profiles, count } = await admin
    .from('profiles')
    .select(
      'id, email, full_name, role_self_reported, is_super_admin, onboarding_completed_at, created_at, avatar_url',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  const totalPages = Math.ceil((count ?? 0) / pageSize);

  // Fetch auth users for ban status — only for current page users
  const userIds = (profiles ?? []).map((p) => p.id);
  const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const bannedSet = new Set<string>();
  if (authData?.users) {
    for (const u of authData.users) {
      if (userIds.includes(u.id) && u.banned_until && new Date(u.banned_until) > new Date()) {
        bannedSet.add(u.id);
      }
    }
  }

  const users = (profiles ?? []).map((p) => ({
    ...p,
    is_disabled: bannedSet.has(p.id),
  }));

  return (
    <div>
      <AdminUsersTable users={users} />

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          {page > 1 ? (
            <a
              href={`?page=${page - 1}`}
              className="rounded-lg border border-[#eee] px-3 py-1.5 text-[12px] font-medium text-[#666] hover:bg-[#f5f5f4]"
            >
              &larr; Prev
            </a>
          ) : (
            <span className="rounded-lg border border-[#f5f5f4] px-3 py-1.5 text-[12px] text-[#ccc]">
              &larr; Prev
            </span>
          )}
          <span className="font-mono text-[11px] text-[#999]">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <a
              href={`?page=${page + 1}`}
              className="rounded-lg border border-[#eee] px-3 py-1.5 text-[12px] font-medium text-[#666] hover:bg-[#f5f5f4]"
            >
              Next &rarr;
            </a>
          ) : (
            <span className="rounded-lg border border-[#f5f5f4] px-3 py-1.5 text-[12px] text-[#ccc]">
              Next &rarr;
            </span>
          )}
        </div>
      )}
    </div>
  );
}
