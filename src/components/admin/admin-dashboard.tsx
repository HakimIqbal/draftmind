'use client';

import { useState, useTransition } from 'react';
import { Users, Building2, FileText, Shield, ShieldOff, UserX, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/ui/pill';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toggleSuperAdmin, toggleUserStatus } from '@/app/(admin)/admin/actions';

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  is_super_admin: boolean;
  onboarding_completed_at: string | null;
  created_at: string;
}

interface AdminWorkspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  ownerName: string;
  created_at: string;
}

interface AdminPRD {
  id: string;
  title: string;
  status: string;
  health_score: number | null;
  owner_id: string;
  ownerName: string;
  workspace_id: string;
  workspaceName: string;
  updated_at: string;
}

interface AdminActivity {
  id: string;
  type: string;
  resource_type: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  actor_id: string | null;
  actorName: string;
  workspaceName: string;
}

interface AdminDashboardProps {
  stats: { totalUsers: number; totalWorkspaces: number; totalPRDs: number; totalAIRuns: number };
  users: AdminUser[];
  workspaces: AdminWorkspace[];
  prds: AdminPRD[];
  activities: AdminActivity[];
  currentUserId: string;
}

const VERB_MAP: Record<string, string> = {
  prd_created: 'created a PRD',
  prd_edited: 'edited a PRD',
  prd_status_changed: 'changed PRD status',
  comment_added: 'commented',
  ai_generation_completed: 'generated with AI',
  ai_review_completed: 'ran AI review',
  member_invited: 'invited a member',
  member_joined: 'joined workspace',
  workspace_created: 'created a workspace',
  provider_added: 'added AI provider',
  login: 'logged in',
};

