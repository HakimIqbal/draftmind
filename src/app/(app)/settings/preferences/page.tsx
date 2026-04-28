import { requireUser } from '@/lib/auth/permissions';

export const metadata = {
  title: 'Preferences — DraftMind',
};

export default async function PreferencesSettingsPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Preferences</h1>
      <div className="border-surface-border bg-surface-primary space-y-6 rounded-lg border p-6">
        <p className="text-ink-secondary">
          Editor preferences like font size, line height, and theme are managed via the Tweaks panel
          in the PRD editor. Open any PRD and click the settings icon to adjust.
        </p>
        <div>
          <h2 className="mb-2 text-lg font-semibold">Default Settings</h2>
          <ul className="space-y-2 text-sm text-ink-secondary">
            <li>Auto-save: Enabled (every 30 seconds)</li>
            <li>Spell check: Browser default</li>
            <li>AI suggestions: Enabled</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
