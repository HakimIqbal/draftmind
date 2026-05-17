'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Users, FileText, X } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';

interface WorkspaceItem {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  industry: string | null;
  team_size: string | null;
  created_at: string;
  icon_custom_url: string | null;
}

interface OwnerInfo {
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

interface MemberInfo {
  user_id: string;
  role: string;
  joined_at: string;
  profiles: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
}

interface WorkspacesClientProps {
  workspaces: WorkspaceItem[];
  countMap: Record<string, number>;
  prdMap: Record<string, number>;
  ownerMap: Record<string, OwnerInfo>;
}

export function WorkspacesClient({
  workspaces,
  countMap,
  prdMap,
  ownerMap,
}: WorkspacesClientProps) {
  const [selected, setSelected] = useState<WorkspaceItem | null>(null);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const wsChannel = supabase
      .channel('admin-workspaces-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workspaces' }, () => {
        router.refresh();
      })
      .subscribe();

    const membersChannel = supabase
      .channel('admin-workspace-members-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workspace_members' }, () => {
        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(wsChannel);
      supabase.removeChannel(membersChannel);
    };
  }, [router]);

  useEffect(() => {
    if (!selected) return;

    setLoading(true);
    fetch(`/api/workspace/members?workspaceId=${selected.id}`)
      .then((r) => r.json())
      .then((data) => setMembers(data.members ?? []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, [selected]);

  // Close on Escape
  useEffect(() => {
    if (!selected) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [selected]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {workspaces.map((ws) => {
          const owner = ownerMap[ws.owner_id];
          return (
            <button
              key={ws.id}
              type="button"
              onClick={() => setSelected(ws)}
              className="cursor-pointer rounded-xl border border-[#eee] bg-white p-5 text-left transition-all hover:border-[#ddd] hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-violet-50">
                  {ws.icon_custom_url ? (
                    <img
                      src={ws.icon_custom_url}
                      alt={ws.name}
                      className="h-full w-full rounded-lg object-cover"
                    />
                  ) : (
                    <Building2 size={18} className="text-violet-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-[#1a1a1a]">{ws.name}</p>
                  <p className="text-[11px] text-[#aaa]">{ws.slug}</p>
                </div>
              </div>

              <div className="mt-4 flex gap-4">
                <div className="flex items-center gap-1.5 text-[12px] text-[#888]">
                  <Users size={12} />
                  {countMap[ws.id] ?? 0} members
                </div>
                <div className="flex items-center gap-1.5 text-[12px] text-[#888]">
                  <FileText size={12} />
                  {prdMap[ws.id] ?? 0} PRDs
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 border-t border-[#f5f5f5] pt-3">
                <Avatar
                  name={owner?.full_name ?? 'User'}
                  size="sm"
                  avatarUrl={owner?.avatar_url ?? null}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] text-[#888]">
                    {owner?.full_name ?? owner?.email ?? 'Unknown'}
                  </p>
                  <p className="text-[10px] text-[#bbb]" suppressHydrationWarning>
                    {new Date(ws.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <div className="w-full max-w-[560px] rounded-2xl border border-[#eee] bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#f0f0ee] px-6 py-4">
              <div>
                <h2 className="text-[16px] font-bold text-[#1a1a1a]">{selected.name}</h2>
                <p className="text-[12px] text-[#999]">{selected.slug}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#999] transition-colors hover:bg-[#f5f5f4] hover:text-[#555]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Stats */}
            <div className="flex gap-6 border-b border-[#f0f0ee] px-6 py-3">
              <div className="flex items-center gap-1.5 text-[12px] text-[#888]">
                <Users size={12} />
                {countMap[selected.id] ?? 0} members
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-[#888]">
                <FileText size={12} />
                {prdMap[selected.id] ?? 0} PRDs
              </div>
              {selected.industry && (
                <span className="text-[12px] text-[#888]">{selected.industry}</span>
              )}
            </div>

            {/* Members */}
            <div className="max-h-[400px] overflow-y-auto px-6 py-4">
              <p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-wider text-[#999]">
                Members
              </p>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#ddd] border-t-accent" />
                </div>
              ) : members.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-[#999]">No members found</p>
              ) : (
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-[#f5f5f4]">
                      <th className="pb-2 font-mono text-[10px] font-medium uppercase tracking-wider text-[#999]">
                        Name
                      </th>
                      <th className="pb-2 font-mono text-[10px] font-medium uppercase tracking-wider text-[#999]">
                        Role
                      </th>
                      <th className="pb-2 font-mono text-[10px] font-medium uppercase tracking-wider text-[#999]">
                        Joined
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f5f5f4]">
                    {members.map((m) => (
                      <tr key={m.user_id}>
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <Avatar
                              name={m.profiles?.full_name ?? 'User'}
                              size="sm"
                              avatarUrl={m.profiles?.avatar_url ?? null}
                            />
                            <div>
                              <p className="text-[13px] font-medium text-[#1a1a1a]">
                                {m.profiles?.full_name ?? 'Unknown'}
                              </p>
                              <p className="text-[11px] text-[#999]">{m.profiles?.email ?? ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5">
                          <span className="rounded-full bg-[#f5f5f4] px-2 py-0.5 text-[11px] font-medium capitalize text-[#666]">
                            {m.role}
                          </span>
                        </td>
                        <td
                          className="py-2.5 font-mono text-[11px] text-[#999]"
                          suppressHydrationWarning
                        >
                          {new Date(m.joined_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
