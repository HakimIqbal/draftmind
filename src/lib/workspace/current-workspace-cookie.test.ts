import { describe, expect, it, vi } from 'vitest';
import {
  CURRENT_WORKSPACE_COOKIE,
  clearCurrentWorkspaceCookieIfMatches,
  setCurrentWorkspaceCookie,
} from './current-workspace-cookie';

describe('current workspace cookie helpers', () => {
  it('sets current workspace cookie with safe shared options', () => {
    const store = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };

    setCurrentWorkspaceCookie(store, 'workspace-1');

    expect(store.set).toHaveBeenCalledWith(CURRENT_WORKSPACE_COOKIE, 'workspace-1', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    });
  });

  it('clears stale cookie only when the changed workspace is currently selected', () => {
    const matchingStore = {
      get: vi.fn(() => ({ value: 'workspace-1' })),
      set: vi.fn(),
      delete: vi.fn(),
    };
    const otherStore = {
      get: vi.fn(() => ({ value: 'workspace-2' })),
      set: vi.fn(),
      delete: vi.fn(),
    };

    clearCurrentWorkspaceCookieIfMatches(matchingStore, 'workspace-1');
    clearCurrentWorkspaceCookieIfMatches(otherStore, 'workspace-1');

    expect(matchingStore.delete).toHaveBeenCalledWith(CURRENT_WORKSPACE_COOKIE);
    expect(otherStore.delete).not.toHaveBeenCalled();
  });
});
