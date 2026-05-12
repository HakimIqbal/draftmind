# Contributing

## Prerequisites

- Node.js >= 20.11.0, < 22 (see `.nvmrc`)
- pnpm 9.x
- Supabase CLI
- Docker (for local Supabase)

## Setup

```bash
# 1. Clone and install
git clone https://github.com/your-org/draftmind.git
cd draftmind
nvm use
pnpm install

# 2. Start local Supabase
pnpm db:start

# 3. Configure environment
cp .env.example .env.local
# Fill in values from `supabase status`

# 4. Run migrations and seed
pnpm db:reset

# 5. Start dev server
pnpm dev
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed environment variable documentation.

## Available Scripts

| Script            | Command                         | Description                            |
| ----------------- | ------------------------------- | -------------------------------------- |
| `pnpm dev`        | `next dev`                      | Start Next.js dev server               |
| `pnpm build`      | `next build`                    | Production build                       |
| `pnpm start`      | `next start`                    | Start production server                |
| `pnpm typecheck`  | `tsc --noEmit`                  | TypeScript type check                  |
| `pnpm lint`       | `next lint`                     | ESLint check                           |
| `pnpm format`     | `prettier --write .`            | Format all files with Prettier         |
| `pnpm test`       | `vitest`                        | Run unit/integration tests             |
| `pnpm test:e2e`   | `playwright test`               | Run end-to-end tests                   |
| `pnpm db:start`   | `supabase start`                | Start local Supabase                   |
| `pnpm db:stop`    | `supabase stop`                 | Stop local Supabase                    |
| `pnpm db:reset`   | `supabase db reset`             | Reset DB + run all migrations + seed   |
| `pnpm db:migrate` | `supabase migration up`         | Apply pending migrations               |
| `pnpm db:seed`    | `tsx scripts/seed.ts`           | Seed database with sample data         |
| `pnpm db:types`   | `tsx scripts/generate-types.ts` | Generate TS types from DB schema       |
| `pnpm prepare`    | `husky`                         | Install git hooks (runs automatically) |

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/).

```
<type>(<scope>): <description>

[optional body]
```

### Types

| Type       | Description                                             |
| ---------- | ------------------------------------------------------- |
| `feat`     | New feature                                             |
| `fix`      | Bug fix                                                 |
| `docs`     | Documentation only                                      |
| `style`    | Formatting, missing semicolons, etc.                    |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test`     | Adding or updating tests                                |
| `chore`    | Build process, tooling, dependencies                    |

### Scopes

`auth`, `dashboard`, `editor`, `generate`, `export`, `db`, `ui`, `ai`, `deploy`, `docs`, `admin`, `workspace`

### Examples

```
feat(editor): add slash menu with AI suggestion options
fix(auth): handle expired magic link redirect
chore(db): add migration for prd_templates index
docs(api): document AI review endpoint
test(ui): add pill component status color tests
feat(admin): add system logs page
```

## Branch Strategy

- `main` — production-ready code
- Feature branches from `main` (e.g., `feat/ai-copilot`, `fix/export-pdf`)

## Pre-commit Hook

Husky runs automatically on every commit:

1. **`pnpm typecheck`** — TypeScript validation (full project)
2. **`lint-staged`** — Runs on staged files only:
   - `*.{ts,tsx}` — `prettier --write` + `eslint --fix`
   - `*.{json,md,css}` — `prettier --write`

## Code Style

- **ESLint**: Next.js recommended rules + `@typescript-eslint` strict mode
- **Prettier**: Single quotes, trailing commas, 100 char print width (see `.prettierrc`)
- **TypeScript**: Strict mode enabled, no unused variables/args

## Architecture Reference

See [ARCHITECTURE.md](ARCHITECTURE.md) for folder structure, layers, and patterns.
