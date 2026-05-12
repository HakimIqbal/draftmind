<p align="center">
  <img src="public/logo/logo.jpg" alt="DraftMind" width="180" />
</p>

<h1 align="center">DraftMind</h1>

<p align="center">
  <strong>Think Less. Draft Smarter.</strong>
</p>

<p align="center">
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js 15" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" /></a>
  <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-Postgres+Auth-3FCF8E?logo=supabase&logoColor=white" alt="Supabase" /></a>
  <a href="https://tiptap.dev/"><img src="https://img.shields.io/badge/Tiptap-2.x-6C2BD9" alt="Tiptap" /></a>
</p>

---

AI-powered Product Requirement Document generator for B2B internal product teams. DraftMind streamlines the entire PRD lifecycle — from generation to review, collaboration, and export.

## Features

- **AI PRD Generation** — Generate complete 14-section PRDs from a brief using any of 6 AI providers
- **Rich Editor** — Tiptap-based block editor with slash menu, inline comments, version history, and health scoring
- **AI Copilot** — Chat-based AI assistant embedded in the editor for PRD questions and feedback
- **AI Assist** — Select text and apply 13 inline actions (rewrite, expand, translate, add metrics, etc.)
- **AI Review** — Automated PRD quality analysis with scoring and improvement suggestions
- **6 Export Formats** — PDF, DOCX, Markdown, HTML, Slack blocks, Jira ADF
- **Workspace Management** — Multi-member workspaces with role-based access (admin, editor, commenter, viewer)
- **Template System** — Pre-built and custom PRD templates
- **Admin Panel** — Super admin dashboard with user management, analytics, system logs, and provider configuration
- **Multi-Provider AI** — Anthropic, OpenAI, Gemini, Groq, Sumopod, GaNRouter with priority-based fallback

## Tech Stack

| Category      | Technology                                   |
| ------------- | -------------------------------------------- |
| Framework     | Next.js 15 (App Router, Server Actions, RSC) |
| Language      | TypeScript 5.5 (strict mode)                 |
| Styling       | Tailwind CSS 3.4 + CSS design tokens         |
| UI            | Radix UI + Lucide React icons                |
| Editor        | Tiptap 2.x with custom extensions            |
| Database      | Supabase (Postgres + Auth + RLS)             |
| AI            | Vercel AI SDK v4 (6 providers)               |
| State         | Zustand (client) + TanStack Query (server)   |
| Email         | Resend (optional)                            |
| Observability | LangSmith (optional)                         |
| Testing       | Vitest + Playwright                          |
| Deployment    | Vercel (serverless) or Docker (VPS)          |

## Quick Start

### Prerequisites

- Node.js >= 20.11.0 (see `.nvmrc`)
- pnpm 9.x
- Supabase CLI
- Docker

### Setup

```bash
# Clone and install
git clone https://github.com/HakimIqbal/draftmind.git
cd draftmind
nvm use
pnpm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your values

# Start Supabase and seed database
pnpm db:start
pnpm db:reset        # runs all 17 migrations + seed

# Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo Credentials

| Email                  | Password      | Role        |
| ---------------------- | ------------- | ----------- |
| `admin@draftmind.test` | `password123` | Super Admin |
| `user@draftmind.test`  | `password123` | Member      |

### Scripts

| Script            | Description                       |
| ----------------- | --------------------------------- |
| `pnpm dev`        | Start development server          |
| `pnpm build`      | Production build                  |
| `pnpm start`      | Start production server           |
| `pnpm typecheck`  | TypeScript type checking          |
| `pnpm lint`       | ESLint check                      |
| `pnpm format`     | Prettier format all files         |
| `pnpm test`       | Unit + integration tests (Vitest) |
| `pnpm test:e2e`   | E2E tests (Playwright)            |
| `pnpm db:start`   | Start local Supabase              |
| `pnpm db:stop`    | Stop local Supabase               |
| `pnpm db:reset`   | Reset DB + run migrations + seed  |
| `pnpm db:migrate` | Apply pending migrations          |
| `pnpm db:seed`    | Seed database with sample data    |
| `pnpm db:types`   | Generate TypeScript types from DB |

## Documentation

| Document                               | Description                               |
| -------------------------------------- | ----------------------------------------- |
| [Architecture](docs/ARCHITECTURE.md)   | System overview, layers, folder structure |
| [Database Schema](docs/DATABASE.md)    | Tables, RLS policies, enums, triggers     |
| [PRD Schema](docs/PRD_SCHEMA.md)       | 14-section PRD document structure         |
| [API Reference](docs/API.md)           | Route handlers + server actions           |
| [Design System](docs/DESIGN_SYSTEM.md) | Tokens, components, typography            |
| [Deployment](docs/DEPLOYMENT.md)       | Local, Vercel, and Docker setup           |
| [Contributing](docs/CONTRIBUTING.md)   | Commit conventions, scripts, code style   |
| [User Guide](docs/USER_GUIDE.md)       | End-user feature guide                    |

## Deployment

DraftMind supports three deployment targets:

1. **Local** — Supabase CLI + Next.js dev server
2. **Vercel** — Serverless deployment (Singapore region `sin1`)
3. **VPS** — Docker container with optional bundled Postgres

See [Deployment Guide](docs/DEPLOYMENT.md) for details.

## License

MIT
