export const CURRENT_WORKSPACE_COOKIE = 'current_workspace_id';

export const CURRENT_WORKSPACE_COOKIE_OPTIONS = {
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 365,
};

type ReadableCookieStore = {
  get(name: string): { value: string } | undefined;
};

type WritableCookieStore = ReadableCookieStore & {
  set(name: string, value: string, options: typeof CURRENT_WORKSPACE_COOKIE_OPTIONS): void;
  delete(name: string): void;
};

export function setCurrentWorkspaceCookie(store: WritableCookieStore, workspaceId: string) {
  store.set(CURRENT_WORKSPACE_COOKIE, workspaceId, CURRENT_WORKSPACE_COOKIE_OPTIONS);
}

export function clearCurrentWorkspaceCookieIfMatches(
  store: WritableCookieStore,
  workspaceId: string,
) {
  if (store.get(CURRENT_WORKSPACE_COOKIE)?.value === workspaceId) {
    store.delete(CURRENT_WORKSPACE_COOKIE);
  }
}
