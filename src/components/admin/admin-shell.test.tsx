import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminShell } from './admin-shell';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  signOut: vi.fn().mockResolvedValue(undefined),
  logLogout: vi.fn().mockResolvedValue(undefined),
  removeChannel: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin',
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next/image', () => ({
  default: ({ alt, ...props }: { alt: string; [key: string]: unknown }) => (
    <img alt={alt} {...props} />
  ),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
    removeChannel: mocks.removeChannel,
    auth: { signOut: mocks.signOut },
  }),
}));

vi.mock('@/app/(app)/actions', () => ({ logLogout: mocks.logLogout }));
vi.mock('@/app/(admin)/admin/tickets/actions', () => ({ getAdminOpenTicketCount: vi.fn() }));
vi.mock('@/components/presence/presence-heartbeat', () => ({ PresenceHeartbeat: () => null }));
vi.mock('@/components/settings/profile-modal', () => ({
  ProfileModal: ({ open }: { open: boolean }) =>
    open ? <div role="dialog">Profile modal open</div> : null,
}));

describe('AdminShell account menu', () => {
  beforeEach(() => {
    cleanup();
    mocks.push.mockClear();
    mocks.refresh.mockClear();
    mocks.signOut.mockClear();
    mocks.logLogout.mockClear();
    mocks.removeChannel.mockClear();
  });

  it('opens the profile modal from the chevron inside the portal menu', async () => {
    render(
      <AdminShell userName="admin" userEmail="admin@draftmind.com">
        <div>Admin content</div>
      </AdminShell>,
    );

    const trigger = screen.getAllByRole('button', { name: /admin admin@draftmind\.com/i })[0]!;
    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /open admin profile/i }));

    await waitFor(() => expect(screen.getByRole('dialog')).toHaveTextContent('Profile modal open'));
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
  });

  it('logs out from the portal menu action', async () => {
    render(
      <AdminShell userName="admin" userEmail="admin@draftmind.com">
        <div>Admin content</div>
      </AdminShell>,
    );

    fireEvent.click(screen.getAllByRole('button', { name: /admin admin@draftmind\.com/i })[0]!);
    fireEvent.click(screen.getByRole('button', { name: /log out/i }));

    await waitFor(() => expect(mocks.logLogout).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mocks.signOut).toHaveBeenCalledTimes(1));
    expect(mocks.push).toHaveBeenCalledWith('/login');
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });
});
