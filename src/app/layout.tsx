import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { TweaksProvider } from '@/components/tweaks/tweaks-provider';
import { CommandPalette } from '@/components/overlays/command-palette';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'DraftMind',
    template: '%s',
  },
  description: 'AI-powered Product Requirement Document generator for product teams.',
  icons: {
    icon: '/logo/favicon.png',
    apple: '/logo/logo.jpg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme="light"
      data-density="compact"
      data-radius="default"
      data-font="fraunces-inter"
      data-accent="ember"
    >
      <body className="bg-bg-canvas font-body text-ink-primary">
        <TweaksProvider>
          {children}
          <CommandPalette />
        </TweaksProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'bg-bg-elevated text-ink-primary border-strong font-body',
          }}
        />
      </body>
    </html>
  );
}
