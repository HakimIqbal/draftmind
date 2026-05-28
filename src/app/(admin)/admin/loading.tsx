export default function AdminLoading() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-7 w-32 rounded bg-[#f0f0ee]" />
        <div className="mt-2 h-4 w-48 rounded bg-[#f5f5f4]" />
      </div>

      {/* System health strip skeleton */}
      <div className="mb-6 rounded-xl border border-[#e8e8e8] bg-[#fafafa] p-4">
        <div className="mb-3 h-3 w-28 rounded bg-[#eee]" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#e5e5e5]" />
              <div>
                <div className="h-3 w-16 rounded bg-[#eee]" />
                <div className="mt-1 h-4 w-20 rounded bg-[#f0f0ee]" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[#eee] bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-[#f5f5f4]" />
              <div className="h-4 w-4 rounded bg-[#f5f5f4]" />
            </div>
            <div className="mt-4 h-8 w-16 rounded bg-[#f0f0ee]" />
            <div className="mt-1 h-3 w-20 rounded bg-[#f5f5f4]" />
          </div>
        ))}
      </div>
    </div>
  );
}