export function AdminDashboard({
  stats,
  users,
  workspaces,
  prds,
  activities,
  currentUserId,
}: AdminDashboardProps) {
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  function handleToggleAdmin(userId: string) {
    setPendingId(userId);
    startTransition(async () => {
      const result = await toggleSuperAdmin(userId);
      if (result.error) toast.error(result.error);
      else toast.success('Admin status updated');
      setPendingId(null);
    });
  }

  function handleToggleUser(userId: string) {
    setPendingId(userId);
    startTransition(async () => {
      const result = await toggleUserStatus(userId);
      if (result.error) toast.error(result.error);
      else toast.success(result.disabled ? 'User disabled' : 'User enabled');
      setPendingId(null);
    });
  }

  return (
    <div className="mx-auto max-w-6xl p-lg">
      <div className="mb-lg">
        <h1 className="font-display text-2xl font-bold text-ink-primary">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-ink-secondary">System overview and management</p>
      </div>

      {/* Stats */}
      <div className="mb-lg grid grid-cols-4 gap-md">
        {[
          { label: 'Total Users', value: stats.totalUsers, icon: Users },
          { label: 'Workspaces', value: stats.totalWorkspaces, icon: Building2 },
          { label: 'Total PRDs', value: stats.totalPRDs, icon: FileText },
          { label: 'AI Runs', value: stats.totalAIRuns, icon: Sparkles },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-md p-lg">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-bg-elevated">
                <stat.icon size={22} className="text-ink-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-ink-primary">{stat.value}</p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-ink-tertiary">
                  {stat.label}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
          <TabsTrigger value="workspaces">Workspaces ({workspaces.length})</TabsTrigger>
          <TabsTrigger value="prds">PRDs ({prds.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-subtle">
                    <th className="px-lg py-2.5 text-left font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
                      User
                    </th>
                    <th className="px-lg py-2.5 text-left font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
                      Email
                    </th>
                    <th className="px-lg py-2.5 text-left font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
                      Status
                    </th>
                    <th className="px-lg py-2.5 text-left font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
                      Joined
                    </th>
                    <th className="px-lg py-2.5 text-left font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
                      Role
                    </th>
                    <th className="px-lg py-2.5 text-right font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-subtle last:border-0 hover:bg-bg-surface"
                    >
                      <td className="px-lg py-3">
                        <div className="flex items-center gap-sm">
                          <Avatar name={u.full_name ?? u.email} size="sm" />
                          <span className="text-sm text-ink-primary">
                            {u.full_name ?? 'No name'}
                          </span>
                        </div>
                      </td>
                      <td className="px-lg py-3 font-mono text-xs text-ink-secondary">{u.email}</td>
                      <td className="px-lg py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-xs ${u.onboarding_completed_at ? 'text-ink-secondary' : 'text-ink-tertiary'}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${u.onboarding_completed_at ? 'bg-sage-muted' : 'bg-amber-muted'}`}
                          />
                          {u.onboarding_completed_at ? 'Active' : 'Onboarding'}
                        </span>
                      </td>
                      <td className="px-lg py-3 font-mono text-xs text-ink-tertiary">
                        {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}
                      </td>
                      <td className="px-lg py-3">
                        {u.is_super_admin ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
                            <Shield size={12} /> Super Admin
                          </span>
                        ) : (
                          <span className="text-xs text-ink-tertiary">User</span>
                        )}
                      </td>
                      <td className="px-lg py-3 text-right">
                        {u.id !== currentUserId ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleAdmin(u.id)}
                              disabled={isPending && pendingId === u.id}
                              className="gap-1 text-xs"
                            >
                              {u.is_super_admin ? (
                                <>
                                  <ShieldOff size={13} /> Revoke
                                </>
                              ) : (
                                <>
                                  <Shield size={13} /> Make Admin
                                </>
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleUser(u.id)}
                              disabled={isPending && pendingId === u.id}
                              className="gap-1 text-xs text-red-muted"
                            >
                              <UserX size={13} /> Disable
                            </Button>
                          </div>
                        ) : (
                          <span className="font-mono text-[11px] text-ink-quaternary">You</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workspaces Tab */}
        <TabsContent value="workspaces">
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-subtle">
                    <th className="px-lg py-2.5 text-left font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
                      Workspace
                    </th>
                    <th className="px-lg py-2.5 text-left font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
                      Slug
                    </th>
                    <th className="px-lg py-2.5 text-left font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
                      Owner
                    </th>
                    <th className="px-lg py-2.5 text-left font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {workspaces.map((ws) => (
                    <tr
                      key={ws.id}
                      className="border-b border-subtle last:border-0 hover:bg-bg-surface"
                    >
                      <td className="px-lg py-3">
                        <div className="flex items-center gap-sm">
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-xs font-bold text-white">
                            {ws.name[0]}
                          </div>
                          <span className="text-sm font-medium text-ink-primary">{ws.name}</span>
                        </div>
                      </td>
                      <td className="px-lg py-3 font-mono text-xs text-ink-tertiary">{ws.slug}</td>
                      <td className="px-lg py-3 text-sm text-ink-secondary">{ws.ownerName}</td>
                      <td className="px-lg py-3 font-mono text-xs text-ink-tertiary">
                        {formatDistanceToNow(new Date(ws.created_at), { addSuffix: true })}
                      </td>
                    </tr>
                  ))}
                  {workspaces.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-lg py-8 text-center text-sm text-ink-tertiary">
                        No workspaces yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRDs Tab */}
        <TabsContent value="prds">
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-subtle">
                    <th className="px-lg py-2.5 text-left font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
                      Title
                    </th>
                    <th className="px-lg py-2.5 text-left font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
                      Status
                    </th>
                    <th className="px-lg py-2.5 text-left font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
                      Health
                    </th>
                    <th className="px-lg py-2.5 text-left font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
                      Owner
                    </th>
                    <th className="px-lg py-2.5 text-left font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
                      Workspace
                    </th>
                    <th className="px-lg py-2.5 text-left font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
                      Updated
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {prds.map((prd) => (
                    <tr
                      key={prd.id}
                      className="border-b border-subtle last:border-0 hover:bg-bg-surface"
                    >
                      <td className="px-lg py-3 text-sm font-medium text-ink-primary">
                        {prd.title}
                      </td>
                      <td className="px-lg py-3">
                        <Pill status={prd.status as Parameters<typeof Pill>[0]['status']} />
                      </td>
                      <td className="px-lg py-3">
                        {prd.health_score !== null ? (
                          <span className="font-mono text-xs text-ink-secondary">
                            {prd.health_score}%
                          </span>
                        ) : (
                          <span className="font-mono text-xs text-ink-quaternary">—</span>
                        )}
                      </td>
                      <td className="px-lg py-3 text-sm text-ink-secondary">{prd.ownerName}</td>
                      <td className="px-lg py-3 font-mono text-xs text-ink-tertiary">
                        {prd.workspaceName}
                      </td>
                      <td className="px-lg py-3 font-mono text-xs text-ink-tertiary">
                        {formatDistanceToNow(new Date(prd.updated_at), { addSuffix: true })}
                      </td>
                    </tr>
                  ))}
                  {prds.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-lg py-8 text-center text-sm text-ink-tertiary">
                        No PRDs yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardContent className="p-lg">
              {activities.length === 0 ? (
                <p className="py-8 text-center text-sm text-ink-tertiary">No activity yet</p>
              ) : (
                <div className="space-y-3">
                  {activities.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-start gap-3 rounded-md px-3 py-2 hover:bg-bg-surface"
                    >
                      <Avatar name={a.actorName} size="sm" />
                      <div className="flex-1">
                        <p className="text-sm text-ink-primary">
                          <span className="font-medium">{a.actorName}</span>{' '}
                          <span className="text-ink-secondary">{VERB_MAP[a.type] ?? a.type}</span>
                          {a.workspaceName && (
                            <span className="text-ink-tertiary"> in {a.workspaceName}</span>
                          )}
                        </p>
                        <p className="font-mono text-[11px] text-ink-tertiary">
                          {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
