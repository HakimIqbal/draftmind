# DraftMind

**Think Less. Draft Smarter.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres+Auth-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Tiptap](https://img.shields.io/badge/Tiptap-2.6-6C2BD9)](https://tiptap.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

AI-powered Product Requirement Document generator for B2B internal product teams. DraftMind streamlines the entire PRD lifecycle — from generation to review, collaboration, and export.

## Feature Highlights

- **31 Artboards** — Full design system across onboarding, dashboard, editor, settings, and more
- **6 AI Providers** — Anthropic, OpenAI, Gemini, Groq, Sumopod, GaNRouter via Vercel AI SDK
- **6 Export Formats** — PDF, DOCX, Markdown, HTML, JSON, plain text
- **Rich Editor** — Tiptap-based with slash menu, AI copilot, inline comments, and real-time collaboration (Yjs CRDT)
- **AI Review** — Automated PRD quality analysis with scoring and improvement suggestions
- **Workspace Management** — Multi-member workspaces with role-based access control
- **Tweaks Panel** — Fine-tune AI generation parameters (temperature, model, tone, length)

## Tech Stack

- **Framework**: Next.js 15 (App Router, Server Actions, RSC)
- **Language**: TypeScript 5.5 (strict mode)
- **Styling**: Tailwind CSS 3.4 + CSS Variables design system
- **UI Primitives**: Radix UI + Lucide React icons
- **Editor**: Tiptap 2.6 + Yjs (CRDT)
- **Database**: Supabase (Postgres + Auth + RLS)
- **AI**: Vercel AI SDK (6 providers: Anthropic, OpenAI, Gemini, Groq, Sumopod, GaNRouter)
- **State**: Zustand (client) + TanStack Query (server)
- **Testing**: Vitest + Playwright

## Quick Start

### Prerequisites

- Node.js >= 20.11.0
- pnpm 9.x+
- Supabase CLI (`brew install supabase/tap/supabase`)
- Docker (for Supabase local)

### Setup

```bash
# Clone and install
git clone https://github.com/HakimIqbal/draftmind.git
cd draftmind
pnpm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your values

# Start Supabase local
pnpm db:start
pnpm db:migrate
pnpm db:seed

# Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo Credentials

| Email                  | Password      | Role   |
| ---------------------- | ------------- | ------ |
| `admin@draftmind.test` | `password123` | Admin  |
| `user@draftmind.test`  | `password123` | Member |

### Available Scripts

| Script            | Description                       |
| ----------------- | --------------------------------- |
| `pnpm dev`        | Start development server          |
| `pnpm build`      | Production build                  |
| `pnpm typecheck`  | TypeScript type checking          |
| `pnpm lint`       | ESLint                            |
| `pnpm format`     | Prettier format all files         |
| `pnpm test`       | Unit + component tests (Vitest)   |
| `pnpm test:e2e`   | E2E tests (Playwright)            |
| `pnpm db:start`   | Start local Supabase              |
| `pnpm db:migrate` | Apply database migrations         |
| `pnpm db:types`   | Generate TypeScript types from DB |

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Database Schema](docs/DATABASE.md)
- [Design System](docs/DESIGN_SYSTEM.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [PRD Schema](docs/PRD_SCHEMA.md)
- [API Reference](docs/API.md)
- [User Guide](docs/USER_GUIDE.md)

## Deployment

DraftMind supports three deployment targets:

1. **Local** — Supabase local + Next.js dev server
2. **Vercel** — Serverless deployment (Singapore region `sin1`)
3. **VPS** — Docker container with optional bundled Postgres

See [Deployment Guide](docs/DEPLOYMENT.md) for step-by-step instructions including migrations, seeding, OAuth redirect configuration, and SSL setup.

## License

MIT
