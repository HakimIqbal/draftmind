'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Report error to System Logs via API
  useEffect(() => {
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: 'error',
        source: 'client.error-boundary',
        message: error.message || 'Unknown client error',
        metadata: { digest: error.digest, stack: error.stack?.slice(0, 500) },
      }),
    }).catch(() => {});
  }, [error]);

  return (
    <div className="bg-surface-primary flex min-h-screen flex-col items-center justify-center gap-6 p-md">
      <h1 className="font-display text-4xl font-bold text-ink-primary">Something went wrong</h1>
      <p className="text-sm text-ink-secondary">
        An unexpected error occurred. Please try again or contact support.
      </p>
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
