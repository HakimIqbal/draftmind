import { requireUser } from '@/lib/auth/permissions';

export const metadata = {
  title: 'API Keys — DraftMind',
};

export default async function ApiKeysSettingsPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">API Keys</h1>
      <div className="border-surface-border bg-surface-primary rounded-lg border p-6">
        <div className="py-8 text-center">
          <h2 className="text-lg font-semibold text-ink-primary">Enterprise Feature</h2>
          <p className="mt-2 text-ink-secondary">
            API key management is available on the Enterprise plan. Contact us to learn more about
            programmatic access to DraftMind.
          </p>
        </div>
      </div>
    </div>
  );
}
