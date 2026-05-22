'use client';

import { useEffect } from 'react';

function sendClientLog(source: string, message: string, metadata: Record<string, unknown>) {
  if (typeof window === 'undefined') return;

  fetch('/api/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level: 'error', source, message, metadata }),
    keepalive: true,
  }).catch(() => {});
}

function getPromiseRejectionMessage(reason: unknown) {
  if (reason instanceof Error) return reason.message;
  if (typeof reason === 'string') return reason;
  try {
    return JSON.stringify(reason);
  } catch {
    return 'Unhandled promise rejection';
  }
}

function isChunkLikeError(message: string, filename?: string) {
  const haystack = `${message} ${filename ?? ''}`.toLowerCase();
  return (
    haystack.includes('chunkloaderror') ||
    haystack.includes('loading chunk') ||
    haystack.includes('failed to fetch dynamically imported module') ||
    haystack.includes('/_next/static/chunks/')
  );
}

export function ClientGlobalErrorLogger() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      const message = event.message || event.error?.message || 'Unhandled client runtime error';
      const source = isChunkLikeError(message, event.filename)
        ? 'client.chunk_load_error'
        : 'client.runtime_error';

      sendClientLog(source, message, {
        pathname: window.location.pathname,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error instanceof Error ? event.error.stack?.slice(0, 1200) : undefined,
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const message = getPromiseRejectionMessage(event.reason) || 'Unhandled promise rejection';
      sendClientLog('client.unhandled_rejection', message, {
        pathname: window.location.pathname,
        stack: event.reason instanceof Error ? event.reason.stack?.slice(0, 1200) : undefined,
      });
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return null;
}
