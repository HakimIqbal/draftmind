# DraftMind — Master Brief untuk Claude Code

> **Status**: Single source of truth. Semua phase prompt (01-04) reference dokumen ini. Jangan modify isi file ini selama build phase berjalan tanpa propagate update ke phase prompts.

---

## 0 — Cara Pakai Dokumen Ini

Ini bukan prompt untuk dieksekusi langsung. Ini referensi/spec yang dibaca Claude Code di awal setiap session sebelum kerja phase prompt. Workflow:

1. User buka Claude Code di terminal/VSCode/JetBrains
2. User attach file ini sebagai context atau letakkan di `/.claude/MASTER_BRIEF.md` di root project
3. User attach phase prompt (01_PHASE1_FOUNDATION.md, dst) — phase prompt akan reference master brief
4. Claude Code baca master brief sekali, lalu eksekusi phase prompt dengan semua context dari master brief sudah loaded

Master brief mencakup: project goal, tech stack lengkap dengan version pinning, design system tokens, database schema lengkap, API routes inventory, deployment config triple-support, folder structure, naming conventions, code style.

---

## 1 — Project Identity

**Nama**: DraftMind
**Tagline**: Think Less. Draft Smarter.
**One-liner**: AI-powered Product Requirement Document generator untuk B2B internal product teams di Indonesia.
**Konteks**: Final Year Project (FYP) — solo developer build, target submission semester ini.
**Target user**: Product Managers, Business Analysts, Project Managers, Technical Leads di company medium-size tech Indonesia (Algo Network sebagai sample workspace).
**Use case primary**: User input brief produk → AI generate PRD terstruktur 14 sections → user review/edit/refine → export ke PDF/DOCX/Slack/Jira.

**Bahasa**: UI labels English, sample content mix English + Bahasa Indonesia.

**Out-of-scope FYP**: payment integration (Stripe/Midtrans), enterprise SSO setup wizard real (SCIM provisioning), public marketing site, mobile native app. Semua ini di-mock di UI sebagai "Enterprise only" disabled state atau "Coming soon" placeholder.

---

## 2 — Tech Stack (Pinned Versions)

```yaml
runtime:
  node: '>=20.11.0 <22'
  package_manager: 'pnpm@9.x' # bukan npm, bukan yarn — pnpm karena workspace + speed

framework:
  next: '15.0.x' # App Router, Server Actions, RSC
  react: '19.0.x'
  typescript: '5.5.x'

styling:
  tailwindcss: '3.4.x' # bukan v4 — v3 lebih stable untuk production
  tailwindcss-animate: '^1.0'
  class-variance-authority: '^0.7'
  clsx: '^2.1'
  tailwind-merge: '^2.5'

ui_primitives:
  '@radix-ui/react-*': 'latest' # Dialog, Dropdown, Popover, Select, Tabs, Toast
  'lucide-react': '^0.400' # SEMUA icons — strict, no other icon library
  'sonner': '^1.5' # toast notifications
  'cmdk': '^1.0' # command palette A031

editor:
  '@tiptap/react': '^2.6'
  '@tiptap/starter-kit': '^2.6'
  '@tiptap/extension-collaboration': '^2.6'
  '@tiptap/extension-collaboration-cursor': '^2.6'
  '@tiptap/extension-placeholder': '^2.6'
  '@tiptap/extension-mention': '^2.6'
  '@tiptap/extension-task-list': '^2.6'
  '@tiptap/extension-task-item': '^2.6'
  '@tiptap/extension-link': '^2.6'
  '@tiptap/extension-table': '^2.6'
  'yjs': '^13.6' # CRDT untuk real-time collab
  'y-supabase': 'latest' # Yjs <-> Supabase bridge

ai:
  'ai': '^4.0' # Vercel AI SDK
  '@ai-sdk/anthropic': '^1.0'
  '@ai-sdk/openai': '^1.0'
  '@ai-sdk/google': '^1.0'
  '@ai-sdk/groq': '^1.0'
  # Sumopod + GaNRouter via OpenAI-compatible adapter (custom config)

database:
  '@supabase/supabase-js': '^2.45'
  '@supabase/ssr': '^0.5' # Next.js App Router SSR auth
  'drizzle-orm': '^0.33' # type-safe queries di atas Supabase Postgres
  'drizzle-kit': '^0.24' # migrations
  'postgres': '^3.4' # driver

state:
  'zustand': '^4.5' # client-state (UI state, tweaks panel)
  '@tanstack/react-query': '^5.50' # server-state cache
  'nuqs': '^2.0' # URL state (filters, tabs)

forms:
  'react-hook-form': '^7.52'
  'zod': '^3.23'
  '@hookform/resolvers': '^3.9'

export:
  'puppeteer-core': '^23' # PDF export (server-side)
  '@sparticuz/chromium': '^127' # chromium binary untuk Vercel (serverless friendly)
  'docx': '^8.5' # DOCX export
  'marked': '^14' # MD parsing
  'remark-gfm': '^4'

utils:
  'date-fns': '^3.6'
  'nanoid': '^5.0'
  'tiny-invariant': '^1.3'

dev:
  'eslint': '^9'
  'eslint-config-next': '15.0.x'
  'prettier': '^3.3'
  'prettier-plugin-tailwindcss': '^0.6'
  'vitest': '^2.0'
  '@testing-library/react': '^16'
  '@playwright/test': '^1.46'
```

**Strict rule**: NO additional library tanpa justification. Kalau Claude Code mau pakai library di luar list ini, harus tanya user dulu dengan reasoning kenapa stack di atas tidak cukup.

**Strict rule 2**: NO icon library selain `lucide-react`. Kalau butuh icon yang Lucide tidak punya, custom SVG di `components/icons/` dengan style match Lucide (1.5px stroke, 24×24 viewbox, currentColor).

---

## 3 — Folder Structure (Locked)

