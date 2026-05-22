'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import {
  Send,
  Megaphone,
  Users,
  User,
  Briefcase,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  publishAnnouncement,
  getAnnouncementHistory,
  getUsers,
  deleteAnnouncement,
} from './actions';

interface UserOption {
  id: string;
  full_name: string | null;
  email: string;
  role_self_reported: string | null;
}

interface HistoryItem {
  id: string;
  title: string;
  message: string;
  target: 'all' | 'role' | 'user';
  target_value: string | null;
  created_at: string;
  recipient_count: number;
}

export default function AdminAnnouncementsPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<'all' | 'role' | 'user'>('all');
  const [targetValue, setTargetValue] = useState('');
  const [isPending, startTransition] = useTransition();

  const [users, setUsers] = useState<UserOption[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    async function load() {
      const [userList, historyList] = await Promise.all([getUsers(), getAnnouncementHistory()]);

      setUsers(userList);
      setRoles([...new Set(userList.map((u) => u.role_self_reported).filter(Boolean) as string[])]);
      setHistory(historyList);
    }
    load();
  }, [isPending]);

  function handlePublish() {
    if (!title.trim() || !message.trim()) return;
    if ((target === 'role' || target === 'user') && !targetValue) {
      toast.error(`Please select a ${target}`);
      return;
    }

    startTransition(async () => {
      const result = await publishAnnouncement({
        title: title.trim(),
        message: message.trim(),
        target,
        targetValue: targetValue || undefined,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Sent to ${result.count} user${result.count !== 1 ? 's' : ''}`);
        setTitle('');
        setMessage('');
        setTarget('all');
        setTargetValue('');
      }
    });
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[22px] font-bold text-[#1a1a1a]">Announcements</h1>
        <p className="mt-0.5 text-[13px] text-[#888]">Send notifications to users</p>
      </div>

      {/* Create */}
      <div className="rounded-xl border border-[#eee] bg-white p-6">
        <div className="mb-5 flex items-center gap-2">
          <Megaphone size={16} className="text-accent" />
          <h2 className="text-[14px] font-semibold text-[#1a1a1a]">New Announcement</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[#1a1a1a]">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title"
              className="focus:ring-accent/30 h-10 w-full rounded-lg border border-[#e5e5e3] bg-white px-3 text-[13px] text-[#1a1a1a] placeholder:text-[#bbb] focus:border-accent focus:outline-none focus:ring-1"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[#1a1a1a]">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your announcement..."
              rows={3}
              className="focus:ring-accent/30 w-full rounded-lg border border-[#e5e5e3] bg-white px-3 py-2.5 text-[13px] text-[#1a1a1a] placeholder:text-[#bbb] focus:border-accent focus:outline-none focus:ring-1"
            />
          </div>

          {/* Target */}
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[#1a1a1a]">Send to</label>
            <div className="flex gap-2">
              {[
                { key: 'all' as const, icon: Users, label: 'All users' },
                { key: 'role' as const, icon: Briefcase, label: 'By role' },
                { key: 'user' as const, icon: User, label: 'Specific user' },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => {
                    setTarget(t.key);
                    setTargetValue('');
                  }}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[12px] font-medium transition-colors ${
                    target === t.key
                      ? 'bg-accent/5 border-accent text-accent'
                      : 'border-[#e5e5e3] text-[#888] hover:border-[#ddd] hover:text-[#555]'
                  }`}
                >
                  <t.icon size={13} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {target === 'role' && (
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[#1a1a1a]">
                Select role
              </label>
              <select
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="focus:ring-accent/30 h-10 w-full rounded-lg border border-[#e5e5e3] bg-white px-3 text-[13px] text-[#1a1a1a] focus:border-accent focus:outline-none focus:ring-1"
              >
                <option value="">Choose a role...</option>
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          )}

          {target === 'user' && (
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[#1a1a1a]">
                Select user
              </label>
              <select
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="focus:ring-accent/30 h-10 w-full rounded-lg border border-[#e5e5e3] bg-white px-3 text-[13px] text-[#1a1a1a] focus:border-accent focus:outline-none focus:ring-1"
              >
                <option value="">Choose a user...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name ?? u.email} - {u.role_self_reported ?? 'No role'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handlePublish}
              disabled={isPending || !title.trim() || !message.trim()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#1a1a1a] px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-30"
            >
              <Send size={13} />
              {isPending ? 'Sending...' : 'Publish'}
            </button>
            <span className="text-[11px] text-[#bbb]">
              {target === 'all' &&
                `Will notify ${users.length} user${users.length !== 1 ? 's' : ''}`}
              {target === 'role' && targetValue && `Will notify all ${targetValue}s`}
              {target === 'user' && targetValue && 'Will notify 1 user'}
            </span>
          </div>
        </div>
      </div>

      {/* History */}
      <HistorySection
        history={history}
        page={page}
        perPage={perPage}
        onPageChange={setPage}
        onDeleted={() => startTransition(async () => setHistory(await getAnnouncementHistory()))}
      />
    </div>
  );
}

function HistorySection({
  history,
  page,
  perPage,
  onPageChange,
  onDeleted,
}: {
  history: HistoryItem[];
  page: number;
  perPage: number;
  onPageChange: (p: number) => void;
  onDeleted: () => void;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startDeleteTransition] = useTransition();

  function handleDelete(id: string) {
    if (!confirm('Delete this announcement and remove it from user notifications?')) return;
    setDeletingId(id);
    startDeleteTransition(async () => {
      const result = await deleteAnnouncement(id);
      setDeletingId(null);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Announcement deleted');
      onDeleted();
    });
  }
  const totalPages = Math.ceil(history.length / perPage);
  const paged = useMemo(() => {
    const start = (page - 1) * perPage;
    return history.slice(start, start + perPage);
  }, [history, page, perPage]);

  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-[#aaa]">
          History ({history.length})
        </p>
        {totalPages > 1 && (
          <p className="text-[11px] text-[#bbb]">
            Page {page} of {totalPages}
          </p>
        )}
      </div>

      {history.length === 0 ? (
        <div className="rounded-xl border border-[#eee] bg-white px-5 py-12 text-center">
          <Megaphone size={20} className="mx-auto text-[#ddd]" />
          <p className="mt-2 text-[13px] text-[#aaa]">No announcements sent yet</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-[#eee] bg-white">
            <div className="divide-y divide-[#f5f5f5]">
              {paged.map((h) => (
                <div key={h.id} className="px-5 py-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-medium text-[#1a1a1a]">{h.title}</p>
                      {h.message && <p className="mt-1 text-[12px] text-[#888]">{h.message}</p>}
                    </div>
                    <div className="ml-4 flex shrink-0 items-center gap-2">
                      <span className="rounded-md bg-[#f5f5f4] px-2 py-0.5 text-[11px] font-medium text-[#888]">
                        {h.recipient_count} user{h.recipient_count !== 1 ? 's' : ''}
                      </span>
                      <button
                        onClick={() => handleDelete(h.id)}
                        disabled={deletingId === h.id}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[#bbb] transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                        title="Delete announcement"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-[#bbb]">
                    <Clock size={10} />
                    <span className="text-[11px]" suppressHydrationWarning>
                      {new Date(h.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e5e5e3] text-[#999] transition-colors hover:border-[#ddd] hover:text-[#555] disabled:opacity-30"
              >
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => totalPages - i).map((p) => (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-[12px] font-medium transition-colors ${
                    p === page
                      ? 'bg-[#1a1a1a] text-white'
                      : 'border border-[#e5e5e3] text-[#888] hover:border-[#ddd] hover:text-[#555]'
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e5e5e3] text-[#999] transition-colors hover:border-[#ddd] hover:text-[#555] disabled:opacity-30"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
