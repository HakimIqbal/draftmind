# DraftMind Deploy Checklist

## Build

1. `cd /home/ubuntu/draftmind`
2. `pnpm install --frozen-lockfile`
3. `pnpm build`

## Standalone runtime assets

4. `rm -rf .next/standalone/public .next/standalone/.next/static`
5. `cp -a public .next/standalone/public`
6. `mkdir -p .next/standalone/.next`
7. `cp -a .next/static .next/standalone/.next/static`
8. `cp .env.production .next/standalone/.env.production`

## Restart

9. `pm2 restart draftmind`
10. `pm2 save`

## Health checks

11. `curl -I http://127.0.0.1:3000/login`
12. `curl -I https://draftmind.web.id/login`
13. Verify landing page CSS/assets and admin sidebar profile menu.

## Post-deploy notes

- Hard refresh old browser tabs after deploy to avoid stale Next.js Server Action errors.
- If landing page looks unstyled, public/static assets were not copied into `.next/standalone`.
- If health check returns 502 right after PM2 restart, wait a few seconds and retry before assuming failure.