```
draftmind/
├── .claude/
│   ├── MASTER_BRIEF.md              # this file — readonly during build
│   ├── settings.local.json          # claude code settings
│   └── commands/                    # custom slash commands (optional)
├── .github/
│   └── workflows/
│       ├── ci.yml                   # type-check + lint + test on PR
│       └── e2e.yml                  # Playwright on main
├── docs/
│   ├── ARCHITECTURE.md              # high-level diagram
│   ├── DATABASE.md                  # schema + ERD + RLS policies
│   ├── DESIGN_SYSTEM.md             # tokens, components, usage
│   ├── DEPLOYMENT.md                # Vercel + VPS + local guide
│   ├── PRD_SCHEMA.md                # 14-section JSON structure
│   └── API.md                       # endpoint inventory
├── public/
│   ├── fonts/                       # self-hosted Fraunces, Inter Tight, IBM Plex Mono, Geist, DM Serif/Sans, Playfair
│   ├── logo/
│   │   ├── tier1-full.svg           # halftone brain illustration
│   │   ├── tier1-full.png           # raster fallback @2x
│   │   ├── tier2-mark.svg           # ember circle + serif "D"
│   │   └── favicon.ico
│   └── og/                          # OG images
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── (marketing)/             # public route group — minimal, hanya redirect ke /login
│   │   │   └── page.tsx
│   │   ├── (auth)/                  # auth flow — A001-A005
│   │   │   ├── login/
│   │   │   │   └── page.tsx         # A001
│   │   │   ├── onboarding/
│   │   │   │   ├── step-1/page.tsx  # A002
│   │   │   │   ├── step-2/page.tsx  # A003
│   │   │   │   ├── step-3/page.tsx  # A004
│   │   │   │   └── step-4/page.tsx  # A005
│   │   │   └── layout.tsx
│   │   ├── (app)/                   # authenticated app — protected by middleware
│   │   │   ├── layout.tsx           # sidebar + topbar shell
│   │   │   ├── home/page.tsx        # A006
│   │   │   ├── prds/
│   │   │   │   ├── page.tsx         # A007 list table (default)
│   │   │   │   ├── pipeline/page.tsx # A008
│   │   │   │   ├── new/page.tsx     # A010 generate form
│   │   │   │   └── [prdId]/
│   │   │   │       ├── page.tsx     # A012 editor default
│   │   │   │       ├── ai-review/page.tsx     # A019
│   │   │   │       ├── version-history/page.tsx # A020
│   │   │   │       └── export/page.tsx        # backend untuk A026
│   │   │   ├── templates/page.tsx   # A021
│   │   │   ├── workspace/
│   │   │   │   └── members/page.tsx # A022
│   │   │   ├── settings/
│   │   │   │   ├── profile/page.tsx
│   │   │   │   ├── preferences/page.tsx
│   │   │   │   ├── providers/page.tsx        # A024
│   │   │   │   ├── api-keys/page.tsx
│   │   │   │   ├── notifications/page.tsx
│   │   │   │   └── audit/page.tsx            # A028
│   │   │   ├── ai-runs/page.tsx              # A029
│   │   │   └── empty/page.tsx                # A009 (fallback no PRDs)
│   │   ├── share/[shareToken]/page.tsx       # A027 public share view
│   │   ├── api/
│   │   │   ├── prd/
│   │   │   │   ├── generate/route.ts         # POST AI generate full PRD
│   │   │   │   ├── refine/route.ts           # POST refine section
│   │   │   │   ├── ai-review/route.ts        # POST run AI review
│   │   │   │   ├── ai-suggest/route.ts       # POST inline suggestion (selection-based)
│   │   │   │   ├── export/route.ts           # POST export multi-format
│   │   │   │   └── [prdId]/
│   │   │   │       ├── versions/route.ts     # GET list, POST snapshot
│   │   │   │       └── share/route.ts        # POST create share link
│   │   │   ├── workspace/
│   │   │   │   ├── members/route.ts
│   │   │   │   └── invite/route.ts
│   │   │   ├── providers/
│   │   │   │   ├── route.ts                  # GET list user providers, POST add
│   │   │   │   ├── test/route.ts             # POST validate API key
│   │   │   │   └── [providerId]/route.ts     # PATCH, DELETE
│   │   │   ├── webhooks/
│   │   │   │   └── supabase/route.ts         # auth events
│   │   │   └── og/
│   │   │       └── route.tsx                 # dynamic OG image
│   │   ├── layout.tsx                        # root layout, theme provider, fonts
│   │   ├── globals.css                       # Tailwind + design tokens CSS variables
│   │   ├── error.tsx
│   │   ├── not-found.tsx
│   │   └── loading.tsx
│   ├── components/
│   │   ├── ui/                               # primitive components (Tenet-compliant)
│   │   │   ├── button.tsx                    # variant: primary-fill (rare), outline, ghost, link, destructive
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── select.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── radio-card.tsx                # untuk onboarding + export modal
│   │   │   ├── chip.tsx                      # filter chip (text-only, underline active)
│   │   │   ├── pill.tsx                      # status pill Tenet 3 (dot + label)
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx                    # modal — Radix base
│   │   │   ├── popover.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── tabs.tsx                      # underline-style only
│   │   │   ├── tooltip.tsx
│   │   │   ├── avatar.tsx                    # initial-based, NO image upload v1
│   │   │   ├── progress-bar.tsx              # thin 2px ember
│   │   │   ├── progress-ring.tsx             # health score visual
│   │   │   ├── skeleton.tsx
│   │   │   ├── separator.tsx                 # hairline 1px ink 6%
│   │   │   ├── sigil.tsx                     # mono "§ NN Section" + dot
│   │   │   └── kbd.tsx                       # keyboard shortcut hint mono
│   │   ├── icons/
│   │   │   ├── logo-tier1.tsx                # SVG halftone brain inline
│   │   │   ├── logo-tier2.tsx                # SVG ember mark with "D"
│   │   │   ├── sparkle.tsx                   # ✦ AI sigil
│   │   │   └── provider/
│   │   │       ├── anthropic.tsx             # mono line glyph stylized
│   │   │       ├── openai.tsx
│   │   │       ├── gemini.tsx
│   │   │       ├── groq.tsx
│   │   │       ├── sumopod.tsx
│   │   │       └── ganrouter.tsx
│   │   ├── layout/
│   │   │   ├── sidebar.tsx                   # nav + workspaces + pinned
│   │   │   ├── sidebar-collapsed-rail.tsx
│   │   │   ├── topbar.tsx
│   │   │   ├── workspace-switcher.tsx        # A023 popover
│   │   │   └── notifications-inbox.tsx       # A030
│   │   ├── editor/
│   │   │   ├── tiptap-editor.tsx
│   │   │   ├── slash-menu.tsx                # A015
│   │   │   ├── ai-suggestion-callout.tsx     # inline AI suggestion card
│   │   │   ├── selection-toolbar.tsx         # floating toolbar on selection
│   │   │   ├── outline-panel.tsx             # left panel A012
│   │   │   ├── comments-panel.tsx            # left panel A014
│   │   │   ├── info-panel.tsx                # left panel
│   │   │   ├── ai-copilot-panel.tsx          # right panel A012
│   │   │   ├── ai-assist-panel.tsx           # right panel A013 (selection-based)
│   │   │   ├── panel-collapsed-rail.tsx      # icon rail when collapsed
│   │   │   ├── editor-header.tsx             # status, version, share, kebab
│   │   │   ├── health-score-display.tsx      # ring + 4 sub-bars
│   │   │   └── markdown-view.tsx             # A016
│   │   ├── dashboard/
│   │   │   ├── home-feed.tsx                 # A006
│   │   │   ├── home-quick-input.tsx          # "What are we shipping today?"
│   │   │   ├── stat-card.tsx                 # A006 stats
│   │   │   ├── continue-working-card.tsx
│   │   │   ├── activity-feed.tsx
│   │   │   ├── needs-attention-card.tsx
│   │   │   ├── prd-list-table.tsx            # A007
│   │   │   └── prd-pipeline-board.tsx        # A008 kanban read-only
│   │   ├── generate/
│   │   │   ├── generate-form.tsx             # A010
│   │   │   ├── generation-loading.tsx        # A011 inline skeleton + step list
│   │   │   └── generation-step-list.tsx
│   │   ├── refine/
│   │   │   ├── refine-section-modal.tsx      # A017
│   │   │   ├── regenerate-full-modal.tsx     # A018
│   │   │   └── ai-review-page.tsx            # A019 main
│   │   ├── version/
│   │   │   ├── version-timeline.tsx          # A020 left
│   │   │   └── version-diff-view.tsx         # A020 right
│   │   ├── templates/
│   │   │   └── template-card.tsx             # A021
│   │   ├── workspace/
│   │   │   ├── members-table.tsx             # A022
│   │   │   └── invite-pending-row.tsx
│   │   ├── settings/
│   │   │   ├── provider-card.tsx             # A024
│   │   │   ├── add-provider-wizard.tsx       # A025 4-step
│   │   │   └── api-key-input.tsx             # password mask + test button
│   │   ├── export/
│   │   │   └── export-modal.tsx              # A026
│   │   ├── share/
│   │   │   └── public-share-view.tsx         # A027
│   │   ├── audit/
│   │   │   ├── activity-log.tsx              # A028
│   │   │   └── ai-run-history-table.tsx      # A029
│   │   ├── overlays/
│   │   │   ├── command-palette.tsx           # A031 (cmdk)
│   │   │   └── notifications-panel.tsx
│   │   └── tweaks/
│   │       ├── tweaks-button.tsx             # floating bottom-right (dev only)
│   │       └── tweaks-panel.tsx              # 7 parameter dropdowns
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                     # browser client
│   │   │   ├── server.ts                     # server component client
│   │   │   ├── middleware.ts                 # auth refresh
│   │   │   └── admin.ts                      # service role (server-only)
│   │   ├── db/
│   │   │   ├── schema.ts                     # Drizzle schema (mirror of Supabase)
│   │   │   ├── queries/
│   │   │   │   ├── prd.ts
│   │   │   │   ├── workspace.ts
│   │   │   │   ├── provider.ts
│   │   │   │   ├── version.ts
│   │   │   │   ├── activity.ts
│   │   │   │   └── notification.ts
│   │   │   └── migrations/
│   │   ├── ai/
│   │   │   ├── providers.ts                  # provider registry (6 providers)
│   │   │   ├── client.ts                     # createAIClient(providerId, apiKey)
│   │   │   ├── prompts/
│   │   │   │   ├── generate-prd.ts           # full PRD generation prompt
│   │   │   │   ├── refine-section.ts
│   │   │   │   ├── ai-review.ts              # quality score + findings
│   │   │   │   ├── inline-suggest.ts         # selection-based
│   │   │   │   └── system.ts                 # shared system prompt
│   │   │   ├── schema.ts                     # Zod schema untuk AI structured output
│   │   │   └── streaming.ts                  # SSE / streamText helper
│   │   ├── prd/
│   │   │   ├── schema.ts                     # 14 sections JSON schema
│   │   │   ├── health-score.ts               # compute completeness/specificity/structural/consistency
│   │   │   ├── readability.ts                # Flesch-Kincaid lite
│   │   │   ├── markdown.ts                   # PRD JSON <-> Markdown
│   │   │   └── tiptap-content.ts             # PRD JSON <-> Tiptap content
│   │   ├── export/
│   │   │   ├── pdf.ts                        # Puppeteer + Chromium
│   │   │   ├── docx.ts                       # docx library
│   │   │   ├── markdown.ts
│   │   │   ├── html.ts
│   │   │   ├── slack.ts                      # blocks formatter
│   │   │   └── jira.ts                       # ADF formatter
│   │   ├── auth/
│   │   │   └── permissions.ts                # role-based check (Admin/Editor/Commenter/Viewer)
│   │   ├── utils/
│   │   │   ├── cn.ts                         # clsx + tailwind-merge
│   │   │   ├── format.ts                     # date, number, relative time
│   │   │   ├── slug.ts                       # workspace slug generator
│   │   │   └── id.ts                         # nanoid wrappers
│   │   └── tweaks/
│   │       └── tokens.ts                     # 7 parameter token resolver
│   ├── hooks/
│   │   ├── use-tweaks.ts                     # zustand store untuk 7 params
│   │   ├── use-supabase.ts
│   │   ├── use-prd.ts                        # PRD CRUD via React Query
│   │   ├── use-keyboard.ts                   # global shortcuts (cmd+k, etc)
│   │   ├── use-debounce.ts
│   │   └── use-local-storage.ts
│   ├── stores/
│   │   ├── tweaks-store.ts                   # zustand
│   │   ├── editor-store.ts                   # collapse state, active tab
│   │   └── command-palette-store.ts
│   ├── types/
│   │   ├── prd.ts
│   │   ├── provider.ts
│   │   ├── workspace.ts
│   │   ├── activity.ts
│   │   └── database.ts                       # generated from Supabase
│   ├── styles/
│   │   ├── tokens.css                        # CSS variables 7 tweaks parameters
│   │   ├── fonts.css                         # @font-face declarations
│   │   └── editor.css                        # Tiptap content styles
│   ├── middleware.ts                         # Next.js middleware: auth refresh + protected routes
│   └── env.ts                                # @t3-oss/env-nextjs validation
├── supabase/
│   ├── migrations/                           # SQL migrations (versioned)
│   ├── seed.sql                              # sample data untuk dev
│   ├── functions/                            # Edge Functions (jika perlu)
│   └── config.toml
├── tests/
│   ├── unit/
│   │   ├── lib/
│   │   └── components/
│   ├── integration/
│   │   └── api/
│   └── e2e/
│       ├── auth.spec.ts
│       ├── generate-prd.spec.ts
│       ├── editor.spec.ts
│       └── export.spec.ts
├── scripts/
│   ├── seed.ts                               # populate dev database
│   ├── migrate.ts
│   └── generate-types.ts                     # supabase types regen
├── .env.example                              # template (committed)
├── .env.local                                # actual (gitignored)
├── .gitignore
├── .nvmrc                                    # node version pin
├── .prettierrc
├── eslint.config.mjs
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── drizzle.config.ts
├── playwright.config.ts
├── vitest.config.ts
├── package.json
├── pnpm-lock.yaml
├── Dockerfile                                # untuk VPS deployment
├── docker-compose.yml                        # untuk local Postgres alt + VPS
├── vercel.json                               # Vercel deployment config
├── README.md
└── LICENSE
```

