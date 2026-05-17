'use server';

import { requireUser } from '@/lib/auth/permissions';
import { createClient } from '@/lib/supabase/server';

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
  const supabase = await createClient();

  const { data } = await supabase
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

  const { error } = await supabase.from('tickets').insert({
    user_id: user.id,
    category: input.category,
    subject: input.subject.trim(),
    message: input.message.trim(),
  });

  if (error) return { success: false, error: 'Failed to submit ticket. Please try again.' };

  return { success: true };
}

export async function getUnresolvedTicketCount(): Promise<number> {
  const user = await requireUser();
  const supabase = await createClient();

  const { count } = await supabase
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .in('status', ['open', 'in_progress']);

  return count ?? 0;
}
