'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/auth/permissions';

async function requireSuperAdmin() {
  const user = await requireUser();
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();
  if (!profile?.is_super_admin) throw new Error('Not authorized');
  return user;
}

export type AdminTicket = {
  id: string;
  user_id: string;
  category: 'bug' | 'access' | 'password' | 'question' | 'other';
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
  updated_at: string;
  user_name: string | null;
  user_email: string;
  user_avatar_url: string | null;
  workspace_name: string | null;
  workspace_icon_url: string | null;
};

export async function getAdminOpenTicketCount(): Promise<number> {
  await requireSuperAdmin();
  const admin = createAdminClient();
  const { count } = await admin
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'open');
  return count ?? 0;
}

export async function getAllTickets(): Promise<AdminTicket[]> {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const { data: tickets } = await admin
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false });

  if (!tickets || tickets.length === 0) return [];

  const userIds = [...new Set(tickets.map((t) => t.user_id as string))];

  // Fetch profiles for all ticket owners
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, full_name, email, avatar_url')
    .in('id', userIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  // Fetch first workspace per user
  const { data: members } = await admin
    .from('workspace_members')
    .select('user_id, workspace_id, workspaces(name, icon_custom_url)')
    .in('user_id', userIds);

  // Build map: user_id → first workspace name + icon
  const wsMap = new Map<string, string>();
  const wsIconMap = new Map<string, string>();
  for (const m of members ?? []) {
    if (!wsMap.has(m.user_id as string)) {
      const ws = m.workspaces as { name?: string; icon_custom_url?: string | null } | null;
      const wsName = ws?.name ?? null;
      const wsIcon = ws?.icon_custom_url ?? null;
      if (wsName) {
        wsMap.set(m.user_id as string, wsName);
        if (wsIcon) wsIconMap.set(m.user_id as string, wsIcon);
      }
    }
  }

  return tickets.map((t) => {
    const profile = profileMap.get(t.user_id as string);
    return {
      id: t.id as string,
      user_id: t.user_id as string,
      category: t.category as AdminTicket['category'],
      subject: t.subject as string,
      message: t.message as string,
      status: t.status as AdminTicket['status'],
      created_at: t.created_at as string,
      updated_at: t.updated_at as string,
      user_name: profile?.full_name ?? null,
      user_email: profile?.email ?? '',
      user_avatar_url: profile?.avatar_url ?? null,
      workspace_name: wsMap.get(t.user_id as string) ?? null,
      workspace_icon_url: wsIconMap.get(t.user_id as string) ?? null,
    };
  });
}

export async function updateTicketStatus(
  ticketId: string,
  status: 'open' | 'in_progress' | 'resolved',
): Promise<{ success: boolean; error?: string }> {
  const user = await requireSuperAdmin();
  const admin = createAdminClient();

  // Fetch current ticket to get subject and user_id
  const { data: ticket } = await admin
    .from('tickets')
    .select('subject, user_id, status')
    .eq('id', ticketId)
    .single();

  if (!ticket) return { success: false, error: 'Ticket tidak ditemukan' };
  if (ticket.status === status) return { success: true };

  const { error } = await admin
    .from('tickets')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', ticketId);

  if (error) return { success: false, error: 'Failed to update ticket status' };

  // Send notification to user (only for in_progress and resolved)
  if (status === 'in_progress' || status === 'resolved') {
    const subject = ticket.subject as string;

    const { data: adminProfile } = await admin
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();
    const adminName = adminProfile?.full_name ?? 'Admin';

    const notifPayload =
      status === 'in_progress'
        ? {
            title: 'Ticket in progress',
            body: `Your ticket "${subject}" is being handled by ${adminName}.`,
          }
        : {
            title: 'Ticket resolved',
            body: `Your ticket "${subject}" has been resolved by ${adminName}.`,
          };

    const { error: notifError } = await admin.from('notifications').insert({
      recipient_id: ticket.user_id as string,
      type: 'ticket_update',
      title: notifPayload.title,
      body: notifPayload.body,
      resource_type: 'ticket',
      resource_id: ticketId,
      action_url: '/tickets',
    });

    if (notifError) {
      console.error('[TICKET NOTIF ERROR]', notifError.message);
    }
  }

  return { success: true };
}
