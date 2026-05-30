'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { ArrowLeft, MoreVertical, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { format, isToday, isYesterday, differenceInMinutes } from 'date-fns';
import { restoreVersion, renameVersion } from '@/app/(app)/prds/[prdId]/actions';
import { prdToTiptap } from '@/lib/prd/tiptap-content';
import { diffText, type DiffSegment } from '@/lib/utils/diff';
import type { PRDDocument } from '@/lib/prd/schema';

interface Version {
  id: string;
  version_number: number;
  content: Record<string, unknown>;
  change_summary: string | null;
  source: string;
  created_by: string | null;
  author_name: string;
  created_at: string;
}

interface HistoryViewProps {
  prdId: string;
  currentContent: Record<string, unknown> | null;
  onClose: () => void;
  onRestore: () => void;
}

// Group versions: if 2 adjacent versions are < 5 min apart, group them
interface VersionGroup {
  main: Version; // most recent in group
  children: Version[]; // older versions in same group
}

function groupVersions(versions: Version[]): { label: string; groups: VersionGroup[] }[] {
  if (versions.length === 0) return [];

  // First group by date
  const dateGroups: Map<string, Version[]> = new Map();
  for (const v of versions) {
    const d = new Date(v.created_at);
    let label: string;
    if (isToday(d)) label = 'Today';
    else if (isYesterday(d)) label = 'Yesterday';
    else label = format(d, 'EEEE'); // Day name for recent, or full date
    if (!dateGroups.has(label)) dateGroups.set(label, []);
    dateGroups.get(label)!.push(v);
  }

  // Then within each date, group by time proximity (< 5 min apart)
  const result: { label: string; groups: VersionGroup[] }[] = [];
  for (const [label, versions] of dateGroups) {
    const groups: VersionGroup[] = [];
    let currentGroup: Version[] = [versions[0]!];

    for (let i = 1; i < versions.length; i++) {
      const prev = new Date(versions[i - 1]!.created_at);
      const curr = new Date(versions[i]!.created_at);
      if (Math.abs(differenceInMinutes(prev, curr)) <= 5) {
        currentGroup.push(versions[i]!);
      } else {
        groups.push({ main: currentGroup[0]!, children: currentGroup.slice(1) });
        currentGroup = [versions[i]!];
      }
    }
    groups.push({ main: currentGroup[0]!, children: currentGroup.slice(1) });
    result.push({ label, groups });
  }

  return result;
}