**Strict rules untuk struktur:**

1. NEVER create file di luar struktur ini tanpa update master brief dulu
2. Component naming: `kebab-case.tsx` for files, `PascalCase` for exports
3. Hook naming: `use-*.ts` files, `useX` exports
4. API route file SELALU `route.ts`, server action SELALU di `actions.ts` per route
5. Test file colocate dengan source: `button.tsx` + `button.test.tsx` di folder yang sama (untuk unit), atau di `tests/` untuk integration/e2e

---

## 4 — Database Schema (Supabase Postgres)

Schema lengkap untuk support 31 artboard. Semua tabel pakai RLS (Row Level Security).

### 4.1 Identity & Workspace

```sql
-- profiles: extends auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_initials text,                       -- "MR" untuk Maya Reyes
  avatar_color_seed text,                     -- deterministic color per user
  role_self_reported text,                    -- "Product Manager", "Business Analyst", etc
  experience_level text,                      -- "Beginner" | "Intermediate" | "Expert"
  primary_use_cases text[],                   -- ["Feature PRD", "RFC", ...]
  default_locale text default 'en' not null,  -- 'en' | 'id'
  onboarding_completed_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- workspaces
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon_pattern text default 'circle' not null, -- 'circle' | 'square' | 'rounded' | 'hexagon' | 'custom'
  icon_custom_url text,
  is_private boolean default true not null,
  industry text,
  team_size text,                             -- "Just me" | "2-10" | "11-50" | "51-200" | "200+"
  owner_id uuid references public.profiles(id) on delete restrict not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- workspace_members: M2M dengan role
create type workspace_role as enum ('admin', 'editor', 'commenter', 'viewer');

create table public.workspace_members (
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role workspace_role default 'editor' not null,
  joined_at timestamptz default now() not null,
  last_active_at timestamptz,
  primary key (workspace_id, user_id)
);

-- workspace_invitations: pending state
create table public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  email text not null,
  role workspace_role default 'editor' not null,
  invited_by uuid references public.profiles(id) on delete set null,
  token text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz default now() not null
);
```

