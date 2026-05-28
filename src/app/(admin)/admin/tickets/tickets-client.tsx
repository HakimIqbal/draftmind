'use client';

import { useState, useTransition, useEffect, useCallback, useRef } from 'react';
import { CircleDot, Clock, CheckCircle2, Building2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';
import { updateTicketStatus, getAllTickets, type AdminTicket } from './actions';

const CATEGORY_LABELS: Record<AdminTicket['category'], string> = {
  bug: 'Bug / Error',
  access: 'Access & Permission',
  password: 'Reset Password',
  question: 'General Question',
  other: 'Other',
};

const STATUS_CONFIG = {
  open: {
    label: 'Open',
    icon: CircleDot,
    iconClass: 'text-blue-500',
    badgeClass: 'bg-blue-50 text-blue-600',
    dotClass: 'bg-blue-500',
  },
  in_progress: {
    label: 'In Progress',
    icon: Clock,
    iconClass: 'text-amber-500',
    badgeClass: 'bg-amber-50 text-amber-600',
    dotClass: 'bg-amber-500',
  },
  resolved: {
    label: 'Resolved',
    icon: CheckCircle2,
    iconClass: 'text-emerald-500',
    badgeClass: 'bg-emerald-50 text-emerald-600',
    dotClass: 'bg-emerald-500',
  },
};

type Filter = 'all' | AdminTicket['status'];

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function fullDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function initials(name: string | null, email?: string | null) {
  if (name)
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  if (email) return email[0]!.toUpperCase();
  return '?';
}

interface DetailPanelProps {
  ticket: AdminTicket;
  onStatusUpdated: (tickets: AdminTicket[]) => void;
}

function DetailPanel({ ticket, onStatusUpdated }: DetailPanelProps) {
  const [selectedStatus, setSelectedStatus] = useState<AdminTicket['status']>(ticket.status);
  const [isPending, startTransition] = useTransition();

  const hasChanged = selectedStatus !== ticket.status;
  const cfg = STATUS_CONFIG[ticket.status];

  function handleUpdate() {
    startTransition(async () => {
      const result = await updateTicketStatus(ticket.id, selectedStatus);
      if (!result.success) {
        toast.error(result.error ?? 'Failed to update status');
        return;
      }
      toast.success('Ticket status updated');
      const fresh = await getAllTickets();
      onStatusUpdated(fresh);
    });
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-[#f0f0ee] px-6 py-5">
        <h2 className="text-[15px] font-semibold leading-snug text-[#1a1a1a]">{ticket.subject}</h2>
        <div className="mt-1 flex items-center gap-2">
          <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-medium', cfg.badgeClass)}>
            {cfg.label}
          </span>
          <span className="text-[11px] text-[#bbb]">{CATEGORY_LABELS[ticket.category]}</span>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
        {/* User info */}
        <div className="flex items-center gap-3">
          {ticket.user_avatar_url ? (
            <img
              src={ticket.user_avatar_url}
              alt={ticket.user_name ?? ticket.user_email}
              className="h-9 w-9 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-[12px] font-bold text-white">
              {initials(ticket.user_name, ticket.user_email)}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[#1a1a1a]">
              {ticket.user_name ?? 'Unknown'}
            </p>
            <p className="text-[11px] text-[#999]">{ticket.user_email}</p>
          </div>
        </div>

        {/* Workspace */}
        <div className="flex items-center gap-2">
          {ticket.workspace_icon_url ? (
            <img
              src={ticket.workspace_icon_url}
              alt={ticket.workspace_name ?? ''}
              className="h-4 w-4 flex-shrink-0 rounded object-cover"
            />
          ) : (
            <Building2 size={13} className="text-[#bbb]" />
          )}
          {ticket.workspace_name ? (
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-600">
              {ticket.workspace_name}
            </span>
          ) : (
            <span className="rounded-full bg-[#f0f0ee] px-2.5 py-0.5 text-[11px] text-[#aaa]">
              No workspace
            </span>
          )}
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-3 text-[12px]">
          <div>
            <p className="text-[#aaa]">Kategori</p>
            <p className="font-medium text-[#444]">{CATEGORY_LABELS[ticket.category]}</p>
          </div>
          <div>
            <p className="text-[#aaa]">Dikirim</p>
            <p className="font-medium text-[#444]" suppressHydrationWarning>
              {fullDate(ticket.created_at)}
            </p>
          </div>
        </div>

        {/* Message */}
        <div>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-[#aaa]">
            Pesan
          </p>
          <div className="whitespace-pre-wrap rounded-xl bg-[#f8f8f7] px-4 py-3 text-[13px] leading-relaxed text-[#444]">
            {ticket.message}
          </div>
        </div>
      </div>

      {/* Footer — status updater */}
      <div className="space-y-3 border-t border-[#f0f0ee] px-6 py-4">
        <p className="text-[12px] font-medium text-[#555]">Update status</p>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as AdminTicket['status'])}
          className="w-full rounded-lg border border-[#e8e8e6] bg-white px-3 py-2 text-[13px] text-[#1a1a1a] outline-none focus:border-accent"
        >
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>

        {/* Amber note */}
        <div className="flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
          <AlertTriangle size={12} className="mt-0.5 shrink-0 text-amber-500" />
          <span>
            Notification is automatically sent to user when status changes to In Progress or
            Resolved.
          </span>
        </div>

        <button
          onClick={handleUpdate}
          disabled={!hasChanged || isPending}
          className="w-full rounded-lg bg-accent py-2 text-[13px] font-medium text-white transition-opacity disabled:opacity-40"
        >
          {isPending ? 'Saving...' : 'Update Status'}
        </button>
      </div>
    </div>
  );
}

interface AdminTicketsClientProps {
  initialTickets: AdminTicket[];
}

export function AdminTicketsClient({ initialTickets }: AdminTicketsClientProps) {
  const [tickets, setTickets] = useState(initialTickets);
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(initialTickets[0]?.id ?? null);

  // Unique channel name per mount — prevents channel conflicts from React Strict Mode
  // double-invoke or rapid SPA navigation where removeChannel() is still async-pending.
  const channelId = useRef(`admin-tickets-${crypto.randomUUID()}`);

  const refresh = useCallback(async () => {
    try {
      const fresh = await getAllTickets();
      setTickets(fresh);
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[AdminTickets] refresh failed:', err);
      }
    }
  }, []);

  // Realtime subscription — instant update when Supabase delivers the event.
  // event: '*' covers INSERT (new ticket) + UPDATE (status change by another admin session).
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(channelId.current)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
        void refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  // Polling fallback — ensures new tickets appear within 5s regardless of Realtime.
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      void refresh();
    }, 5_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const openCount = tickets.filter((t) => t.status === 'open').length;

  const filtered = filter === 'all' ? tickets : tickets.filter((t) => t.status === filter);

  const selectedTicket = tickets.find((t) => t.id === selectedId) ?? null;

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'resolved', label: 'Resolved' },
  ];

  return (
    <div className="flex h-[calc(100dvh-64px)] min-h-[600px] flex-col overflow-hidden rounded-xl border border-[#eeeeed] lg:flex-row">
      {/* LEFT — list panel */}
      <div className="flex w-[340px] shrink-0 flex-col border-r border-[#eeeeed]">
        {/* Panel header */}
        <div className="border-b border-[#f0f0ee] px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-[15px] font-bold text-[#1a1a1a]">Tickets</h1>
            {openCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-100 px-1.5 text-[11px] font-semibold text-blue-600">
                {openCount}
              </span>
            )}
          </div>

          {/* Filter chips */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={cn(
                  'rounded-full px-3 py-1 text-[11px] font-medium transition-colors',
                  filter === key
                    ? 'bg-accent text-white'
                    : 'bg-[#f0f0ee] text-[#666] hover:bg-[#e8e8e6]',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Ticket list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex h-full items-center justify-center text-[13px] text-[#bbb]">
              No tickets
            </div>
          ) : (
            filtered.map((ticket) => {
              const cfg = STATUS_CONFIG[ticket.status];
              const Icon = cfg.icon;
              const isSelected = ticket.id === selectedId;
              return (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedId(ticket.id)}
                  className={cn(
                    'w-full border-b border-[#f5f5f3] px-5 py-4 text-left transition-colors hover:bg-[#fafaf9]',
                    isSelected && 'border-l-2 border-l-accent bg-blue-50/40 hover:bg-blue-50/40',
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <Icon size={15} className={cn('mt-0.5 shrink-0', cfg.iconClass)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-[#1a1a1a]">
                        {ticket.subject}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-[#888]">
                        {ticket.message}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-[11px] text-[#999]">
                          {ticket.user_name ?? ticket.user_email}
                        </span>
                        <span
                          className={cn(
                            'rounded-md px-1.5 py-0.5 text-[10px] font-medium',
                            cfg.badgeClass,
                          )}
                        >
                          {cfg.label}
                        </span>
                        <span suppressHydrationWarning className="ml-auto text-[10px] text-[#ccc]">
                          {relativeTime(ticket.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT — detail panel */}
      <div className="flex min-w-0 flex-1 flex-col bg-white">
        {selectedTicket ? (
          <DetailPanel
            key={selectedTicket.id}
            ticket={selectedTicket}
            onStatusUpdated={(fresh) => {
              setTickets(fresh);
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[13px] text-[#bbb]">
            Pilih ticket untuk melihat detail
          </div>
        )}
      </div>
    </div>
  );
}
