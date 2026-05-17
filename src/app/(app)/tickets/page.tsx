import { requireUser } from '@/lib/auth/permissions';
import { getMyTickets } from './actions';
import { TicketsPageClient } from './tickets-client';

export const dynamic = 'force-dynamic';

export default async function TicketsPage() {
  const user = await requireUser();
  const tickets = await getMyTickets();

  return <TicketsPageClient initialTickets={tickets} userId={user.id} />;
}
