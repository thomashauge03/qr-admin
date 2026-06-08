#!/bin/bash
# Deploy til Vercel + sync Android
set -e

echo "🔨 Bygger..."
npm run build

echo "📱 Synker Android..."
npx cap sync android

echo "🚀 Deployer til Vercel..."
npx vercel deploy --prod 2>&1 | tee /tmp/vercel-deploy.log

# Hent deployment URL og alias til produksjon
DEPLOY_URL=$(grep -o 'https://qr-admin-[^ ]*\.vercel\.app' /tmp/vercel-deploy.log | head -1)
if [ -n "$DEPLOY_URL" ]; then
  echo "🔗 Aliaser $DEPLOY_URL → qr-admin-fawn.vercel.app"
  npx vercel alias "$DEPLOY_URL" qr-admin-fawn.vercel.app
fi

echo "✅ Deploy ferdig! https://qr-admin-fawn.vercel.app"
