import { requireUser } from '@/lib/auth/permissions';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'DraftMind',
};

export default async function PreferencesSettingsPage() {
  await requireUser();

  return (
    <>
      <h1 className="mb-lg font-display text-xl font-bold">Preferences</h1>

      <Card>
        <CardContent className="space-y-lg p-lg">
          <p className="text-sm text-ink-secondary">
            Editor preferences like font size, line height, and theme are managed via the Tweaks
            panel in the PRD editor. Open any PRD and click the settings icon to adjust.
          </p>

          <div>
            <h2 className="mb-sm font-display text-base font-semibold text-ink-primary">
              Default Settings
            </h2>
            <ul className="space-y-sm text-sm text-ink-secondary">
              <li className="flex items-center justify-between rounded-md border border-subtle px-md py-sm">
                <span>Auto-save</span>
                <span className="font-mono text-xs text-ink-tertiary">Every 30 seconds</span>
              </li>
              <li className="flex items-center justify-between rounded-md border border-subtle px-md py-sm">
                <span>Spell check</span>
                <span className="font-mono text-xs text-ink-tertiary">Browser default</span>
              </li>
              <li className="flex items-center justify-between rounded-md border border-subtle px-md py-sm">
                <span>AI suggestions</span>
                <span className="font-mono text-xs text-accent">Enabled</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
