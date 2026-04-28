'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="bg-surface-primary flex min-h-screen flex-col items-center justify-center gap-6 p-md">
      <h1 className="font-display text-4xl font-bold text-ink-primary">Something went wrong</h1>
      <p className="font-mono text-sm text-ink-secondary">
        {error.message || 'An unexpected error occurred.'}
      </p>
      {error.digest && (
        <p className="font-mono text-xs text-ink-tertiary">Error ID: {error.digest}</p>
      )}
      <div className="flex gap-3">
        <Button onClick={reset} variant="outline">
          Try again
        </Button>
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
