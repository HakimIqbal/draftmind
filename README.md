<p align="center">
  <img src="public/logo/logo.jpg" alt="DraftMind" width="180" />
</p>

<h1 align="center">DraftMind</h1>

<p align="center">
  <strong>Think Less. Draft Smarter.</strong>
</p>

<p align="center">
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-15.0-black?logo=next.js&logoColor=white" alt="Next.js 15" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5.5" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" /></a>
  <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-Postgres+Auth-3FCF8E?logo=supabase&logoColor=white" alt="Supabase" /></a>
  <a href="https://tiptap.dev/"><img src="https://img.shields.io/badge/Tiptap-2.x-6C2BD9?logo=tiptap&logoColor=white" alt="Tiptap" /></a>
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License MIT" />
</p>

---

## Overview

DraftMind is an AI-powered Product Requirement Document (PRD) platform built for B2B internal product teams. It streamlines the entire PRD lifecycle — from AI-assisted generation to collaborative editing, structured review, and multi-format export.

Product managers write better PRDs faster by combining a purpose-built rich text editor with AI tools that generate, review, refine, and score document quality in real time. Teams collaborate in shared workspaces with role-based access, inline comments, and live notifications.

The platform is fully multi-tenant with workspace isolation enforced at the database level via Row Level Security. A super-admin panel provides platform-wide visibility into users, workspaces, AI usage, system health, and support tickets.

---

## Features

### PRD Management

- **AI PRD Generation** — Generate complete structured PRDs from a brief using any configured AI provider
- **Rich Text Editor** — Tiptap-based block editor with headings, tables, task lists, and slash commands
- **Auto-save** — Dual-trigger auto-save (3-second idle + 5-minute interval) with visual save status
- **Version History** — Automatic snapshots on every save; restore any previous version with full diff view
- **Pipeline / Kanban Board** — Visual board grouped by PRD status (Draft → In Review → Refined → Approved → Shipped)
- **Status Workflow** — Six-stage lifecycle: `draft → in_review → reviewed → refined → approved → final`
- **Duplicate & Pin** — Duplicate any PRD; pin important PRDs to the top of the list
- **Share Links** — Generate public share links with optional expiry; hidden sections are filtered from public view

### AI-Powered Features

- **AI Review** — Automated quality analysis scoring completeness, specificity, structural quality, and consistency (0–100 health score)
- **AI Copilot** — Chat-based AI assistant embedded in the editor for questions, feedback, and guidance
- **AI Assist** — Select text and apply 13 inline actions: rewrite, expand, summarize, shorten, translate, add examples, add metrics, convert to table, and more
- **Refine Section** — AI rewrites individual PRD sections with content safety checks
- **Multi-Provider** — Anthropic, OpenAI, Google Gemini, and Groq; priority-based fallback routing if a provider is unavailable

### Collaboration

- **Inline Comments** — Add, reply to, resolve, and reopen comments on any section
- **@Mentions** — Mention team members in comments to trigger targeted notifications
- **Notifications** — Real-time bell icon with 17+ notification types (review requests, mentions, status changes, member events, etc.)
- **Workspace Members** — Invite by email; roles: `admin`, `editor`, `commenter`, `viewer`
- **Online Presence** — Last-active timestamps with online/offline indicator (5-minute threshold)

### Export & Sharing

- **PDF** — Styled export via headless Chromium
- **DOCX** — Microsoft Word format
- **Markdown** — GitHub-flavored Markdown
- **HTML** — Standalone styled HTML
- **Slack** — Slack block kit format
- **Jira** — Jira wiki markup (ADF-compatible)

### Template System

- **Built-in Templates** — Library of pre-built templates (feature PRD, experiment brief, RFC, one-pager, research brief, and more)
- **Custom Templates** — Save any PRD as a workspace-specific template
- **Template Gallery** — Browse and filter templates by category

### Admin System