### 4.2 PRD & Editor

```sql
-- prd_templates: built-in 12 + custom per workspace
create table public.prd_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,  -- nullable = global built-in
  name text not null,
  description text,
  category text not null,                     -- 'feature' | 'experiment' | 'rfc' | 'one-pager' | 'research' | 'custom'
  structure jsonb not null,                   -- 14 sections schema customized
  use_count integer default 0 not null,
  is_built_in boolean default false not null,
  created_at timestamptz default now() not null
);

-- prds: main document
create type prd_status as enum (
  'draft', 'in_review', 'reviewed', 'refined', 'final', 'blocked', 'approved', 'shipped', 'archived'
);

create table public.prds (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  owner_id uuid references public.profiles(id) on delete restrict not null,
  template_id uuid references public.prd_templates(id) on delete set null,
  title text not null,
  project_tag text,                           -- "Q2 2026 Growth", "Payments", etc
  status prd_status default 'draft' not null,
  content jsonb not null,                     -- 14-section JSON, see PRD_SCHEMA.md
  tiptap_content jsonb,                       -- Tiptap editor state mirror
  health_score integer,                       -- 0-100, computed
  health_breakdown jsonb,                     -- {completeness, specificity, structural, consistency}
  word_count integer default 0 not null,
  read_time_minutes integer default 0 not null,
  readability_score text,                     -- 'Excellent' | 'Good' | 'Fair' | 'Poor'
  current_version integer default 1 not null,
  is_pinned boolean default false not null,
  metadata jsonb default '{}'::jsonb not null,  -- start_date, end_date, stakeholders, etc
  archived_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_prds_workspace_status on public.prds(workspace_id, status) where archived_at is null;
create index idx_prds_owner on public.prds(owner_id);
create index idx_prds_updated on public.prds(updated_at desc);

-- prd_sections: optional denormalization untuk query per-section
create table public.prd_sections (
  prd_id uuid references public.prds(id) on delete cascade not null,
  section_key text not null,                  -- 'overview', 'problem_statement', 'objectives', 'darci', 'scope', 'user_stories', 'functional_reqs', 'nfr', 'success_metrics', 'timeline', 'risks', 'references', 'glossary', 'changelog'
  content jsonb not null,
  health_score integer,
  word_count integer default 0 not null,
  updated_at timestamptz default now() not null,
  primary key (prd_id, section_key)
);

-- prd_versions: snapshots
create table public.prd_versions (
  id uuid primary key default gen_random_uuid(),
  prd_id uuid references public.prds(id) on delete cascade not null,
  version_number integer not null,
  content jsonb not null,                     -- full snapshot
  diff_from_previous jsonb,                   -- structured diff
  change_summary text,
  created_by uuid references public.profiles(id) on delete set null,
  source text not null,                       -- 'manual' | 'ai_generation' | 'ai_refine' | 'restore'
  ai_run_id uuid,                             -- references ai_runs(id) jika source AI
  created_at timestamptz default now() not null,
  unique (prd_id, version_number)
);

-- comments: threaded
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  prd_id uuid references public.prds(id) on delete cascade not null,
  parent_id uuid references public.comments(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  is_ai_generated boolean default false not null,
  section_key text,                           -- anchor ke section
  selection_range jsonb,                      -- {from, to, text} untuk inline comment
  body text not null,
  reactions jsonb default '{}'::jsonb not null, -- {"👍": [user_id_1, user_id_2], "🔥": [...]}
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  mentions uuid[] default array[]::uuid[],     -- @mention user_ids
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_comments_prd on public.comments(prd_id) where resolved_at is null;

-- prd_shares: public read-only links
create table public.prd_shares (
  id uuid primary key default gen_random_uuid(),
  prd_id uuid references public.prds(id) on delete cascade not null,
  share_token text not null unique,           -- nanoid 16 char
  created_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz,
  view_count integer default 0 not null,
  is_active boolean default true not null,
  created_at timestamptz default now() not null
);
```

