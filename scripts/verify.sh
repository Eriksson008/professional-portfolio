#!/usr/bin/env bash
# verify.sh - repo-real verification for Professional Portfolio (parity with verify.ps1).
# Runs ONLY commands defined in package.json. It does NOT install dependencies, deploy (GitHub Pages /
# Cloudflare), or start a dev server. Exit: 0 = passed, 1 = a required check failed, 2 = env not ready.
#
# Usage:  bash scripts/verify.sh           # lint + test + build
#         bash scripts/verify.sh --quick   # lint + test only (skips the heavier tsc+vite build)

set -uo pipefail
cd "$(dirname "$0")/.."

if [ ! -d node_modules ]; then
  echo "node_modules missing - run 'npm install' first (this script never installs)."
  exit 2
fi

failed=()
check() { # check <name> <npm-args...>
  local name="$1"; shift
  echo; echo "=== $name ==="; echo "> npm $*"
  if npm "$@"; then echo "OK: $name"; else echo "REQUIRED check '$name' FAILED."; failed+=("$name"); fi
}

check lint run lint
check test test

if [ "${1:-}" != "--quick" ]; then
  check build run build   # tsc -b && vite build (also typechecks)
else
  echo; echo "=== build === SKIPPED (--quick)"
fi

echo
echo "Note: the Ask Fredrik Worker (cloudflare/ask-fredrik-worker) has its own checks - run 'npm run check' and 'npm test' there when it changes."

if [ ${#failed[@]} -gt 0 ]; then echo; echo "FAILED required checks: ${failed[*]}"; exit 1; fi
echo; echo "All required checks passed."; exit 0
