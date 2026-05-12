export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="h-4 w-24 animate-pulse rounded bg-[#f0f0f0]" />
      <div className="mt-8 h-8 w-64 animate-pulse rounded bg-[#f0f0f0]" />
      <div className="mt-4 space-y-3">
        <div className="h-3 w-full animate-pulse rounded bg-[#f0f0f0]" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-[#f0f0f0]" />
        <div className="h-3 w-4/6 animate-pulse rounded bg-[#f0f0f0]" />
      </div>
    </div>
  );
}