### 4.3 AI Provider & Runs

```sql
create type provider_type as enum (
  'anthropic', 'openai', 'gemini', 'groq', 'sumopod', 'ganrouter', 'custom'
);

create type provider_status as enum ('active', 'disconnected', 'error');

-- providers: per-workspace LLM config
create table public.providers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  type provider_type not null,
  display_name text not null,
  base_url text,                              -- untuk OpenAI-compatible custom (Sumopod, GaNRouter)
  api_key_encrypted text not null,            -- encrypted at rest, decrypt server-only
  default_model text not null,                -- "claude-sonnet-4-6", "gpt-4o", etc
  available_models text[] not null default array[]::text[],
  is_default boolean default false not null,
  status provider_status default 'active' not null,
  status_reason text,                         -- error message kalau status error
  last_used_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- only one default per workspace
create unique index idx_providers_one_default on public.providers(workspace_id) where is_default;

-- ai_runs: every AI invocation logged
create type ai_run_type as enum (
  'generate_prd', 'refine_section', 'regenerate_prd', 'ai_review', 'inline_suggest', 'quick_action'
);

create type ai_run_status as enum ('queued', 'running', 'success', 'error', 'cancelled');

create table public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  prd_id uuid references public.prds(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  provider_id uuid references public.providers(id) on delete set null,
  type ai_run_type not null,
  status ai_run_status default 'queued' not null,
  model_used text not null,
  prompt_tokens integer,
  completion_tokens integer,
  total_tokens integer,
  duration_ms integer,
  cost_credits integer,                       -- internal credit estimation
  input_payload jsonb,                        -- request data
  output_payload jsonb,                       -- response data
  error_message text,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamptz default now() not null,
  completed_at timestamptz
);

create index idx_ai_runs_workspace on public.ai_runs(workspace_id, created_at desc);
create index idx_ai_runs_prd on public.ai_runs(prd_id) where prd_id is not null;

-- ai_review_findings: result dari A019
create type finding_severity as enum ('high', 'medium', 'low');

create table public.ai_review_findings (
  id uuid primary key default gen_random_uuid(),
  ai_run_id uuid references public.ai_runs(id) on delete cascade not null,
  prd_id uuid references public.prds(id) on delete cascade not null,
  severity finding_severity not null,
  section_key text not null,                  -- "goals" | "fr_04" | "risks" | etc
  title text not null,
  description text not null,
  suggested_fix text,
  fix_applied_at timestamptz,
  fix_applied_by uuid references public.profiles(id) on delete set null,
  dismissed_at timestamptz,
  dismissed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null
);
```

### 4.4 Activity, Notifications, Audit

```sql
-- activity_log: aggregate user-visible events (A028)
create type activity_type as enum (
  'prd_created', 'prd_edited', 'prd_status_changed', 'prd_archived', 'prd_exported',
  'comment_added', 'comment_resolved',
  'review_requested', 'review_approved', 'review_rejected',
  'ai_generation_completed', 'ai_review_completed', 'ai_refinement_applied',
  'member_invited', 'member_joined', 'member_role_changed', 'member_removed',
  'workspace_created', 'workspace_settings_changed',
  'provider_added', 'provider_disconnected',
  'login', 'logout',
  'public_share_created', 'public_share_viewed'
);

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  actor_id uuid references public.profiles(id) on delete set null,
  type activity_type not null,
  resource_type text,                         -- 'prd' | 'comment' | 'member' | 'provider' | 'workspace'
  resource_id uuid,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamptz default now() not null
);

create index idx_activity_workspace_time on public.activity_log(workspace_id, created_at desc);
create index idx_activity_actor on public.activity_log(actor_id) where actor_id is not null;

-- notifications: user-targeted (A030)
create type notification_type as enum (
  'mention', 'review_request', 'approval_needed', 'comment_reply',
  'ai_suggestion_ready', 'integration_event', 'workspace_invite'
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text,
  resource_type text,
  resource_id uuid,
  action_url text,
  read_at timestamptz,
  created_at timestamptz default now() not null
);

create index idx_notifications_recipient_unread on public.notifications(recipient_id) where read_at is null;
```

### 4.5 RLS Policies (Mandatory)

Semua tabel di atas WAJIB ada RLS policy. Pattern dasar:

- **profiles**: user bisa read semua profile di workspace yang dia member, write hanya profile sendiri
- **workspaces**: user bisa read kalau dia member, write/delete hanya admin
- **workspace_members**: read kalau member, write hanya admin
- **prds, prd_sections, prd_versions, comments**: read kalau member workspace, write berdasarkan role (Admin/Editor write, Commenter comment-only, Viewer read-only)
- **prd_shares**: bypass RLS untuk public access via share_token (separate Edge Function untuk validate token)
- **providers**: read/write hanya admin workspace, api_key_encrypted NEVER returned ke client (server-only)
- **ai_runs, activity_log**: read kalau member workspace, write via service role saja (server actions)
- **notifications**: user hanya read/write notification milik dia

Detail policy per-table di-document di `/docs/DATABASE.md`. Phase 1 prompt akan generate semua policy SQL.

---

## 5 — Design System (CSS Variables, dari v2.1 Tweaks)

### 5.1 Token Categories

