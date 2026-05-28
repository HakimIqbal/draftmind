'use client';

import { useEffect } from 'react';

function sendClientLog(source: string, message: string, metadata: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  // Don't try to log if the current path is the login page — the middleware
  // will redirect the POST to /login?redirectTo=/api/log which returns 405.
  if (
    window.location.pathname.startsWith('/login') ||
    window.location.pathname.startsWith('/change-password')
  )
    return;

  fetch('/api/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level: 'error', source, message, metadata }),
    keepalive: true,
  }).catch(() => {});
}

function isApiRequest(input: RequestInfo | URL) {
  const url = typeof input === 'string' || input instanceof URL ? String(input) : input.url;
  try {
    return (
      new URL(url, window.location.origin).pathname.startsWith('/api/') && !url.includes('/api/log')
    );
  } catch {
    return false;
  }
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

function isChunkLikeError(message: string | undefined, filename?: string): boolean {
  // Only treat actual Next.js chunk asset failures as stale-build errors.
  if (!message && !filename) return false;
  if (filename && filename.includes('/_next/static/chunks/')) return true;
  return String(message ?? '')
    .toLowerCase()
    .includes('chunkloaderror');
}

const CHUNK_RELOAD_FLAG = 'dm.chunk_reload_attempted_at';
const CHUNK_RELOAD_ATTEMPTS_FLAG = 'dm.chunk_reload_attempts';
const CHUNK_RELOAD_COOLDOWN_MS = 300_000;
const CHUNK_RELOAD_MAX_ATTEMPTS = 2;

function maybeReloadForStaleChunk(message: string | undefined, filename?: string) {
  if (typeof window === 'undefined') return false;
  if (!isChunkLikeError(message, filename)) return false;

  try {
    const attempts = Number(sessionStorage.getItem(CHUNK_RELOAD_ATTEMPTS_FLAG) ?? '0');
    if (Number.isFinite(attempts) && attempts >= CHUNK_RELOAD_MAX_ATTEMPTS) {
      // Silently stop — no banner, just log to console for debugging
      console.warn('DraftMind: stale chunk detected, suppressing after max attempts.');
      return false;
    }

    const last = Number(sessionStorage.getItem(CHUNK_RELOAD_FLAG) ?? '0');
    if (Number.isFinite(last) && Date.now() - last < CHUNK_RELOAD_COOLDOWN_MS) {
      console.warn('DraftMind: stale chunk detected within cooldown, suppressing.');
      return false;
    }

    sessionStorage.setItem(CHUNK_RELOAD_FLAG, String(Date.now()));
    sessionStorage.setItem(CHUNK_RELOAD_ATTEMPTS_FLAG, String(attempts + 1));
  } catch {
    // ignore storage errors, still try reload
  }

  window.location.reload();
  return true;
}

export function ClientGlobalErrorLogger() {
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const [input, init] = args;
      const startedAt = Date.now();
      try {
        const response = await originalFetch(...args);
        if (isApiRequest(input) && !response.ok) {
          sendClientLog('client.api_fetch_error', `API request failed with ${response.status}`, {
            pathname: window.location.pathname,
            url: typeof input === 'string' || input instanceof URL ? String(input) : input.url,
            method:
              init?.method ??
              (typeof input !== 'string' && !(input instanceof URL) ? input.method : 'GET'),
            status: response.status,
            statusText: response.statusText,
            durationMs: Date.now() - startedAt,
          });
        }
        return response;
      } catch (error) {
        if (isApiRequest(input)) {
          sendClientLog(
            'client.api_fetch_error',
            error instanceof Error ? error.message : 'API request failed',
            {
              pathname: window.location.pathname,
              url: typeof input === 'string' || input instanceof URL ? String(input) : input.url,
              method:
                init?.method ??
                (typeof input !== 'string' && !(input instanceof URL) ? input.method : 'GET'),
              durationMs: Date.now() - startedAt,
            },
          );
        }
        throw error;
      }
    };

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

      maybeReloadForStaleChunk(message, event.filename);
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const message = getPromiseRejectionMessage(event.reason) || 'Unhandled promise rejection';
      sendClientLog('client.unhandled_rejection', message, {
        pathname: window.location.pathname,
        stack: event.reason instanceof Error ? event.reason.stack?.slice(0, 1200) : undefined,
      });

      maybeReloadForStaleChunk(message);
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.fetch = originalFetch;
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return null;
}
