#!/usr/bin/env bash
set -euo pipefail
repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source_dir="$repo/tools/blackout-tesana"
cp "$repo/firebase-auth.js" "$source_dir/public/firebase-auth.js"
cp "$repo/district-identity.js" "$source_dir/public/district-identity.js"
cd "$source_dir"
npm ci --ignore-scripts --no-audit --no-fund
npx tsc --noEmit
npm run build
for target in "$repo/blackout-protocol" "$repo/static/blackout-protocol"; do
  find "$target/assets" -maxdepth 1 -type f -name 'index-*.js' -delete
  cp -a dist/. "$target/"
done
