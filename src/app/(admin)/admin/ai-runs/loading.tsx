export default function AIRunsLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6">
        <div className="h-7 w-32 rounded bg-[#f0f0ee]" />
        <div className="mt-2 h-4 w-64 rounded bg-[#f5f5f4]" />
      </div>

      {/* Summary stats skeleton */}
      <div className="mb-8 grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[#eee] bg-white p-4">
            <div className="h-3 w-20 rounded bg-[#f5f5f4]" />
            <div className="mt-2 h-6 w-16 rounded bg-[#f0f0ee]" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-[#eee] bg-white">
        <div className="border-b border-[#f0f0ee] bg-[#fafaf9] px-5 py-3">
          <div className="h-3 w-full rounded bg-[#f5f5f4]" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border-b border-[#f5f5f5] px-5 py-4">
            <div className="h-4 w-full rounded bg-[#f5f5f4]" />
          </div>
        ))}
      </div>
    </div>
  );
}