```css
/* src/styles/tokens.css — referenced by Tailwind config */

:root,
[data-theme='dark'] {
  /* Background system */
  --bg-canvas: #16130f;
  --bg-surface: #1c1814;
  --bg-elevated: #221e18;
  --bg-rail: #110e0b;

  /* Ink (text) */
  --ink-primary: #f2efe8;
  --ink-secondary: #b8b2a6;
  --ink-tertiary: #7a7468;
  --ink-quaternary: #4a4640;

  /* Accent */
  --accent: #e8743c; /* tweaks parameter 4 */
  --accent-deep: #c2562a;

  /* Semantic muted */
  --amber-muted: #c68b3d;
  --sage-muted: #6b8e5a;
  --red-muted: #b85843;

  /* Border */
  --border-subtle: rgba(242, 239, 232, 0.06);
  --border-default: rgba(242, 239, 232, 0.1);
  --border-strong: rgba(242, 239, 232, 0.16);
}

[data-theme='light'] {
  --bg-canvas: #faf7f2;
  --bg-surface: #ffffff;
  --bg-elevated: #ffffff;
  --bg-rail: #f0ebe3;

  --ink-primary: #1a1a1a;
  --ink-secondary: #52525b;
  --ink-tertiary: #71717a;
  --ink-quaternary: #d4d4d8;

  --accent: #e8743c; /* same in both themes */
  --accent-deep: #c2562a;

  --amber-muted: #b8772e;
  --sage-muted: #5c7e4d;
  --red-muted: #a04835;

  --border-subtle: rgba(26, 26, 26, 0.06);
  --border-default: rgba(26, 26, 26, 0.1);
  --border-strong: rgba(26, 26, 26, 0.16);
}

/* Density — Tweaks parameter 3 */
:root,
[data-density='compact'] {
  --row-height: 44px;
  --card-padding: 16px;
  --gap-xs: 4px;
  --gap-sm: 8px;
  --gap-md: 12px;
  --gap-lg: 16px;
  --gap-xl: 24px;
  --font-body-size: 14px;
  --font-helper-size: 12px;
}

[data-density='cozy'] {
  --row-height: 56px;
  --card-padding: 24px;
  --gap-xs: 8px;
  --gap-sm: 12px;
  --gap-md: 16px;
  --gap-lg: 24px;
  --gap-xl: 32px;
  --font-body-size: 15px;
  --font-helper-size: 13px;
}

/* Border radius — Tweaks parameter 5 */
:root,
[data-radius='default'] {
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
}

[data-radius='sharp'] {
  --radius-sm: 2px;
  --radius-md: 4px;
  --radius-lg: 4px;
  --radius-xl: 6px;
}

[data-radius='rounded'] {
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 12px;
  --radius-xl: 16px;
}

/* Font — Tweaks parameter 2 */
:root,
[data-font='fraunces-inter'] {
  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'Inter Tight', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'IBM Plex Mono', 'JetBrains Mono', Menlo, monospace;
}

[data-font='playfair-inter'] {
  --font-display: 'Playfair Display', Georgia, serif;
  --font-body: 'Inter Tight', -apple-system, sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;
}

[data-font='sans-inter'] {
  --font-display: 'Inter Display', 'Inter Tight', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

[data-font='sans-geist'] {
  --font-display: 'Geist', 'Inter', sans-serif;
  --font-body: 'Geist', sans-serif;
  --font-mono: 'Geist Mono', monospace;
}

[data-font='sans-ibmplex'] {
  --font-display: 'IBM Plex Sans', sans-serif;
  --font-body: 'IBM Plex Sans', sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;
}

[data-font='dmserif-dmsans'] {
  --font-display: 'DM Serif Display', Georgia, serif;
  --font-body: 'DM Sans', sans-serif;
  --font-mono: 'DM Mono', 'JetBrains Mono', monospace;
}
```

### 5.2 Tweaks Store (Zustand)

```typescript
// src/stores/tweaks-store.ts
interface TweaksState {
  theme: 'dark' | 'light' | 'mixed';
  font:
    | 'fraunces-inter'
    | 'playfair-inter'
    | 'sans-inter'
    | 'sans-geist'
    | 'sans-ibmplex'
    | 'dmserif-dmsans';
  density: 'compact' | 'cozy';
  accent: 'ember' | 'forest' | 'deep-blue' | 'plum' | 'charcoal';
  radius: 'sharp' | 'default' | 'rounded';
  copilotPosition: 'right' | 'left' | 'bottom';
  panelState: 'expanded' | 'collapsed';
  setTweak: <K extends keyof TweaksState>(key: K, value: TweaksState[K]) => void;
  reset: () => void;
}
// persist ke localStorage. apply via data-* attributes ke <html>
```

### 5.3 Tailwind Config Excerpt

```typescript
// tailwind.config.ts
export default {
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
      },
    },
  },
};
```

### 5.4 10 Design Tenets (REPRINT, MANDATORY enforcement)

Ini sama dengan v2.1 — Claude Code WAJIB enforce di semua component yang dibuat. Detail di `/docs/DESIGN_SYSTEM.md`.

1. **Dark mode default** (kecuali Login + Public Share light, atau user toggle Tweaks)
2. **Accent budget max 5% pixel ember** — only 4 tempat (CTA, dot, sigil, tab underline)
3. **Status pill format baku** — dot + label, transparent bg, 1px border, 4-10px padding, 4px radius
4. **Ikonografi monochrome** — Lucide line glyph 1.5px stroke, NO emoji UI icon
5. **No emoji UI icon** — emoji hanya di user comment text content
6. **VSCode collapsible panels** untuk editor — chevron handle, icon rail 44px collapsed
7. **Density compact default** — row 44px, padding 16-20px, body 13-14px
8. **Typography discipline** — max 1 display serif per artboard product, mono untuk metadata
9. **Editorial polish** — sigil top-left, brand top-right, page number bottom-right (HANYA untuk export PDF, NOT in app UI)
10. **Forbidden patterns** — no saturated bg, no centered modal loading, no playful illustration, no gradient bright, no shadow heavy

---

## 6 — PRD JSON Schema (14 Sections)

```typescript
// src/lib/prd/schema.ts
export interface PRDDocument {
  version: 1;
  metadata: {
    title: string;
    project_tag?: string;
    owner_id: string;
    stakeholders: string[]; // user_ids
    start_date?: string; // ISO
    end_date?: string;
    template_id?: string;
    locale: 'en' | 'id' | 'mixed';
  };
  sections: {
    overview: PRDRichText;
    problem_statement: PRDRichText;
    objectives: PRDObjective[]; // structured
    darci: PRDDarciMatrix; // {decider, accountable, responsible[], consulted[], informed[]}
    scope: { in_scope: string[]; out_of_scope: string[] };
    user_stories: PRDUserStory[]; // {id, role, want, benefit, acceptance_criteria[]}
    functional_reqs: PRDRequirement[]; // {id, priority, title, description, dependencies[]}
    nfr: PRDNFR; // {performance, security, accessibility, scalability, ...}
    success_metrics: PRDMetric[]; // {name, baseline, target, measurement_window}
    timeline: PRDMilestone[];
    risks: PRDRisk[]; // {description, likelihood, impact, mitigation, owner}
    references: PRDReference[]; // {type, url, title, description}
    glossary: { term: string; definition: string }[];
    changelog: { version: number; date: string; author: string; summary: string }[];
  };
}

interface PRDRichText {
  content: TiptapContent; // Tiptap JSON
  word_count: number;
  ai_generated: boolean;
  last_edited_by?: string;
  last_edited_at?: string;
}
```

