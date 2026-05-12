import { describe, it, expect } from 'vitest';

describe('Auth - requireUser', () => {
  it('should export requireUser and requireWorkspaceRole functions', async () => {
    // Verify the auth module exports exist and are functions
    const auth = await import('@/lib/auth/permissions');
    expect(typeof auth.requireUser).toBe('function');
    expect(typeof auth.requireWorkspaceRole).toBe('function');
  });
});
