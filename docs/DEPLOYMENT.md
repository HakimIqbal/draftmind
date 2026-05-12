# Deployment Guide

DraftMind supports three deployment targets from the same codebase: local development, Vercel (serverless), and VPS (Docker).

---

## Local Development

### Prerequisites

- Node.js >= 20.11.0, < 22 (use `.nvmrc`)
- pnpm 9.x
- Supabase CLI
- Docker (for Supabase local)

### Setup

```bash
# 1. Pin Node version
nvm use           # or: volta pin node@20.11.0

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with your values (see below)

# 4. Start Supabase local
supabase start

# 5. Run migrations and seed data
supabase db reset

# 6. Start dev server
pnpm dev
```

### Local URLs

| Service                  | URL                                                     |
| ------------------------ | ------------------------------------------------------- |
| Application              | http://localhost:3000                                   |
| Supabase Studio          | http://127.0.0.1:54323                                  |
| Inbucket (email testing) | http://127.0.0.1:54324                                  |
| Supabase API             | http://127.0.0.1:54321                                  |
| Supabase DB (Postgres)   | postgresql://postgres:postgres@127.0.0.1:54322/postgres |

### `.env.local` Example

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase status>
SUPABASE_SERVICE_ROLE_KEY=<from supabase status>
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
NEXT_PUBLIC_APP_URL=http://localhost:3000
ENCRYPTION_KEY=<32-byte base64 string for AES-256-GCM encryption>
DEPLOYMENT_TARGET=local
SKIP_ENV_VALIDATION=false
```

Run `supabase status` after `supabase start` to retrieve the anon key and service role key.

### Useful Commands

```bash
# Dev
pnpm dev              # Start Next.js dev server
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # ESLint check
pnpm typecheck        # TypeScript check
pnpm format           # Prettier format all files

# Test
pnpm test             # Run Vitest unit/integration tests
pnpm test:e2e         # Run Playwright E2E tests

# Database
pnpm db:start         # Start local Supabase (alias: supabase start)
pnpm db:stop          # Stop local Supabase
pnpm db:reset         # Reset DB, run all migrations + seed
pnpm db:migrate       # Apply pending migrations
pnpm db:seed          # Seed database with sample data
pnpm db:types         # Generate TypeScript types from DB schema
```

---

## Vercel

### Setup

1. **Connect GitHub repository** to Vercel.
2. **Set environment variables** in the Vercel dashboard:

| Variable                        | Required | Value                                                      |
| ------------------------------- | -------- | ---------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Yes      | Your Supabase project URL                                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes      | Supabase anon/public key                                   |
| `SUPABASE_SERVICE_ROLE_KEY`     | Yes      | Supabase service role key                                  |
| `DATABASE_URL`                  | Yes      | Supabase Postgres connection string (pooler)               |
| `NEXT_PUBLIC_APP_URL`           | Yes      | Your Vercel domain (e.g., `https://draftmind.vercel.app`)  |
| `ENCRYPTION_KEY`                | Yes      | 32-byte base64 string                                      |
| `DEPLOYMENT_TARGET`             | No       | `vercel`                                                   |
| `RESEND_API_KEY`                | No       | Resend API key for transactional emails                    |
| `EMAIL_FROM`                    | No       | Sender address (e.g., `DraftMind <noreply@draftmind.app>`) |
| `LANGCHAIN_API_KEY`             | No       | LangSmith API key for AI observability                     |
| `LANGCHAIN_PROJECT`             | No       | LangSmith project name (e.g., `draftmind`)                 |
| `LANGCHAIN_TRACING_V2`          | No       | Set to `true` to enable tracing                            |

3. **Region**: Set to `sin1` (Singapore) for optimal latency to Indonesia.

### `vercel.json` Configuration

```json
{
  "buildCommand": "pnpm build",
  "framework": "nextjs",
  "regions": ["sin1"],
  "functions": {
    "src/app/api/prd/export/route.ts": {
      "maxDuration": 60,
      "memory": 1024
    },
    "src/app/api/prd/generate/route.ts": {
      "maxDuration": 300
    }
  }
}
```

### OAuth Redirect URLs

In your Supabase project dashboard under **Authentication > URL Configuration**, add:

- **Site URL**: `https://draftmind.vercel.app` (or your custom domain)
- **Redirect URLs**:
  - `https://draftmind.vercel.app/auth/callback`
  - `https://*.vercel.app/auth/callback` (for preview deployments)

### Running Migrations

After initial deployment, apply database migrations to your Supabase project:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

This applies all 17 migration files in `supabase/migrations/`.

### Notes

- PDF export uses `@sparticuz/chromium` (serverless-friendly Chromium binary) with `puppeteer-core` for Vercel functions.
- AI generation endpoints have a 300-second timeout to allow for full PRD streaming.
- Preview deployments can use the same Supabase project or a separate staging project.

---

## VPS (Docker)

### Requirements

- Ubuntu 22.04+ (or any Linux with Docker)
- 4 GB RAM minimum
- Docker and Docker Compose installed
- A domain name (for SSL)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-org/draftmind.git
cd draftmind

