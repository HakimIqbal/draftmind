'use server';

import { requireUser } from '@/lib/auth/permissions';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logError } from '@/lib/logging/system-log';
import { logActivity } from '@/lib/logging/activity-log';

export type Ticket = {
  id: string;
  user_id: string;
  category: 'bug' | 'access' | 'password' | 'question' | 'other';
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
  updated_at: string;
};

export async function getMyTickets(): Promise<Ticket[]> {
  const user = await requireUser();
  const admin = createAdminClient();

  const { data } = await admin
    .from('tickets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (data ?? []) as Ticket[];
}

export async function submitTicket(input: {
  category: Ticket['category'];
  subject: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: newTicket, error } = await supabase
    .from('tickets')
    .insert({
      user_id: user.id,
      category: input.category,
      subject: input.subject.trim(),
      message: input.message.trim(),
    })
    .select('id')
    .single();

  if (error) {
    logError(
      'ticket.submit',
      error.message,
      {
        category: input.category,
        subject: input.subject?.slice(0, 80),
      },
      user.id,
    );
    return { success: false, error: 'Failed to submit ticket. Please try again.' };
  }

  try {
    const adminClient = createAdminClient();
    const { data: membership } = await adminClient
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (membership?.workspace_id) {
      await logActivity({
        workspaceId: membership.workspace_id as string,
        actorId: user.id,
        type: 'ticket_created',
        resourceType: 'ticket',
        resourceId: newTicket.id,
        metadata: { category: input.category, subject: input.subject.trim() },
      });
    }

    await adminClient.from('notifications').insert({
      recipient_id: user.id,
      type: 'ticket_submitted',
      title: 'Ticket received',
      body: `Your ticket "${input.subject.trim()}" has been received. We'll get back to you as soon as possible.`,
      resource_type: 'ticket',
      resource_id: newTicket.id,
      action_url: '/tickets',
    });
  } catch {
    // Notification failure must not block ticket submission
  }

  return { success: true };
}

export async function getUnresolvedTicketCount(): Promise<number> {
  const user = await requireUser();
  const admin = createAdminClient();

  const { count } = await admin
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .in('status', ['open', 'in_progress']);

  return count ?? 0;
}
