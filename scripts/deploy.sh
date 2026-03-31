#!/bin/bash
set -e

source ~/.profile || true
source ~/.bashrc || true
export PATH="/root/.bun/bin:$PATH"

echo "✅ Environment loaded."

echo "👉 Pulling latest code..."
git pull origin main

bun install


echo "⚙️ Restarting server..."
pm2 restart pantha-server || pm2 start ecosystem.config.cjs --only pantha-server

echo "🖼️ Building and restarting web server..."
cd packages/web
bun run build
cd ../..
pm2 restart pantha-web || pm2 start ecosystem.config.cjs --only pantha-web

echo "✅ Deploy complete!"
