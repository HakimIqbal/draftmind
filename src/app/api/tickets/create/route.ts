import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logError } from '@/lib/logging/system-log';
import { logActivity } from '@/lib/logging/activity-log';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { category?: string; subject?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const allowed = new Set(['bug', 'access', 'password', 'question', 'other']);
  const category = allowed.has(body.category ?? '')
    ? (body.category as 'bug' | 'access' | 'password' | 'question' | 'other')
    : 'question';
  const subject = (body.subject ?? '').trim();
  const message = (body.message ?? '').trim();
  if (!subject) return NextResponse.json({ error: 'Subject required' }, { status: 400 });
  if (message.length < 20)
    return NextResponse.json({ error: 'Message too short' }, { status: 400 });

  const admin = createAdminClient();
  const { data: newTicket, error } = await admin
    .from('tickets')
    .insert({ user_id: user.id, category, subject, message })
    .select('id')
    .single();

  if (error || !newTicket) {
    logError(
      'api.ticket.create',
      error?.message ?? 'Unknown',
      { category, subject: subject.slice(0, 80) },
      user.id,
    );
    return NextResponse.json(
      { error: 'Failed to submit ticket. Please try again.' },
      { status: 400 },
    );
  }

  try {
    const { data: membership } = await admin
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
        metadata: { category, subject },
      });
    }
  } catch {
    // Activity log failure must not block ticket creation
  }

  // best-effort notification
  try {
    await admin.from('notifications').insert({
      recipient_id: user.id,
      type: 'ticket_submitted',
      title: 'Ticket received',
      body: `Your ticket "${subject}" has been received. We'll get back to you as soon as possible.`,
      resource_type: 'ticket',
      resource_id: newTicket.id,
      action_url: '/tickets',
    });
  } catch {
    // ignore
  }

  return NextResponse.json({ success: true, ticketId: newTicket.id });
}
