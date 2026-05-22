import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdminShell } from './admin-shell';

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin',
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
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
    removeChannel: vi.fn(),
    auth: { signOut: vi.fn() },
  }),
}));

vi.mock('@/app/(app)/actions', () => ({ logLogout: vi.fn() }));
vi.mock('@/app/(admin)/admin/tickets/actions', () => ({ getAdminOpenTicketCount: vi.fn() }));
vi.mock('@/components/presence/presence-heartbeat', () => ({ PresenceHeartbeat: () => null }));
vi.mock('@/components/settings/profile-modal', () => ({
  ProfileModal: ({ open }: { open: boolean }) =>
    open ? <div role="dialog">Profile modal open</div> : null,
}));

describe('AdminShell account menu', () => {
  it('keeps the account popup above the sidebar and opens the profile modal from the profile row', async () => {
    render(
      <AdminShell userName="admin" userEmail="admin@draftmind.com">
        <div>Admin content</div>
      </AdminShell>,
    );

    const trigger = screen.getByRole('button', { name: /admin admin@draftmind\.com/i });
    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(document.querySelector('.z-50')).toBeInTheDocument();

    const profileChevron = screen.getByRole('button', { name: /open admin profile/i });
    fireEvent.pointerDown(profileChevron);
    fireEvent.click(profileChevron);

    await waitFor(() => expect(screen.getByRole('dialog')).toHaveTextContent('Profile modal open'));
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
  });
});
