import { requireUser } from '@/lib/auth/permissions';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'DraftMind',
};

export default async function NotificationSettingsPage() {
  await requireUser();

  return (
    <>
      <h1 className="mb-lg font-display text-xl font-bold">Notification Preferences</h1>

      <Card>
        <CardContent className="space-y-lg p-lg">
          <p className="text-sm text-ink-secondary">
            Choose which notifications you would like to receive.
          </p>

          <fieldset className="space-y-sm">
            <label className="flex items-center gap-sm rounded-md border border-subtle px-md py-sm transition-colors hover:bg-bg-surface">
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-subtle accent-accent"
              />
              <span className="text-sm text-ink-primary">PRD comments and mentions</span>
            </label>
            <label className="flex items-center gap-sm rounded-md border border-subtle px-md py-sm transition-colors hover:bg-bg-surface">
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-subtle accent-accent"
              />
              <span className="text-sm text-ink-primary">AI review completed</span>
            </label>
            <label className="flex items-center gap-sm rounded-md border border-subtle px-md py-sm transition-colors hover:bg-bg-surface">
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-subtle accent-accent"
              />
              <span className="text-sm text-ink-primary">Workspace invitations</span>
            </label>
            <label className="flex items-center gap-sm rounded-md border border-subtle px-md py-sm transition-colors hover:bg-bg-surface">
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-subtle accent-accent"
              />
              <span className="text-sm text-ink-primary">PRD shared with me</span>
            </label>
            <label className="flex items-center gap-sm rounded-md border border-subtle px-md py-sm transition-colors hover:bg-bg-surface">
              <input type="checkbox" className="h-4 w-4 rounded border-subtle accent-accent" />
              <span className="text-sm text-ink-primary">Weekly digest email</span>
            </label>
          </fieldset>

          <p className="font-mono text-xs text-ink-tertiary">
            Notification preferences are stored locally. Server-side notification preferences coming
            soon.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
