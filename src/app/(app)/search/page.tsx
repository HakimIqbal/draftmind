'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText } from 'lucide-react';
import { Pill } from '@/components/ui/pill';
import { formatDistanceToNow } from 'date-fns';
import { searchPRDs } from './actions';

interface SearchResult {
  id: string;
  title: string;
  status: string;
  project_tag: string | null;
  updated_at: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSearch(value: string) {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    startTransition(async () => {
      const data = await searchPRDs(value);
      setResults(data);
      setSearched(true);
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-8 py-10">
      <h1 className="text-[22px] font-bold text-[#1a1a1a]">Search</h1>
      <p className="mt-0.5 text-[13px] text-[#888]">Find PRDs across your workspace</p>

      <div className="relative mt-6">
        <Search
          size={16}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#bbb]"
        />
        <input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by title..."
          autoFocus
          className="focus:ring-accent/30 h-11 w-full rounded-xl border border-[#e5e5e3] bg-white pl-11 pr-4 text-[14px] text-[#1a1a1a] placeholder:text-[#bbb] focus:border-accent focus:outline-none focus:ring-1"
        />
      </div>

      <div className="mt-6">
        {isPending && <p className="text-[13px] text-[#aaa]">Searching...</p>}

        {searched && !isPending && results.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-[13px] text-[#aaa]">No results for &quot;{query}&quot;</p>
          </div>
        )}

        {results.length > 0 && (
          <div>
            <p className="mb-3 text-[11px] text-[#aaa]">
              {results.length} result{results.length !== 1 ? 's' : ''}
            </p>
            <div className="space-y-2">
              {results.map((prd) => (
                <button
                  key={prd.id}
                  onClick={() => router.push(`/prds/${prd.id}`)}
                  className="flex w-full items-center justify-between rounded-xl border border-[#eee] bg-white px-5 py-3.5 text-left transition-all hover:border-[#ddd] hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <FileText size={15} className="text-[#bbb]" />
                    <div>
                      <p className="text-[13px] font-medium text-[#1a1a1a]">{prd.title}</p>
                      {prd.project_tag && (
                        <p className="text-[11px] text-[#aaa]">{prd.project_tag}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Pill status={prd.status as Parameters<typeof Pill>[0]['status']} />
                    <span className="text-[11px] text-[#bbb]">
                      {formatDistanceToNow(new Date(prd.updated_at), { addSuffix: true })}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {!searched && !isPending && (
          <div className="py-16 text-center">
            <p className="text-[13px] text-[#aaa]">Type to search across all your PRDs</p>
          </div>
        )}
      </div>
    </div>
  );
}
