import { requireUser } from '@/lib/auth/permissions';

export const metadata = {
  title: 'Notification Settings — DraftMind',
};

export default async function NotificationSettingsPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Notification Preferences</h1>
      <div className="border-surface-border bg-surface-primary space-y-6 rounded-lg border p-6">
        <p className="mb-4 text-sm text-ink-secondary">
          Choose which notifications you would like to receive.
        </p>
        <fieldset className="space-y-4">
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="rounded" />
            <span className="text-sm text-ink-primary">PRD comments and mentions</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="rounded" />
            <span className="text-sm text-ink-primary">AI review completed</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="rounded" />
            <span className="text-sm text-ink-primary">Workspace invitations</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="rounded" />
            <span className="text-sm text-ink-primary">PRD shared with me</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" className="rounded" />
            <span className="text-sm text-ink-primary">Weekly digest email</span>
          </label>
        </fieldset>
        <p className="text-xs text-ink-tertiary">
          Notification preferences are stored locally. Server-side notification preferences coming
          soon.
        </p>
      </div>
    </div>
  );
}
