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

| Service                  | URL                                                   |
| ------------------------ | ----------------------------------------------------- |
| Application              | http://localhost:3000                                 |
| Supabase Studio          | http://127.0.0.1:54323                                |
| Inbucket (email testing) | http://127.0.0.1:54324                                |
| Supabase API             | http://localhost:54321                                |
| Supabase DB (Postgres)   | postgres://postgres:postgres@localhost:54322/postgres |

### `.env.local` Example

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase status>
SUPABASE_SERVICE_ROLE_KEY=<from supabase status>
DATABASE_URL=postgres://postgres:postgres@localhost:54322/postgres
NEXT_PUBLIC_APP_URL=http://localhost:3000
ENCRYPTION_KEY=<32-byte base64 string for AES-256-GCM encryption>
DEPLOYMENT_TARGET=local
```

Run `supabase status` after `supabase start` to retrieve the anon key and service role key.

### Useful Commands

```bash
pnpm dev              # Start Next.js dev server
pnpm build            # Production build
pnpm lint             # ESLint check
pnpm type-check       # TypeScript check
pnpm test             # Run Vitest unit/integration tests
pnpm test:e2e         # Run Playwright E2E tests
supabase start        # Start local Supabase
supabase stop         # Stop local Supabase
supabase db reset     # Reset DB, run migrations + seed
supabase db push      # Push migrations to remote Supabase
```

---

## Vercel

### Setup

1. **Connect GitHub repository** to Vercel.
2. **Set environment variables** in the Vercel dashboard:

| Variable                        | Value                                                     |
| ------------------------------- | --------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL                                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key                                  |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service role key                                 |
| `DATABASE_URL`                  | Supabase Postgres connection string (pooler)              |
| `NEXT_PUBLIC_APP_URL`           | Your Vercel domain (e.g., `https://draftmind.vercel.app`) |
| `ENCRYPTION_KEY`                | 32-byte base64 string                                     |
| `DEPLOYMENT_TARGET`             | `vercel`                                                  |

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

This applies all migrations in `supabase/migrations/` (including `0004_immutable_audit_log.sql`).

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
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache chromium
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

Requires `output: 'standalone'` in `next.config.mjs`.

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

# Apply migrations using psql (inside container)
for f in /app/supabase/migrations/*.sql; do
  psql "$DATABASE_URL" -f "$f"
done
```

Alternatively, seed the database on first run:

```bash
docker compose exec -T postgres psql -U postgres -d draftmind < supabase/migrations/0001_init_schema.sql
docker compose exec -T postgres psql -U postgres -d draftmind < supabase/migrations/0002_rls_policies.sql
docker compose exec -T postgres psql -U postgres -d draftmind < supabase/migrations/0003_seed_templates.sql
docker compose exec -T postgres psql -U postgres -d draftmind < supabase/migrations/0004_immutable_audit_log.sql
```

---

## Environment Validation

All environment variables are validated at build time using `@t3-oss/env-nextjs` in `src/env.ts`:

| Variable                        | Type           | Required | Notes                                                  |
| ------------------------------- | -------------- | -------- | ------------------------------------------------------ |
| `DATABASE_URL`                  | URL string     | Yes      | Postgres connection string                             |
| `SUPABASE_SERVICE_ROLE_KEY`     | string         | Yes      | Server-only, never exposed to client                   |
| `ENCRYPTION_KEY`                | 44-char base64 | Yes      | 32-byte key for AES-256-GCM                            |
| `DEPLOYMENT_TARGET`             | enum           | No       | Defaults to `local`. Options: `local`, `vercel`, `vps` |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL string     | Yes      | Supabase project URL                                   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | string         | Yes      | Supabase anonymous/public key                          |
| `NEXT_PUBLIC_APP_URL`           | URL string     | Yes      | Application base URL                                   |