- **User Management** — Create, ban/unban, reset passwords, toggle admin status
- **Workspace Monitoring** — View all workspaces with member and PRD counts
- **AI Provider Config** — Add and manage AI providers; API keys encrypted with AES-256-GCM
- **AI Runs Dashboard** — Per-operation stats: token usage, latency, success rate, LangSmith traces
- **System Logs** — Real-time error/warning/info log viewer with resolve tracking and JSON export
- **Analytics** — Platform-wide usage metrics: PRDs by status, AI runs by type, user growth
- **Announcements** — Broadcast notifications to all users, by role, or to specific users
- **Support Tickets** — User-submitted tickets with admin status management and automated notifications
- **Activity Log** — Full audit trail of admin actions

---

## Tech Stack

| Category      | Technology                                                      | Version          |
| ------------- | --------------------------------------------------------------- | ---------------- |
| Framework     | Next.js (App Router, Server Components, Server Actions)         | 15.0.4           |
| Language      | TypeScript (strict mode)                                        | 5.5.4            |
| Runtime       | React                                                           | 19.0.0           |
| Styling       | Tailwind CSS + CSS design tokens                                | 3.4.17           |
| UI Primitives | Radix UI (Dialog, Dropdown, Select, Tabs, Tooltip, etc.)        | latest           |
| Icons         | Lucide React                                                    | ^0.400.0         |
| Editor        | Tiptap (ProseMirror-based) with custom extensions               | ^2.27.x          |
| Database      | Supabase — PostgreSQL + Auth + Storage + Realtime               | ^2.45.0          |
| AI Framework  | Vercel AI SDK                                                   | ^4.0.0           |
| AI Providers  | @ai-sdk/anthropic, @ai-sdk/openai, @ai-sdk/google, @ai-sdk/groq | various          |
| Observability | LangSmith                                                       | ^0.6.0           |
| State         | Zustand (client state)                                          | ^4.5.0           |
| Email         | Resend                                                          | ^6.12.2          |
| PDF Export    | Puppeteer Core + @sparticuz/chromium                            | ^23.0.0          |
| DOCX Export   | docx                                                            | ^8.5.0           |
| Toast         | Sonner                                                          | ^1.5.0           |
| Image Crop    | react-avatar-editor                                             | ^15.1.0          |
| Validation    | Zod + react-hook-form                                           | ^3.23.0          |
| Testing       | Vitest + Playwright                                             | ^2.0.0 / ^1.46.0 |
| Linting       | ESLint + Prettier + Husky + lint-staged                         | —                |
| Deployment    | Docker (standalone output) + Caddy reverse proxy                | —                |

---

## Prerequisites

