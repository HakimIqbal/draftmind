import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DraftMind — Think Less. Draft Smarter.',
  description: 'AI-powered Product Requirement Document generator for product teams.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-bg-canvas font-body text-ink-primary">{children}</body>
    </html>
  );
}
