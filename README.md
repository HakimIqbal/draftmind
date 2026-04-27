# DraftMind

**Think Less. Draft Smarter.**

AI-powered Product Requirement Document generator for B2B internal product teams.

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

## Quick Start (Local Development)

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

## Deployment

DraftMind supports three deployment targets:

1. **Local** — Supabase local + Next.js dev server
2. **Vercel** — Serverless deployment (Singapore region)
3. **VPS** — Docker container with optional bundled Postgres

See [Deployment Guide](docs/DEPLOYMENT.md) for details.

## License

MIT
