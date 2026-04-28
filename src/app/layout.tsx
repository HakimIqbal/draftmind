import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { TweaksProvider } from '@/components/tweaks/tweaks-provider';
import { TweaksButton } from '@/components/tweaks/tweaks-button';
import { CommandPalette } from '@/components/overlays/command-palette';
import './globals.css';

export const metadata: Metadata = {
  title: 'DraftMind — Think Less. Draft Smarter.',
  description: 'AI-powered Product Requirement Document generator for product teams.',
  icons: { icon: '/logo/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme="dark"
      data-density="compact"
      data-radius="default"
      data-font="fraunces-inter"
      data-accent="ember"
    >
      <body className="bg-bg-canvas font-body text-ink-primary">
        <TweaksProvider>
          {children}
          <CommandPalette />
          {process.env.NODE_ENV === 'development' && <TweaksButton />}
        </TweaksProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: 'bg-bg-elevated text-ink-primary border-strong font-body',
          }}
        />
      </body>
    </html>
  );
}
