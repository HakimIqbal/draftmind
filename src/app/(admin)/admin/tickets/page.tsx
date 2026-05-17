import { getAllTickets } from './actions';
import { AdminTicketsClient } from './tickets-client';

export const dynamic = 'force-dynamic';

export default async function AdminTicketsPage() {
  const tickets = await getAllTickets();
  return <AdminTicketsClient initialTickets={tickets} />;
}