- **Node.js** >= 20.11.0 — see `.nvmrc` (use `nvm use` to switch automatically)
- **pnpm** 9.x — `npm install -g pnpm`
- **Supabase CLI** — [Installation guide](https://supabase.com/docs/guides/cli)
- **Docker** — Required for Supabase local development and production deployment

---

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/HakimIqbal/draftmind.git
cd draftmind
nvm use          # switches to Node 20.11.0 via .nvmrc
pnpm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values. See the [Environment Variables](#environment-variables) section for details.

### 3. Database Setup

```bash
# Start local Supabase (requires Docker)
pnpm db:start

# Apply all 37 migrations + seed demo data
pnpm db:reset
```

Copy the `anon key` and `service_role key` from the `supabase start` output into your `.env.local`.

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo Credentials (after `pnpm db:reset`)

| Email                  | Password    | Role                        |
| ---------------------- | ----------- | --------------------------- |
| `admin@draftmind.com`  | `admin1234` | Super Admin                 |
| `hakim@draftmind.com`  | `user1234`  | Member (Admin of workspace) |
| `maya@draftmind.com`   | `user1234`  | Member                      |
| `rizky@draftmind.com`  | `user1234`  | Member                      |
| `sari@draftmind.com`   | `user1234`  | Member                      |
| `daniel@draftmind.com` | `user1234`  | Member                      |

---

## Environment Variables

| Variable                        | Required | Description                                                                                        |
| ------------------------------- | :------: | -------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      |    ✅    | Supabase project URL (from `supabase status`)                                                      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` |    ✅    | Supabase anon/public key                                                                           |
| `SUPABASE_SERVICE_ROLE_KEY`     |    ✅    | Supabase service role key (bypasses RLS)                                                           |
| `DATABASE_URL`                  |    ✅    | PostgreSQL connection string                                                                       |
| `NEXT_PUBLIC_APP_URL`           |    ✅    | Public URL of the app (e.g. `https://app.draftmind.com`)                                           |
| `ENCRYPTION_KEY`                |    ✅    | 32-byte base64 key for AES-256-GCM encryption of provider API keys                                 |
| `DEPLOYMENT_TARGET`             |    —     | `local` or `production` (affects some config behavior)                                             |
| `SKIP_ENV_VALIDATION`           |    —     | Set `true` only during Docker build                                                                |
| `RESEND_API_KEY`                |    —     | Resend API key for transactional email (invitation emails). Emails are silently skipped if not set |
| `EMAIL_FROM`                    |    —     | Sender address (e.g. `DraftMind <noreply@draftmind.app>`)                                          |
| `LANGCHAIN_API_KEY`             |    —     | LangSmith API key for AI observability                                                             |
| `LANGCHAIN_PROJECT`             |    —     | LangSmith project name                                                                             |
| `LANGCHAIN_TRACING_V2`          |    —     | Set `true` to enable LangSmith tracing                                                             |
| `SUPABASE_WEBHOOK_SECRET`       |    —     | HMAC-SHA256 secret for validating Supabase webhooks                                                |

Generate `ENCRYPTION_KEY`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Project Structure

```
draftmind/
├── src/
│   ├── middleware.ts              # Auth guard, role-based routing, session expiry
│   ├── app/
│   │   ├── (admin)/admin/         # Super admin panel
│   │   │   ├── page.tsx           # Overview dashboard
│   │   │   ├── users/             # User management
│   │   │   ├── workspaces/        # Workspace monitoring
│   │   │   ├── prds/              # Platform-wide PRD list
│   │   │   ├── ai-runs/           # AI usage & stats
│   │   │   ├── analytics/         # Platform analytics
│   │   │   ├── templates/         # Template library management
│   │   │   ├── announcements/     # Broadcast notifications
│   │   │   ├── providers/         # AI provider configuration
│   │   │   ├── tickets/           # Support ticket management
│   │   │   ├── activity/          # Admin activity log
│   │   │   ├── system-logs/       # System error/warn/info logs
│   │   │   └── settings/          # System configuration (read-only)
│   │   ├── (app)/                 # User-facing app
│   │   │   ├── dashboard/         # Home feed with stats and activity
│   │   │   ├── prds/              # PRD list, new, pipeline, editor
│   │   │   ├── templates/         # Template gallery
│   │   │   ├── ai-runs/           # AI runs history
│   │   │   ├── tickets/           # Support tickets
│   │   │   └── workspace/         # Members, settings, activity
│   │   ├── (auth)/login/          # Login page
│   │   ├── api/                   # Route handlers (AI, export, share, providers)
│   │   ├── share/[shareToken]/    # Public PRD share view (no login required)
│   │   ├── change-password/       # Force password change page
│   │   └── page.tsx               # Landing page
│   ├── components/
│   │   ├── editor/                # Tiptap editor shell, toolbar, panels
│   │   ├── admin/                 # Admin-specific components
│   │   ├── layout/                # AppShell, Sidebar, Topbar
│   │   ├── workspace/             # Members tab, workspace hub
│   │   └── ui/                    # Base UI components (Avatar, Button, etc.)
│   ├── lib/
│   │   ├── ai/                    # AI providers, prompts, rate limiting
│   │   ├── auth/                  # Permissions, requireUser, requireWorkspaceRole
│   │   ├── db/queries/            # Supabase query functions
│   │   ├── email/                 # Resend email utilities
│   │   ├── notifications/         # Notification sender
│   │   └── supabase/              # Client/server/admin/middleware Supabase clients
│   └── types/                     # TypeScript types (database.ts auto-generated)
├── supabase/
│   ├── config.toml                # Local Supabase configuration
│   └── migrations/                # 37 sequential SQL migrations
├── scripts/
│   ├── seed.ts                    # Seed demo users, workspace, and PRDs
│   └── generate-types.ts          # Regenerate src/types/database.ts from DB schema
├── tests/
│   ├── e2e/                       # Playwright end-to-end tests
│   ├── smoke/                     # Vitest smoke tests (auth, crypto, schema)
│   └── unit/                      # Unit test stubs
├── docs/                          # Technical documentation
├── public/                        # Static assets (logo, icons, fonts)
├── Dockerfile                     # Multi-stage Docker build
├── docker-compose.yml             # Docker Compose for VPS deployment
└── .github/workflows/             # CI: typecheck + lint + test on PR; E2E on push
```

---

## Available Scripts

| Script            | Description                                       |
| ----------------- | ------------------------------------------------- |
| `pnpm dev`        | Start development server with hot reload          |
| `pnpm build`      | Production build                                  |
| `pnpm start`      | Start production server                           |
| `pnpm typecheck`  | TypeScript type check (`tsc --noEmit`)            |
| `pnpm lint`       | ESLint check                                      |
| `pnpm format`     | Prettier format all files                         |
| `pnpm test`       | Unit + smoke tests (Vitest)                       |
| `pnpm test:e2e`   | End-to-end tests (Playwright)                     |
| `pnpm db:start`   | Start local Supabase (Docker required)            |
| `pnpm db:stop`    | Stop local Supabase                               |
| `pnpm db:reset`   | Reset DB + apply all migrations + seed            |
| `pnpm db:migrate` | Apply pending migrations only                     |
| `pnpm db:seed`    | Seed database with demo data                      |
| `pnpm db:types`   | Regenerate `src/types/database.ts` from DB schema |

---

## Deployment

DraftMind is designed for self-hosted deployment on a VPS using Docker.

### Docker (Production)

```bash
# Build image
docker build -t draftmind .

# Run container (inject environment variables)
docker run -p 3000:3000 --env-file .env.production draftmind
```

The Dockerfile uses a multi-stage build (`deps → builder → runner`) based on `node:20-alpine`. The runner stage installs Chromium for PDF export and runs as a non-root user.

### Docker Compose

```bash
docker compose up -d
```

### Database Migrations (Production)

Apply all 37 migrations to your production Supabase project:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

### CI/CD

GitHub Actions workflows are included in `.github/workflows/`:

- **`ci.yml`** — Runs on every pull request: `typecheck → lint → vitest`
- **`e2e.yml`** — Runs on push to `main`: Playwright end-to-end tests

---

## Documentation

| Document                                     | Description                                    |
| -------------------------------------------- | ---------------------------------------------- |
| [Architecture](docs/ARCHITECTURE.md)         | System design, layers, and folder structure    |
| [Database Schema](docs/DATABASE.md)          | Tables, RLS policies, enums, and triggers      |
| [PRD Schema](docs/PRD_SCHEMA.md)             | PRD document structure and section definitions |
| [API Reference](docs/API.md)                 | Route handlers and server actions              |
| [Design System](docs/DESIGN_SYSTEM.md)       | Design tokens, components, and typography      |
| [Deployment Guide](docs/DEPLOYMENT.md)       | Local, Docker, and Supabase Cloud setup        |
| [Contributing](docs/CONTRIBUTING.md)         | Commit conventions, code style, and workflow   |
| [User Guide](docs/USER_GUIDE.md)             | End-user feature walkthrough                   |
| [Feature Overview](docs/FEATURE_OVERVIEW.md) | Complete feature list by module                |

---

## License

MIT
