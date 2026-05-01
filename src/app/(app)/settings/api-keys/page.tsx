import { requireUser } from '@/lib/auth/permissions';
import { Card, CardContent } from '@/components/ui/card';
import { Lock } from 'lucide-react';

export const metadata = {
  title: 'DraftMind',
};

export default async function ApiKeysSettingsPage() {
  await requireUser();

  return (
    <>
      <h1 className="mb-lg font-display text-xl font-bold">API Keys</h1>

      <Card>
        <CardContent className="p-lg">
          <div className="flex flex-col items-center py-xl text-center">
            <div className="mb-md flex h-12 w-12 items-center justify-center rounded-full bg-bg-surface">
              <Lock size={24} className="text-ink-tertiary" />
            </div>
            <h2 className="font-display text-lg font-semibold text-ink-primary">
              Enterprise Feature
            </h2>
            <p className="mt-sm max-w-sm text-sm text-ink-secondary">
              API key management is available on the Enterprise plan. Contact us to learn more about
              programmatic access to DraftMind.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