# 2. Build the Docker image
docker build -t draftmind .

# 3. Create production environment file
cp .env.example .env.production
# Edit .env.production with production values
```

### `.env.production` Example

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase anon key>
SUPABASE_SERVICE_ROLE_KEY=<supabase service role key>
DATABASE_URL=postgres://<user>:<password>@<host>:5432/draftmind
NEXT_PUBLIC_APP_URL=https://draftmind.yourdomain.com
ENCRYPTION_KEY=<32-byte base64 string>
DEPLOYMENT_TARGET=vps
DB_PASSWORD=<postgres password for local DB>

# Optional — email
RESEND_API_KEY=<resend api key>
EMAIL_FROM=DraftMind <noreply@yourdomain.com>

# Optional — AI observability
LANGCHAIN_API_KEY=<langsmith api key>
LANGCHAIN_PROJECT=draftmind
LANGCHAIN_TRACING_V2=true
```

### Docker Compose

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f app

# Stop
docker compose down
```

The `docker-compose.yml` includes an optional bundled Postgres service if you do not want to use Supabase Cloud:

```yaml
services:
  app:
    build: .
    ports: ['3000:3000']
    env_file: .env.production
    environment:
      - DEPLOYMENT_TARGET=vps
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    volumes: ['pg_data:/var/lib/postgresql/data']
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD:-draftmind_secret}
      POSTGRES_DB: draftmind
    ports: ['5432:5432']
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  pg_data:
```

### Dockerfile

The Dockerfile uses a multi-stage build for a minimal production image:

```dockerfile
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
ENV NEXT_TELEMETRY_DISABLED=1
# Skip env validation during build — runtime env vars injected at deploy
ENV SKIP_ENV_VALIDATION=true
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
```

Key points:

- `SKIP_ENV_VALIDATION=true` during build prevents failure when runtime env vars are not yet available.
- `PUPPETEER_EXECUTABLE_PATH` points to Alpine's Chromium for PDF export.
- `NEXT_TELEMETRY_DISABLED=1` disables Next.js telemetry.
- Runs as non-root user `nextjs` for security.
- Requires `output: 'standalone'` in `next.config.mjs`.

### Nginx Reverse Proxy + SSL

Set up Nginx as a reverse proxy with Let's Encrypt for SSL:

```nginx
server {
    listen 80;
    server_name draftmind.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name draftmind.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/draftmind.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/draftmind.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Install SSL certificate:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d draftmind.yourdomain.com
```

### Running Migrations on VPS

If using Supabase Cloud, link and push migrations as described in the Vercel section. If using the bundled Postgres, run migrations manually:

```bash
# Enter the app container
docker compose exec app sh

# Apply all 17 migrations using psql (inside container)
for f in /app/supabase/migrations/*.sql; do
  psql "$DATABASE_URL" -f "$f"
done
```

---

## Environment Validation

All environment variables are validated at build time using `@t3-oss/env-nextjs` in `src/env.ts`. Set `SKIP_ENV_VALIDATION=true` to skip validation during Docker builds.

### Required Variables

| Variable                        | Type       | Notes                                |
| ------------------------------- | ---------- | ------------------------------------ |
| `DATABASE_URL`                  | URL string | Postgres connection string           |
| `SUPABASE_SERVICE_ROLE_KEY`     | string     | Server-only, never exposed to client |
| `ENCRYPTION_KEY`                | string     | 32-byte base64 key for AES-256-GCM   |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL string | Supabase project URL                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | string     | Supabase anonymous/public key        |
| `NEXT_PUBLIC_APP_URL`           | URL string | Application base URL                 |

### Optional Variables

| Variable               | Type   | Default | Notes                                    |
| ---------------------- | ------ | ------- | ---------------------------------------- |
| `DEPLOYMENT_TARGET`    | enum   | `local` | Options: `local`, `vercel`, `vps`        |
| `SKIP_ENV_VALIDATION`  | bool   | `false` | Skip env validation (Docker builds only) |
| `RESEND_API_KEY`       | string | —       | Resend API key for transactional emails  |
| `EMAIL_FROM`           | string | —       | Sender address for emails                |
| `LANGCHAIN_API_KEY`    | string | —       | LangSmith API key for AI observability   |
| `LANGCHAIN_PROJECT`    | string | —       | LangSmith project name                   |
| `LANGCHAIN_TRACING_V2` | bool   | —       | Enable LangSmith tracing                 |

### Docker/VPS Only

| Variable                    | Type   | Notes                                                          |
| --------------------------- | ------ | -------------------------------------------------------------- |
| `DB_PASSWORD`               | string | Postgres password for bundled DB container                     |
| `PUPPETEER_EXECUTABLE_PATH` | path   | Set automatically in Dockerfile to `/usr/bin/chromium-browser` |
| `PORT`                      | number | Set automatically in Dockerfile to `3000`                      |
| `HOSTNAME`                  | string | Set automatically in Dockerfile to `0.0.0.0`                   |
