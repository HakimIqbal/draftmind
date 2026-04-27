import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          canvas: 'var(--bg-canvas)',
          surface: 'var(--bg-surface)',
          elevated: 'var(--bg-elevated)',
          rail: 'var(--bg-rail)',
        },
        ink: {
          primary: 'var(--ink-primary)',
          secondary: 'var(--ink-secondary)',
          tertiary: 'var(--ink-tertiary)',
          quaternary: 'var(--ink-quaternary)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          deep: 'var(--accent-deep)',
        },
        amber: { muted: 'var(--amber-muted)' },
        sage: { muted: 'var(--sage-muted)' },
        red: { muted: 'var(--red-muted)' },
      },
      borderColor: {
        subtle: 'var(--border-subtle)',
        DEFAULT: 'var(--border-default)',
        strong: 'var(--border-strong)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
        mono: 'var(--font-mono)',
      },
      fontSize: {
        body: 'var(--font-body-size)',
        helper: 'var(--font-helper-size)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      spacing: {
        xs: 'var(--gap-xs)',
        sm: 'var(--gap-sm)',
        md: 'var(--gap-md)',
        lg: 'var(--gap-lg)',
        xl: 'var(--gap-xl)',
        row: 'var(--row-height)',
        'card-padding': 'var(--card-padding)',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
