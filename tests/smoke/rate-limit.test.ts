import { describe, it, expect } from 'vitest';
import { checkRateLimit } from '@/lib/utils/rate-limit';

describe('Rate Limiter', () => {
  it('allows requests within limit', () => {
    const config = { maxRequests: 3, windowMs: 60_000 };
    const key = `test-allow-${Date.now()}`;

    const r1 = checkRateLimit(key, config);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = checkRateLimit(key, config);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = checkRateLimit(key, config);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it('blocks requests after exceeding limit', () => {
    const config = { maxRequests: 2, windowMs: 60_000 };
    const key = `test-block-${Date.now()}`;

    checkRateLimit(key, config); // 1
    checkRateLimit(key, config); // 2

    const r3 = checkRateLimit(key, config); // 3 — should be blocked
    expect(r3.allowed).toBe(false);
    expect(r3.remaining).toBe(0);
    expect(r3.retryAfterMs).toBeGreaterThan(0);
  });

  it('different keys have independent limits', () => {
    const config = { maxRequests: 1, windowMs: 60_000 };
    const key1 = `test-indep-a-${Date.now()}`;
    const key2 = `test-indep-b-${Date.now()}`;

    const r1 = checkRateLimit(key1, config);
    expect(r1.allowed).toBe(true);

    // key1 exhausted, but key2 should still be allowed
    const r2 = checkRateLimit(key2, config);
    expect(r2.allowed).toBe(true);

    // key1 should now be blocked
    const r3 = checkRateLimit(key1, config);
    expect(r3.allowed).toBe(false);
  });
});
