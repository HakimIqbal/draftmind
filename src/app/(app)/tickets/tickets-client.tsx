'use client';

import { useState, useTransition, useEffect } from 'react';
import { Plus, CircleDot, Clock, CheckCircle2, Ticket, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import { type Ticket as TicketType } from './actions';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/stores/user-store';

const CATEGORY_LABELS: Record<TicketType['category'], string> = {
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
    className: 'text-blue-500',
    badgeClass: 'bg-blue-50 text-blue-600',
  },
  in_progress: {
    label: 'In Progress',
    icon: Clock,
    className: 'text-amber-500',
    badgeClass: 'bg-amber-50 text-amber-600',
  },
  resolved: {
    label: 'Resolved',
    icon: CheckCircle2,
    className: 'text-emerald-500',
    badgeClass: 'bg-emerald-50 text-emerald-600',
  },
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

interface NewTicketModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function NewTicketModal({ onClose, onSuccess }: NewTicketModalProps) {
  const [category, setCategory] = useState<TicketType['category']>('question');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const canSubmit = subject.trim().length > 0 && message.trim().length >= 20 && !isPending;

  function handleSubmit() {
    startTransition(async () => {
      const res = await fetch('/api/tickets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, subject, message }),
      });

      const data = (await res.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
      } | null;

      if (!res.ok || !data?.success) {
        toast.error(data?.error ?? 'Failed to submit ticket.');
        return;
      }

      toast.success('Ticket submitted!');
      await onSuccess();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-[#f0f0ee] px-6 py-4">
          <h2 className="text-[15px] font-semibold text-[#1a1a1a]">New Support Ticket</h2>
          <p className="mt-0.5 text-[12px] text-[#999]">
            We&apos;ll get back to you as soon as possible.
          </p>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          {/* Category */}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#555]">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TicketType['category'])}
              className="w-full rounded-lg border border-[#e8e8e6] bg-white px-3 py-2 text-[13px] text-[#1a1a1a] outline-none focus:border-accent"
            >
              {(Object.entries(CATEGORY_LABELS) as [TicketType['category'], string][]).map(
                ([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#555]">
              Subject <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your issue"
              className="w-full rounded-lg border border-[#e8e8e6] px-3 py-2 text-[13px] text-[#1a1a1a] placeholder-[#bbb] outline-none focus:border-accent"
            />
          </div>

          {/* Message */}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#555]">
              Details <span className="text-red-400">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue in detail (min. 20 characters)"
              rows={4}
              className="w-full resize-none rounded-lg border border-[#e8e8e6] px-3 py-2 text-[13px] text-[#1a1a1a] placeholder-[#bbb] outline-none focus:border-accent"
            />
            <p
              className={cn(
                'mt-1 text-right text-[11px]',
                message.length >= 20 ? 'text-[#bbb]' : 'text-amber-500',
              )}
            >
              {message.length}/20 min
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-[#f0f0ee] px-6 py-4">
          <button
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg px-4 py-2 text-[13px] text-[#666] transition-colors hover:bg-[#f5f5f3]"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="rounded-lg bg-accent px-4 py-2 text-[13px] font-medium text-white transition-opacity disabled:opacity-40"
          >
            {isPending ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface TicketsPageClientProps {
  initialTickets: TicketType[];
  userId: string;
}

export function TicketsPageClient({ initialTickets, userId }: TicketsPageClientProps) {
  const [tickets, setTickets] = useState(initialTickets);
  const [modalOpen, setModalOpen] = useState(false);
  const setStoreTicketCount = useUserStore((s) => s.setOpenTicketCount);

  async function refreshTickets() {
    const res = await fetch('/api/tickets/list', { cache: 'no-store' });
    const data = (await res.json().catch(() => null)) as { tickets?: TicketType[] } | null;
    if (res.ok && data?.tickets) {
      setTickets(data.tickets);
      setStoreTicketCount(data.tickets.filter((ticket) => ticket.status !== 'resolved').length);
    }
  }

  useEffect(() => {
    void refreshTickets();
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`tickets-user-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tickets',
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          void refreshTickets();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <>
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#1a1a1a]">My Tickets</h1>
            <p className="mt-0.5 text-[13px] text-[#999]">Your support request history</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-[13px] font-medium text-white shadow-sm transition-opacity hover:opacity-90"
          >
            <Plus size={15} />
            New Ticket
          </button>
        </div>

        {/* List */}
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#e0e0de] py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f5f5f3]">
              <Ticket size={24} className="text-[#bbb]" />
            </div>
            <p className="text-[14px] font-medium text-[#666]">No tickets yet</p>
            <p className="mt-1 max-w-xs text-[12px] text-[#aaa]">
              Having an issue? Submit a ticket and we&apos;ll get back to you shortly.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-5 flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-[13px] font-medium text-white"
            >
              <Plus size={14} />
              Submit Your First Ticket
            </button>
          </div>
        ) : (
          <ul className="space-y-3">
            {tickets.map((ticket) => {
              const cfg = STATUS_CONFIG[ticket.status];
              const Icon = cfg.icon;
              return (
                <li
                  key={ticket.id}
                  className="rounded-xl border border-[#eeeeed] bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <Icon size={18} className={cn('mt-0.5 shrink-0', cfg.className)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[13px] font-semibold text-[#1a1a1a]">
                          {ticket.subject}
                        </p>
                        <span suppressHydrationWarning className="shrink-0 text-[11px] text-[#bbb]">
                          {relativeTime(ticket.created_at)}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-[12px] text-[#888]">
                        {ticket.message}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="rounded-md bg-[#f5f5f3] px-2 py-0.5 text-[11px] text-[#777]">
                          {CATEGORY_LABELS[ticket.category]}
                        </span>
                        <span
                          className={cn(
                            'rounded-md px-2 py-0.5 text-[11px] font-medium',
                            cfg.badgeClass,
                          )}
                        >
                          {cfg.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Info note */}
        {tickets.length > 0 && (
          <div className="mt-6 flex items-start gap-2 rounded-xl bg-[#fffbeb] px-4 py-3 text-[12px] text-amber-700">
            <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-500" />
            <span>You&apos;ll receive a notification when admin updates your ticket status.</span>
          </div>
        )}
      </div>

      {modalOpen && (
        <NewTicketModal
          onClose={() => setModalOpen(false)}
          onSuccess={async () => {
            await refreshTickets();
          }}
        />
      )}
    </>
  );
}