// Render tiptap node as formatted React element
function renderNode(node: Record<string, unknown>, key: number): React.ReactNode {
  const type = node.type as string;
  const children = node.content as Record<string, unknown>[] | undefined;
  const text = children?.map((c) => (c.text as string) ?? '').join('') ?? '';
  const level = (node.attrs as { level?: number } | undefined)?.level;

  if (type === 'heading') {
    const Tag = `h${level ?? 2}` as 'h1' | 'h2' | 'h3';
    const sizes: Record<string, string> = {
      h1: 'text-xl font-bold mt-4 mb-2',
      h2: 'text-base font-bold mt-6 mb-2 pb-1 border-b border-subtle',
      h3: 'text-sm font-semibold mt-4 mb-1',
    };
    return (
      <Tag key={key} className={`${sizes[Tag] ?? 'text-sm font-semibold'} text-ink-primary`}>
        {text}
      </Tag>
    );
  }
  if (type === 'paragraph') {
    if (!text.trim()) return <div key={key} className="h-2" />;
    return (
      <p key={key} className="mb-1 text-[13px] leading-relaxed text-ink-secondary">
        {text}
      </p>
    );
  }
  if (type === 'bulletList' || type === 'orderedList') {
    const ListTag = type === 'bulletList' ? 'ul' : 'ol';
    return (
      <ListTag
        key={key}
        className={`mb-2 pl-5 text-[13px] text-ink-secondary ${type === 'bulletList' ? 'list-disc' : 'list-decimal'}`}
      >
        {children?.map((li, j) => {
          const liChildren = (li.content as Record<string, unknown>[]) ?? [];
          const liText = liChildren
            .map((c) => {
              const cc = (c.content as { text?: string }[]) ?? [];
              return cc.map((t) => t.text ?? '').join('');
            })
            .join('');
          return (
            <li key={j} className="mb-0.5">
              {liText}
            </li>
          );
        })}
      </ListTag>
    );
  }
  if (type === 'table') {
    return (
      <div key={key} className="my-3 overflow-x-auto">
        <table className="w-full border-collapse text-[12px]" style={{ tableLayout: 'fixed' }}>
          <tbody>
            {children?.map((row, ri) => {
              const cells = (row.content as Record<string, unknown>[]) ?? [];
              return (
                <tr key={ri}>
                  {cells.map((cell, ci) => {
                    const cellContent = (cell.content as Record<string, unknown>[]) ?? [];
                    const cellText = cellContent
                      .map((c) => {
                        const cc = (c.content as { text?: string }[]) ?? [];
                        return cc.map((t) => t.text ?? '').join('');
                      })
                      .join('');
                    const isHeader = (cell.type as string) === 'tableHeader';
                    return isHeader ? (
                      <th
                        key={ci}
                        className="break-words border border-[#ccc] bg-[#f5f5f4] px-2 py-1.5 text-left font-semibold text-ink-primary"
                      >
                        {cellText}
                      </th>
                    ) : (
                      <td
                        key={ci}
                        className="break-words border border-[#ccc] px-2 py-1.5 text-left text-ink-secondary"
                      >
                        {cellText}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
  return null;
}

function getNodes(content: Record<string, unknown>): Record<string, unknown>[] {
  // Already tiptap format
  const doc = content as { type?: string; content?: Record<string, unknown>[] };
  if (doc.type === 'doc' && Array.isArray(doc.content)) return doc.content;

  // PRDDocument format — use prdToTiptap for proper table/list rendering
  const sections = (content as { sections?: unknown }).sections;
  if (sections) {
    try {
      const tiptapDoc = prdToTiptap(content as PRDDocument);
      return tiptapDoc.content as unknown as Record<string, unknown>[];
    } catch (e) {
      console.error('prdToTiptap failed:', e);
      // Fallback: at least show section headings + text
      const nodes: Record<string, unknown>[] = [];
      for (const [key, val] of Object.entries(sections as Record<string, unknown>)) {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        nodes.push({
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: label }],
        });
        const text = typeof val === 'string' ? val : JSON.stringify(val, null, 0).slice(0, 200);
        nodes.push({ type: 'paragraph', content: [{ type: 'text', text }] });
      }
      return nodes;
    }
  }

  return [];
}

// Formatted content preview (headings, tables, lists — like editor)
function FormattedContentPreview({ content }: { content: Record<string, unknown> }) {
  const nodes = getNodes(content);
  if (nodes.length === 0) return <p className="text-sm text-ink-tertiary">Empty version</p>;
  return <>{nodes.map((n, i) => renderNode(n, i))}</>;
}

// ── Per-character diff helpers ──

function nt(node: Record<string, unknown>): string {
  const c = node.content as Record<string, unknown>[] | undefined;
  return c?.map((x) => (x.text as string) ?? '').join('') ?? '';
}

function ct(cell: Record<string, unknown>): string {
  const c = (cell.content as Record<string, unknown>[]) ?? [];
  return c
    .map((p) => {
      const t = (p.content as { text?: string }[]) ?? [];
      return t.map((x) => x.text ?? '').join('');
    })
    .join('');
}

function lt(li: Record<string, unknown>): string {
  const c = (li.content as Record<string, unknown>[]) ?? [];
  return c
    .map((p) => {
      const t = (p.content as { text?: string }[]) ?? [];
      return t.map((x) => x.text ?? '').join('');
    })
    .join('');
}

// Render diff segments as colored inline spans
function renderSegs(segs: DiffSegment[]): React.ReactNode {
  return segs.map((s, i) => {
    if (s.type === 'equal') return <span key={i}>{s.text}</span>;
    if (s.type === 'insert')
      return (
        <span key={i} className="rounded-sm bg-emerald-200/70 text-emerald-900">
          {s.text}
        </span>
      );
    if (s.type === 'delete')
      return (
        <span key={i} className="rounded-sm bg-red-200/70 text-red-700 line-through">
          {s.text}
        </span>
      );
    return null;
  });
}

// Diff or plain text — if old exists, diff per-char, otherwise just text
function diffOrPlain(oldStr: string | null, newStr: string): React.ReactNode {
  if (oldStr === null) return renderSegs([{ type: 'insert', text: newStr }]);
  if (!oldStr || oldStr === newStr) return newStr;
  return renderSegs(diffText(oldStr, newStr));
}

function normalizeDiffText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function textSimilarity(a: string, b: string): number {
  const aWords = normalizeDiffText(a).split(' ').filter(Boolean);
  const bWords = normalizeDiffText(b).split(' ').filter(Boolean);
  if (aWords.length === 0 || bWords.length === 0) return 0;
  const bSet = new Set(bWords);
  const overlap = aWords.filter((word) => bSet.has(word)).length;
  return overlap / Math.max(aWords.length, bWords.length);
}

// Build flat text arrays from nodes for positional matching
function flattenTexts(content: Record<string, unknown>): string[] {
  const nodes = getNodes(content);
  const texts: string[] = [];
  for (const node of nodes) {
    const type = node.type as string;
    if (type === 'heading' || type === 'paragraph') {
      texts.push(nt(node));
    } else if (type === 'bulletList' || type === 'orderedList') {
      const children = (node.content as Record<string, unknown>[]) ?? [];
      for (const li of children) texts.push(lt(li));
    } else if (type === 'table') {
      const rows = (node.content as Record<string, unknown>[]) ?? [];
      for (const row of rows) {
        const cells = (row.content as Record<string, unknown>[]) ?? [];
        for (const cell of cells) texts.push(ct(cell));
      }
    }
  }
  return texts;
}

// Per-character diff inside formatted nodes — positional matching
function DiffContentPreview({
  oldContent,
  newContent,
}: {
  oldContent: Record<string, unknown> | null;
  newContent: Record<string, unknown>;
}) {
  if (!oldContent) return <FormattedContentPreview content={newContent} />;

  // Build text arrays, but match by nearby content instead of raw position.
  // This avoids noisy full-document highlights when a heading/list/table row is inserted.
  const oldTexts = flattenTexts(oldContent);
  const newNodes = getNodes(newContent);

  let textIdx = 0;

  function getOld(newStr: string): string | null {
    const normalizedNew = normalizeDiffText(newStr);
    if (!normalizedNew) return textIdx < oldTexts.length ? (oldTexts[textIdx++] ?? null) : null;

    const current = oldTexts[textIdx];
    if (current !== undefined) {
      const normalizedCurrent = normalizeDiffText(current);
      if (normalizedCurrent === normalizedNew || textSimilarity(current, newStr) >= 0.45) {
        textIdx += 1;
        return current;
      }
    }

    const searchLimit = Math.min(oldTexts.length, textIdx + 12);
    for (let i = textIdx + 1; i < searchLimit; i++) {
      if (normalizeDiffText(oldTexts[i] ?? '') === normalizedNew) {
        textIdx = i + 1;
        return oldTexts[i] ?? null;
      }
    }

    return null;
  }

  return (
    <>
      {newNodes.map((node, i) => {
        const type = node.type as string;
        const text = nt(node);
        const level = (node.attrs as { level?: number } | undefined)?.level;
        const children = node.content as Record<string, unknown>[] | undefined;

        if (type === 'heading') {
          const old = getOld(text);
          const Tag = `h${level ?? 2}` as 'h1' | 'h2' | 'h3';
          const sizes: Record<string, string> = {
            h1: 'text-xl font-bold mt-4 mb-2',
            h2: 'text-base font-bold mt-6 mb-2 pb-1 border-b border-subtle',
            h3: 'text-sm font-semibold mt-4 mb-1',
          };
          return (
            <Tag key={i} className={`${sizes[Tag] ?? 'text-sm font-semibold'} text-ink-primary`}>
              {diffOrPlain(old, text)}
            </Tag>
          );
        }

        if (type === 'paragraph') {
          const old = getOld(text);
          if (!text.trim()) return <div key={i} className="h-2" />;
          return (
            <p key={i} className="mb-1 text-[13px] leading-relaxed text-ink-secondary">
              {diffOrPlain(old, text)}
            </p>
          );
        }

        if (type === 'bulletList' || type === 'orderedList') {
          const ListTag = type === 'bulletList' ? 'ul' : 'ol';
          return (
            <ListTag
              key={i}
              className={`mb-2 pl-5 text-[13px] text-ink-secondary ${type === 'bulletList' ? 'list-disc' : 'list-decimal'}`}
            >
              {children?.map((li, j) => {
                const t = lt(li);
                const old = getOld(t);
                return (
                  <li key={j} className="mb-0.5">
                    {diffOrPlain(old, t)}
                  </li>
                );
              })}
            </ListTag>
          );
        }

        if (type === 'table') {
          return (
            <div key={i} className="my-3 overflow-x-auto">
              <table
                className="w-full border-collapse text-[12px]"
                style={{ tableLayout: 'fixed' }}
              >
                <tbody>
                  {children?.map((row, ri) => {
                    const cells = (row.content as Record<string, unknown>[]) ?? [];
                    return (
                      <tr key={ri}>
                        {cells.map((cell, ci) => {
                          const t = ct(cell);
                          const old = getOld(t);
                          const isHeader = (cell.type as string) === 'tableHeader';
                          if (isHeader)
                            return (
                              <th
                                key={ci}
                                className="break-words border border-[#ccc] bg-[#f5f5f4] px-2 py-1.5 text-left font-semibold text-ink-primary"
                              >
                                {diffOrPlain(old, t)}
                              </th>
                            );
                          return (
                            <td
                              key={ci}
                              className="break-words border border-[#ccc] px-2 py-1.5 text-left text-ink-secondary"
                            >
                              {diffOrPlain(old, t)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        }

        return null;
      })}
    </>
  );
}

export function HistoryView({
  prdId,
  currentContent: _currentContent,
  onClose,
  onRestore,
}: HistoryViewProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [highlightChanges, setHighlightChanges] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');
  const [_isPending, startTransition] = useTransition();

  const loadVersions = useCallback(async () => {
    try {
      const res = await fetch(`/api/prd/${prdId}/versions`);
      if (res.ok) {
        const data = await res.json();
        const v = data.versions ?? [];
        setVersions(v);
        if (v.length > 0 && !selectedVersion) setSelectedVersion(v[0]);
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, [prdId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  function handleRename(versionId: string) {
    if (!renameText.trim()) {
      setRenamingId(null);
      return;
    }
    startTransition(async () => {
      const result = await renameVersion(prdId, versionId, renameText.trim());
      if (result.error) toast.error(result.error);
      else {
        toast.success('Version renamed');
        setRenamingId(null);
        loadVersions();
      }
    });
  }

  function toggleGroup(groupId: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  // Find previous version for diff — by position in array (versions sorted desc)
  const prevVersion = selectedVersion
    ? (() => {
        const idx = versions.findIndex((v) => v.id === selectedVersion.id);
        return idx >= 0 && idx < versions.length - 1 ? versions[idx + 1]! : null;
      })()
    : null;

  const grouped = groupVersions(versions);

  return (
    <div className="flex h-full w-full flex-col bg-bg-canvas">
      {/* Header */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-subtle bg-white px-3 sm:h-14 sm:px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-secondary transition-colors hover:bg-bg-elevated"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-[13px] font-medium text-ink-primary">
              {selectedVersion
                ? format(new Date(selectedVersion.created_at), 'MMMM d, h:mm a')
                : 'Version History'}
            </p>
            {selectedVersion && (
              <p className="text-[11px] text-ink-tertiary">{selectedVersion.author_name}</p>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Content preview — paper style */}
        <div className="hide-scrollbar flex-1 overflow-y-auto bg-[#f0efed]">
          <div
            className="mx-auto my-4 max-w-[680px] rounded-sm bg-white px-4 py-6 shadow-sm sm:my-6 sm:px-8 sm:py-8 md:my-8 md:px-16 md:py-12"
            style={{ minHeight: '80vh' }}
          >
            {selectedVersion ? (
              highlightChanges && prevVersion ? (
                <>
                  <div className="mb-4 rounded-lg bg-blue-50 px-3 py-2 text-[11px] text-blue-700">
                    Comparing {format(new Date(prevVersion.created_at), 'MMM d, h:mm a')} →{' '}
                    {format(new Date(selectedVersion.created_at), 'MMM d, h:mm a')} &middot;{' '}
                    <span className="rounded-sm bg-emerald-200/70 px-0.5">added</span>{' '}
                    <span className="rounded-sm bg-red-200/70 px-0.5 line-through">removed</span>
                  </div>
                  <DiffContentPreview
                    oldContent={prevVersion.content}
                    newContent={selectedVersion.content}
                  />
                </>
              ) : highlightChanges && !prevVersion ? (
                <>
                  <div className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
                    This is the first version - no previous version to compare
                  </div>
                  <FormattedContentPreview content={selectedVersion.content} />
                </>
              ) : (
                <FormattedContentPreview content={selectedVersion.content} />
              )
            ) : loading ? (
              <p className="py-16 text-center text-sm text-ink-tertiary">Loading...</p>
            ) : (
              <p className="py-16 text-center text-sm text-ink-tertiary">No versions available</p>
            )}
          </div>
        </div>

        {/* Timeline sidebar — Google Docs style */}
        <div className="hidden w-[280px] shrink-0 flex-col border-l border-subtle bg-[#fafaf9] md:flex">
          <div className="hide-scrollbar flex-1 overflow-y-auto px-4 pt-4">
            {loading ? (
              <p className="text-xs text-ink-tertiary">Loading...</p>
            ) : (
              grouped.map((dateGroup, gi) => (
                <div key={dateGroup.label} className="mb-4">
                  <p className="mb-2 text-[11px] font-medium text-ink-tertiary">
                    {dateGroup.label}
                  </p>
                  {dateGroup.groups.map((group, gj) => {
                    const groupId = `${gi}-${gj}`;
                    const isExpanded = expandedGroups.has(groupId);
                    const hasChildren = group.children.length > 0;
                    const isFirst = gi === 0 && gj === 0;

                    return (
                      <div key={groupId} className="mb-1">
                        {/* Main version */}
                        <VersionItem
                          version={group.main}
                          isSelected={selectedVersion?.id === group.main.id}
                          isCurrent={isFirst}
                          hasChildren={hasChildren}
                          isExpanded={isExpanded}
                          onSelect={() => {
                            setSelectedVersion(group.main);
                          }}
                          onToggleExpand={() => toggleGroup(groupId)}
                          menuOpen={menuOpenId === group.main.id}
                          onMenuToggle={() =>
                            setMenuOpenId(menuOpenId === group.main.id ? null : group.main.id)
                          }
                          isRenaming={renamingId === group.main.id}
                          renameText={renameText}
                          onRenameStart={() => {
                            setRenamingId(group.main.id);
                            setRenameText(group.main.change_summary ?? '');
                            setMenuOpenId(null);
                          }}
                          onRenameChange={setRenameText}
                          onRenameSubmit={() => handleRename(group.main.id)}
                          onRenameCancel={() => setRenamingId(null)}
                          onRestore={() => {
                            setSelectedVersion(group.main);
                            setMenuOpenId(null);
                            startTransition(async () => {
                              const result = await restoreVersion(prdId, group.main.id);
                              if (result.error) toast.error(result.error);
                              else {
                                toast.success('Version restored');
                                onRestore();
                              }
                            });
                          }}
                        />

                        {/* Children (collapsible) */}
                        {hasChildren && isExpanded && (
                          <div className="ml-5 border-l-2 border-subtle pl-3">
                            {group.children.map((child) => (
                              <VersionItem
                                key={child.id}
                                version={child}
                                isSelected={selectedVersion?.id === child.id}
                                isCurrent={false}
                                hasChildren={false}
                                isExpanded={false}
                                onSelect={() => {
                                  setSelectedVersion(child);
                                }}
                                onToggleExpand={() => {}}
                                menuOpen={menuOpenId === child.id}
                                onMenuToggle={() =>
                                  setMenuOpenId(menuOpenId === child.id ? null : child.id)
                                }
                                isRenaming={renamingId === child.id}
                                renameText={renameText}
                                onRenameStart={() => {
                                  setRenamingId(child.id);
                                  setRenameText(child.change_summary ?? '');
                                  setMenuOpenId(null);
                                }}
                                onRenameChange={setRenameText}
                                onRenameSubmit={() => handleRename(child.id)}
                                onRenameCancel={() => setRenamingId(null)}
                                onRestore={() => {
                                  setSelectedVersion(child);
                                  setMenuOpenId(null);
                                  startTransition(async () => {
                                    const result = await restoreVersion(prdId, child.id);
                                    if (result.error) toast.error(result.error);
                                    else {
                                      toast.success('Version restored');
                                      onRestore();
                                    }
                                  });
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Highlight changes — Google Docs style sticky bottom */}
          <div className="shrink-0 border-t border-subtle bg-[#fafaf9] px-3 py-2 sm:px-4 sm:py-3">
            <label className="flex cursor-pointer items-center gap-2.5">
              <div
                className={`flex h-[18px] w-[18px] items-center justify-center rounded-sm border-2 transition-colors ${highlightChanges ? 'border-blue-600 bg-blue-600' : 'border-[#bbb] bg-white'}`}
              >
                {highlightChanges && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <input
                type="checkbox"
                checked={highlightChanges}
                onChange={(e) => setHighlightChanges(e.target.checked)}
                className="sr-only"
              />
              <span className="text-[13px] text-ink-primary">Highlight changes</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

// Individual version item in timeline
function VersionItem({
  version,
  isSelected,
  isCurrent,
  hasChildren,
  isExpanded,
  onSelect,
  onToggleExpand,
  menuOpen,
  onMenuToggle,
  isRenaming,
  renameText,
  onRenameStart,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
  onRestore,
}: {
  version: Version;
  isSelected: boolean;
  isCurrent: boolean;
  hasChildren: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
  menuOpen: boolean;
  onMenuToggle: () => void;
  isRenaming: boolean;
  renameText: string;
  onRenameStart: () => void;
  onRenameChange: (v: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
  onRestore: () => void;
}) {
  return (
    <div
      className={`relative rounded-lg px-2 py-2 transition-all ${isSelected ? 'ring-accent/20 bg-white shadow-sm ring-1' : 'hover:bg-white/70'}`}
    >
      <div className="flex items-start gap-1.5">
        {/* Expand/collapse chevron */}
        {hasChildren ? (
          <button
            onClick={onToggleExpand}
            className="mt-0.5 shrink-0 text-ink-tertiary hover:text-ink-primary"
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <div className="w-[14px] shrink-0" />
        )}

        {/* Content */}
        <button onClick={onSelect} className="min-w-0 flex-1 text-left">
          {isRenaming ? (
            <input
              value={renameText}
              onChange={(e) => onRenameChange(e.target.value)}
              onBlur={onRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onRenameSubmit();
                if (e.key === 'Escape') onRenameCancel();
              }}
              autoFocus
              className="w-full rounded border border-accent bg-white px-1.5 py-0.5 text-[12px] font-semibold text-ink-primary outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <p
              className={`text-[12px] font-semibold ${isSelected ? 'text-accent' : 'text-ink-primary'}`}
            >
              {format(new Date(version.created_at), 'MMM d, h:mm a')}
            </p>
          )}
          {isCurrent && !isRenaming && (
            <p className="text-[10px] text-ink-tertiary">Current version</p>
          )}
          {version.change_summary && !isCurrent && !isRenaming && (
            <p className="text-[10px] text-ink-tertiary">{version.change_summary}</p>
          )}
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-[11px] text-ink-tertiary">{version.author_name}</span>
          </div>
        </button>

        {/* 3-dot menu */}
        <div className="relative shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMenuToggle();
            }}
            className={`flex h-6 w-6 items-center justify-center rounded text-ink-tertiary transition-colors hover:bg-bg-elevated hover:text-ink-primary ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            style={{ opacity: isSelected || menuOpen ? 1 : undefined }}
          >
            <MoreVertical size={14} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-7 z-20 w-44 rounded-lg border border-subtle bg-white py-1 shadow-lg">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRestore();
                }}
                className="flex w-full items-center px-3 py-2 text-[12px] text-ink-secondary transition-colors hover:bg-bg-elevated"
              >
                Restore this version
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRenameStart();
                }}
                className="flex w-full items-center px-3 py-2 text-[12px] text-ink-secondary transition-colors hover:bg-bg-elevated"
              >
                Name this version
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
