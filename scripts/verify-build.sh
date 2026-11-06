#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"

cleanup() {
  rm -rf "$TMP"
}
trap cleanup EXIT

rsync -a \
  --exclude node_modules \
  --exclude .next \
  --exclude .git \
  --exclude '.env*' \
  --exclude .npm-cache \
  --exclude .dsh-pilot \
  "$ROOT/" "$TMP/"

cp -a "$ROOT/node_modules" "$TMP/node_modules"

cd "$TMP"

NEXT_TELEMETRY_DISABLED=1 \
NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co" \
NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder" \
NEXT_PUBLIC_SITE_URL="http://localhost:3000" \
SUPABASE_SERVICE_ROLE_KEY="placeholder" \
CLIENT_SESSION_SECRET="placeholder-secret-placeholder-secret" \
CRON_SECRET="placeholder" \
npm run build
