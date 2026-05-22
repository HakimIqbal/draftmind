'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Chip } from '@/components/ui/chip';
import {
  fetchSystemLogs,
  resolveLog,
  getLogStats,
  resolveAllLogs,
  getUnresolvedLogs,
} from './actions';

interface SystemLog {
  id: string;
  level: 'error' | 'warn' | 'info';
  source: string;
  message: string;
  metadata: Record<string, unknown>;
  user_id: string | null;
  workspace_id: string | null;
  resolved_at: string | null;
  created_at: string;
}

const LEVEL_STYLES: Record<string, { dot: string; bg: string; label: string }> = {
  error: { dot: 'bg-red-500', bg: 'bg-red-50 dark:bg-red-950/20', label: 'ERROR' },
  warn: { dot: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20', label: 'WARNING' },
  info: { dot: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20', label: 'INFO' },
};

function relativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [filter, setFilter] = useState<'all' | 'error' | 'warn' | 'info'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved');
  const [stats, setStats] = useState({ unresolvedErrors: 0, unresolvedWarnings: 0, totalToday: 0 });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyModalContent, setCopyModalContent] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const copyToastRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTextareaRef = useRef<HTMLTextAreaElement>(null);

  const loadData = useCallback(async () => {
    try {
      const [logsResult, statsResult] = await Promise.all([
        fetchSystemLogs({ level: filter, status: statusFilter, limit: 100 }),
        getLogStats(),
      ]);
      if (!logsResult.error) {
        setLogs(logsResult.logs as SystemLog[]);
      }
      setStats(statsResult);
    } catch {
      // Silently fail on polling errors — don't crash the page
    }
  }, [filter, statusFilter]);

  useEffect(() => {
    loadData();
    pollRef.current = setInterval(loadData, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadData]);

  useEffect(() => {
    if (showCopyModal && copyTextareaRef.current) {
      setTimeout(() => {
        copyTextareaRef.current?.focus();
        copyTextareaRef.current?.select();
      }, 50);
    }
  }, [showCopyModal]);

  const handleResolve = async (logId: string) => {
    await resolveLog(logId);
    loadData();
  };

  const handleMarkAllResolved = async () => {
    setResolving(true);
    await resolveAllLogs();
    setResolving(false);
    setShowConfirm(false);
    loadData();
  };

  const buildExportPayload = async () => {
    const unresolvedLogs = await getUnresolvedLogs();
    return JSON.stringify(
      {
        exported_at: new Date().toISOString(),
        total_unresolved: unresolvedLogs.length,
        errors: unresolvedLogs.map((l) => ({
          id: l.id,
          source: l.source,
          message: l.message,
          level: l.level,
          created_at: l.created_at,
        })),
      },
      null,
      2,
    );
  };

  const handleDownload = async () => {
    const json = await buildExportPayload();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `draftmind-errors-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    const json = await buildExportPayload();
    let success = false;
    try {
      await navigator.clipboard.writeText(json);
      success = true;
    } catch {
      const el = document.createElement('textarea');
      el.value = json;
      el.style.cssText = 'position:absolute;left:-9999px;top:-9999px';
      document.body.appendChild(el);
      el.focus();
      el.select();
      try {
        success = document.execCommand('copy');
      } catch {}
      document.body.removeChild(el);
    }
    if (success) {
      if (copyToastRef.current) clearTimeout(copyToastRef.current);
      setCopied(true);
      copyToastRef.current = setTimeout(() => setCopied(false), 2000);
    } else {
      setCopyModalContent(json);
      setShowCopyModal(true);
    }
  };

  const hasUnresolved = stats.unresolvedErrors > 0;
  const totalUnresolved = stats.unresolvedErrors + stats.unresolvedWarnings;

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      {/* Copy fallback modal (Safari / no clipboard access) */}
      {showCopyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-[480px] rounded-xl border border-[#eee] bg-white p-6 shadow-xl">
            <h3 className="text-[15px] font-semibold text-[#1a1a1a]">Copy to clipboard</h3>
            <p className="mt-1 text-[13px] text-[#666]">
              Automatic copy failed. Select all and copy manually (Cmd+A, Cmd+C).
            </p>
            <textarea
              ref={copyTextareaRef}
              readOnly
              value={copyModalContent}
              onFocus={(e) => e.target.select()}
              className="mt-3 h-48 w-full resize-none rounded-lg border border-[#eee] bg-[#fafaf9] p-3 font-mono text-[11px] text-[#1a1a1a] focus:outline-none"
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowCopyModal(false)}
                className="rounded-lg border border-[#eee] px-4 py-2 text-[12px] font-medium text-[#666] hover:bg-[#f5f5f5]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm dialog overlay */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-[380px] rounded-xl border border-[#eee] bg-white p-6 shadow-xl">
            <h3 className="text-[15px] font-semibold text-[#1a1a1a]">Mark all as resolved?</h3>
            <p className="mt-2 text-[13px] text-[#666]">
              Mark all {totalUnresolved} unresolved errors/warnings as resolved? This cannot be
              undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="rounded-lg border border-[#eee] px-4 py-2 text-[12px] font-medium text-[#666] hover:bg-[#f5f5f5]"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAllResolved}
                disabled={resolving}
                className="rounded-lg bg-red-500 px-4 py-2 text-[12px] font-medium text-white hover:bg-red-600 disabled:opacity-60"
              >
                {resolving ? 'Resolving...' : 'Yes, mark all resolved'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-[#1a1a1a]">System Logs</h1>
          <p className="mt-0.5 text-xs text-[#888]">
            Real-time system monitoring - auto-refreshes every 5s
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            {stats.unresolvedErrors > 0 && (
              <span className="flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                {stats.unresolvedErrors} unresolved errors
              </span>
            )}
            {stats.unresolvedWarnings > 0 && (
              <span className="flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                {stats.unresolvedWarnings} warnings
              </span>
            )}
            <span className="text-xs text-[#888]">{stats.totalToday} events today</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfirm(true)}
              disabled={totalUnresolved === 0}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[12px] font-medium text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Mark All Resolved
            </button>
            <button
              onClick={handleDownload}
              disabled={!hasUnresolved}
              title={!hasUnresolved ? 'No unresolved errors to export' : undefined}
              className="rounded-lg border border-[#eee] bg-white px-3 py-1.5 text-[12px] font-medium text-[#555] transition-colors hover:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Download
            </button>
            <div className="relative">
              <button
                onClick={handleCopy}
                disabled={!hasUnresolved}
                title={!hasUnresolved ? 'No unresolved errors to export' : undefined}
                className="rounded-lg border border-[#eee] bg-white px-3 py-1.5 text-[12px] font-medium text-[#555] transition-colors hover:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="mb-4 flex flex-wrap items-center gap-4 border-b border-[#eee] pb-3">
        <div className="flex items-center gap-1">
          {(['unresolved', 'all', 'resolved'] as const).map((status) => (
            <Chip key={status} active={statusFilter === status} onClick={() => setStatusFilter(status)}>
              {status === 'unresolved' ? 'Unresolved' : status === 'resolved' ? 'Resolved' : 'All history'}
            </Chip>
          ))}
        </div>
        <div className="h-5 w-px bg-[#eee]" />
        <div className="flex items-center gap-1">
          {(['all', 'error', 'warn', 'info'] as const).map((level) => (
            <Chip key={level} active={filter === level} onClick={() => setFilter(level)}>
              {level === 'all'
                ? 'All levels'
                : level === 'warn'
                  ? 'Warning'
                  : level.charAt(0).toUpperCase() + level.slice(1)}
            </Chip>
          ))}
        </div>
      </div>

      {/* Logs list */}
      {logs.length === 0 ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-sm text-[#888]">
            {statusFilter === 'unresolved' ? 'No unresolved system logs found' : 'No system logs found'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {logs.map((log) => {
            const style = LEVEL_STYLES[log.level] ?? {
              dot: 'bg-blue-500',
              bg: 'bg-blue-50',
              label: 'INFO',
            };
            const isExpanded = expandedId === log.id;
            const isResolved = !!log.resolved_at;

            return (
              <div
                key={log.id}
                className={`rounded-lg border border-[#eee] transition-colors ${isResolved ? 'opacity-50' : ''} ${isExpanded ? style.bg : 'bg-white hover:bg-[#fafaf9]'}`}
              >
                {/* Main row */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`} />
                  <span className="w-14 shrink-0 font-mono text-[10px] font-semibold uppercase text-[#888]">
                    {style.label}
                  </span>
                  <span className="w-32 shrink-0 truncate font-mono text-[11px] text-[#666]">
                    {log.source}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-[#1a1a1a]">
                    {log.message}
                  </span>
                  {isResolved && (
                    <span className="shrink-0 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium uppercase text-emerald-700">
                      Resolved
                    </span>
                  )}
                  <span className="shrink-0 font-mono text-[10px] text-[#999]">
                    {relativeTime(log.created_at)}
                  </span>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-[#eee] px-4 py-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="font-mono text-[10px] uppercase text-[#999]">Source</span>
                        <p className="mt-0.5 text-[#1a1a1a]">{log.source}</p>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] uppercase text-[#999]">Time</span>
                        <p className="mt-0.5 text-[#1a1a1a]" suppressHydrationWarning>
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                      {log.user_id && (
                        <div>
                          <span className="font-mono text-[10px] uppercase text-[#999]">
                            User ID
                          </span>
                          <p className="mt-0.5 font-mono text-[11px] text-[#1a1a1a]">
                            {log.user_id}
                          </p>
                        </div>
                      )}
                      {log.workspace_id && (
                        <div>
                          <span className="font-mono text-[10px] uppercase text-[#999]">
                            Workspace ID
                          </span>
                          <p className="mt-0.5 font-mono text-[11px] text-[#1a1a1a]">
                            {log.workspace_id}
                          </p>
                        </div>
                      )}
                    </div>

                    {Object.keys(log.metadata).length > 0 && (
                      <div className="mt-3">
                        <span className="font-mono text-[10px] uppercase text-[#999]">
                          Metadata
                        </span>
                        <pre className="mt-1 max-h-40 overflow-auto rounded bg-[#1a1a1a] p-3 font-mono text-[11px] text-[#e5e5e5]">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase text-[#999]">
                        Full message
                      </span>
                      <p className="mt-0.5 text-xs text-[#1a1a1a]">{log.message}</p>
                    </div>

                    {!isResolved && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResolve(log.id);
                        }}
                        className="mt-3 rounded border border-[#ddd] px-3 py-1 text-xs text-[#666] transition-colors hover:bg-[#f5f5f5] hover:text-[#1a1a1a]"
                      >
                        Mark as resolved
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
