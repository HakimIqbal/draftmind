import Link from 'next/link';

export default function PRDNotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
      <div className="w-full max-w-md rounded-lg border border-subtle bg-bg-surface p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-bg-elevated">
          <svg
            className="h-6 w-6 text-ink-tertiary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-ink-primary">PRD not found</p>
        <p className="mt-1 text-sm text-ink-tertiary">
          This PRD doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <Link
          href="/prds"
          className="mt-4 inline-block rounded-md border border-subtle px-4 py-2 text-sm text-ink-secondary transition-colors hover:bg-bg-elevated hover:text-ink-primary"
        >
          Back to My PRDs
        </Link>
      </div>
    </div>
  );
}
