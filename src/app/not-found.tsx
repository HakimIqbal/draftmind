import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="bg-surface-primary flex min-h-screen flex-col items-center justify-center gap-6 p-md">
      <h1 className="font-display text-6xl font-bold text-ink-primary">404</h1>
      <p className="font-mono text-sm text-ink-secondary">
        The page you are looking for does not exist.
      </p>
      <Button asChild>
        <Link href="/">Go home</Link>
      </Button>
    </div>
  );
}
