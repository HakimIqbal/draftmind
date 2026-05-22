#!/bin/bash
set -euo pipefail
cd /home/ubuntu/draftmind

echo "==> Building..."
npx --yes pnpm@9.15.9 build

echo "==> Copying public/ to standalone..."
cp -r public .next/standalone/public

echo "==> Copying .next/static/ to standalone..."
cp -r .next/static .next/standalone/.next/static

echo "==> Copying .env.production to standalone..."
cp .env.production .next/standalone/.env.production

echo "==> Restarting PM2..."
pm2 restart draftmind

echo "==> Waiting for startup..."
sleep 3

echo "==> Health check..."
HTTP_CODE=$(curl -o /dev/null -s -w "%{http_code}" http://127.0.0.1:3000/login)
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Deploy OK (login page: $HTTP_CODE)"
else
  echo "❌ Deploy FAILED (login page: $HTTP_CODE)"
  exit 1
fi

STATIC_CODE=$(curl -o /dev/null -s -w "%{http_code}" http://127.0.0.1:3000/logo/logo.jpg)
echo "   Static assets: $STATIC_CODE"