Detail field per section di-document di `/docs/PRD_SCHEMA.md`. Phase 3 prompt akan generate parser + validator + Tiptap converter.

---

## 7 — API Routes Inventory

| Method       | Path                          | Purpose                                     | Auth                  |
| ------------ | ----------------------------- | ------------------------------------------- | --------------------- |
| POST         | `/api/prd/generate`           | Generate full PRD from brief (streaming)    | session               |
| POST         | `/api/prd/refine`             | Refine specific section                     | session               |
| POST         | `/api/prd/regenerate`         | Regenerate entire PRD (creates new version) | session               |
| POST         | `/api/prd/ai-review`          | Run AI review, return findings              | session               |
| POST         | `/api/prd/ai-suggest`         | Inline suggestion based on selection        | session               |
| POST         | `/api/prd/[prdId]/export`     | Export to PDF/DOCX/MD/HTML/Slack/Jira       | session               |
| GET          | `/api/prd/[prdId]/versions`   | List versions                               | session               |
| POST         | `/api/prd/[prdId]/versions`   | Create version snapshot                     | session               |
| POST         | `/api/prd/[prdId]/share`      | Create public share link                    | session, admin/editor |
| POST         | `/api/workspace/members`      | List/invite members                         | session               |
| POST         | `/api/workspace/invite`       | Send invitation email                       | session, admin        |
| GET/POST     | `/api/providers`              | List/add providers                          | session, admin        |
| POST         | `/api/providers/test`         | Validate API key                            | session               |
| PATCH/DELETE | `/api/providers/[providerId]` | Update/remove provider                      | session, admin        |
| POST         | `/api/webhooks/supabase`      | Auth events (signup → create profile)       | service role          |

CRUD untuk PRDs, comments, notifications via **Server Actions** (Next.js 15 RSC pattern), bukan REST API. Server Actions di `src/app/(app)/.../actions.ts` colocated dengan page yang menggunakannya.

---

## 8 — Deployment: Triple Support

### 8.1 Local Development

```bash
# .nvmrc → 20.11.0
# pnpm install
# pnpm db:start          # Supabase local via supabase-cli
# pnpm db:migrate
# pnpm db:seed
# pnpm dev               # next dev di port 3000
```

`.env.local` example:

```
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase status>
SUPABASE_SERVICE_ROLE_KEY=<from supabase status>
DATABASE_URL=postgres://postgres:postgres@localhost:54322/postgres
NEXT_PUBLIC_APP_URL=http://localhost:3000
ENCRYPTION_KEY=<32-char base64 untuk encrypt provider api keys>
```

### 8.2 Vercel

```json
// vercel.json
{
  "buildCommand": "pnpm build",
  "framework": "nextjs",
  "regions": ["sin1"], // Singapore for Indonesia latency
  "functions": {
    "src/app/api/prd/export/route.ts": {
      "maxDuration": 60, // PDF export butuh waktu
      "memory": 1024
    },
    "src/app/api/prd/generate/route.ts": {
      "maxDuration": 300 // streaming AI generation
    }
  }
}
```

Env vars di Vercel dashboard:

- Production: hosted Supabase project URL + keys
- Preview: same as production atau staging Supabase
- Development: ignored

PDF export: gunakan `@sparticuz/chromium` (serverless-friendly Chromium binary) untuk Puppeteer di Vercel functions.

### 8.3 VPS (Docker)

```dockerfile
# Dockerfile
FROM node:20-alpine AS base
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache chromium       # untuk Puppeteer
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

`docker-compose.yml` untuk VPS deployment dengan optional bundled Postgres (kalau user gak mau pakai Supabase cloud):

```yaml
services:
  app:
    build: .
    ports: ['3000:3000']
    env_file: .env.production
    depends_on: [postgres]
  postgres:
    image: postgres:16-alpine
    volumes: ['pg_data:/var/lib/postgresql/data']
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: draftmind
    ports: ['5432:5432']
volumes:
  pg_data:
```

`next.config.mjs`:

```javascript
export default {
  output: 'standalone',                  // untuk Docker minimal image
  images: { remotePatterns: [...] },
  experimental: { serverActions: { bodySizeLimit: '5mb' } },
};
```

### 8.4 Env Validation

```typescript
// src/env.ts
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    ENCRYPTION_KEY: z.string().length(44), // base64 32-byte
    DEPLOYMENT_TARGET: z.enum(['local', 'vercel', 'vps']).default('local'),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  runtimeEnv: {
    /* mapping ... */
  },
});
```

---

## 9 — Code Style & Conventions

1. **TypeScript strict**: `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitReturns: true`
2. **ESLint flat config**: extends `next/core-web-vitals` + `@typescript-eslint/recommended-strict`
3. **Prettier**: 2 spaces, 100 char line, single quote, trailing comma all
4. **Imports**: absolute via `@/*` alias mapped to `src/*`. Ordered: external → `@/lib` → `@/components` → relative
5. **Server-only code**: tag dengan `import 'server-only';` di file yang akses service role / API keys. Never leak ke client bundle
6. **Component pattern**:
   ```typescript
   // ✅ named export, no default (kecuali Next.js page/layout)
   export function StatusPill({ status }: StatusPillProps) {
     // ...
   }
   ```
7. **Error handling**: pakai `Result<T, E>` pattern atau Server Actions return `{ success: true, data }` / `{ success: false, error }`. Throw hanya di unrecoverable cases
8. **Loading & error UI**: setiap route punya `loading.tsx` + `error.tsx`. Gunakan Suspense boundary
9. **Mutation pattern**: Server Action + revalidatePath/revalidateTag untuk cache invalidation, NOT useState
10. **AI streaming**: gunakan `streamText` dari Vercel AI SDK + Server-Sent Events. Client subscribe via `useChat` atau custom hook
11. **Logging**: `console.log` cuma di dev, production pakai structured logger (pino) — Phase 1 setup
12. **No `any`**: kalau butuh, pakai `unknown` + type guard. `any` cuma di test mocks dengan eslint-disable comment
13. **No comments yang nge-narrate kode** — comment hanya untuk WHY, bukan WHAT (Tenet anti-fluff)

---

## 10 — Testing Strategy

- **Unit (Vitest)**: utility functions, AI prompt builders, schema validators, health score calculation
- **Component (Vitest + Testing Library)**: complex stateful components — TiptapEditor, GenerationLoading, AIReviewPage
- **Integration (Vitest + Supabase test client)**: API routes, Server Actions, RLS policies
- **E2E (Playwright)**: 5 critical paths — Login flow, Generate PRD flow, Edit & comment flow, AI Review flow, Export flow
- **Coverage target**: 70%+ untuk `/lib`, 50%+ untuk `/components`, no requirement untuk `/app` pages

CI di GitHub Actions: type-check + lint + unit + integration on PR. E2E on merge to main.

---

## 11 — Performance Budgets

- LCP < 2.5s di home dashboard
- TTI < 3.5s di editor
- AI generation streaming: first token < 2s, full PRD streamed dalam < 30s
- PDF export: < 15s untuk PRD 5,000 words
- Bundle size: main chunk < 300KB gzipped

Strategi:

- RSC by default, client component tag `'use client'` minimal-needed
- Tiptap dimuat lazy via dynamic import (heavy)
- Puppeteer di-isolate ke API route dengan extended maxDuration
- Provider icons code-split (lazy load saat user buka A024)

---

## 12 — Security Checklist (Mandatory)

- [ ] RLS enabled di SEMUA tabel public
- [ ] API keys provider encrypted at rest (AES-256-GCM dengan ENCRYPTION_KEY)
- [ ] Service role key NEVER exposed ke client
- [ ] Public share token: nanoid 16 char, expires_at set, invalidate on PRD delete
- [ ] Rate limiting di AI endpoints (per workspace, per user) — Upstash Redis atau Supabase
- [ ] Input validation Zod di setiap API route + Server Action
- [ ] CORS config strict di API routes
- [ ] CSRF protection via Next.js Server Action default token
- [ ] Content Security Policy headers
- [ ] No secrets in client bundle — verify via `next build` output analysis
- [ ] Audit log immutable (no UPDATE/DELETE on activity_log)

---

## 13 — Definition of Done (per-feature)

Sebuah feature di-anggap "done" kalau memenuhi:

1. ✅ UI sesuai spec artboard 100% (Tenet 1-10 enforced)
2. ✅ Functional — happy path jalan end-to-end di local + Vercel + VPS
3. ✅ Loading state + error state + empty state ada
4. ✅ Responsive di desktop (1280px+) — mobile out-of-scope FYP
5. ✅ Keyboard navigable + ARIA labels
6. ✅ TypeScript no errors, ESLint no warnings
7. ✅ Unit test untuk pure logic, integration test untuk API
8. ✅ Tweaks parameter switching tested (theme, font, accent, density, radius minimum)
9. ✅ RLS policy tested (member-only access enforced)
10. ✅ Documented di `/docs/` kalau public-facing API atau component

---

## 14 — Out-of-Scope FYP (Documented Limitations)

Untuk transparency di laporan FYP:

- **Real-time collaboration**: Yjs setup ada, tapi multi-cursor presence not enabled (single-user editing)
- **Mobile responsive**: desktop-first, mobile cuma read-only graceful degradation
- **Email sending real**: invitation pakai magic link Supabase, transactional email lain di-mock console.log
- **Slack/Jira integration real**: export format generated, tapi push ke Slack/Jira via webhook out-of-scope (button "Send to Slack" → modal "Copy this and paste" sebagai workaround)
- **Multi-language UI**: hanya English UI, sample content boleh mix Indonesian
- **Payment / billing**: provider credits internal counter aja, gak connect ke Stripe/Midtrans
- **Audit log granular per-field**: cuma event-level activity log, no field-level diff
- **OAuth provider selain Google**: GitHub/Microsoft tetap di UI tapi disabled state

---

## 15 — Build Phase Roadmap

Eksekusi ber-phase dengan prompt terpisah:

**Phase 1 — Foundation** (`01_PHASE1_FOUNDATION.md`): Bootstrap project, Supabase setup + migrations + RLS, base UI components, layout shell, theme provider, Tweaks panel skeleton, env handling 3-target. Output: empty app dengan auth + sidebar working.

**Phase 2 — Auth & Dashboard** (`02_PHASE2_AUTH_DASHBOARD.md`): Login flow, 4-step onboarding, 3 dashboard view (home/list/pipeline), empty state, workspace switcher. A001-A009.

**Phase 3 — Generate & Editor** (`03_PHASE3_GENERATE_EDITOR.md`): Generate form + inline loading, Tiptap editor + slash menu + AI suggestions, collapsible panels, comments, refine modals, AI Review page, version history. A010-A020. **Phase paling kompleks**.

**Phase 4 — Remaining Features** (`04_PHASE4_REMAINING.md`): Templates, Workspace members, Settings/Providers + Add wizard, Export multi-format, Activity log, AI Run history, Notifications, Command palette. A021-A031.

Setiap phase prompt akan:

- Reference master brief ini untuk semua decision yang sudah dibuat
- Define explicit task list untuk Claude Code (numbered, checkable)
- Specify "Definition of Done" per task
- Include test scenarios yang harus pass sebelum lanjut

---

## 16 — Acceptance Criteria untuk Master Brief Ini

Sebelum lanjut ke Phase 1 prompt, user harus konfirmasi:

- [ ] Tech stack di Section 2 sesuai dengan yang user mau
- [ ] Folder structure di Section 3 OK (boleh adjust nama folder, tapi struktur logic harus sama)
- [ ] Database schema di Section 4 cover semua use case 31 artboard
- [ ] Design tokens di Section 5 match dengan v2.1 design spec
- [ ] Deployment config di Section 8 cover triple-target (Vercel + VPS + local)
- [ ] Out-of-scope di Section 14 acceptable untuk FYP submission

Kalau ada item yang user mau revisi, update master brief DULU sebelum eksekusi phase prompt manapun.

---

**END OF MASTER BRIEF v1.0**

Generated: 2026-04-27
Project: DraftMind (FYP — Algo Network)
For: Claude Code build phase
Reference: design system locked at draftmind_imagine_prompt_v2.1.md / v2.2.md
