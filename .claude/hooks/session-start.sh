#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# --- Auto-inject GITHUB_TOKEN ---
if [ -n "${CLAUDE_ENV_FILE:-}" ] && [ -z "${GITHUB_TOKEN:-}" ]; then
  # Try gh CLI first (works when the user is authenticated locally or via GITHUB_TOKEN)
  if command -v gh &>/dev/null; then
    _gh_token="$(gh auth token 2>/dev/null || true)"
    if [ -n "$_gh_token" ]; then
      echo "GITHUB_TOKEN=${_gh_token}" >> "$CLAUDE_ENV_FILE"
      export GITHUB_TOKEN="$_gh_token"
      echo "  GITHUB_TOKEN injected via gh CLI"
    fi
  fi
fi

# --- Inject any remaining vars from .env.local ---
ENV_LOCAL="$CLAUDE_PROJECT_DIR/.env.local"
if [ -f "$ENV_LOCAL" ] && [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    [[ -z "$line" || "$line" == \#* ]] && continue
    key="${line%%=*}"
    if [ -n "$key" ] && [ -z "${!key:-}" ]; then
      echo "$line" >> "$CLAUDE_ENV_FILE"
      export "${key}"="${line#*=}"
      echo "  Injected $key from .env.local"
    fi
  done < "$ENV_LOCAL"
fi

# --- Install npm dependencies ---
echo "Installing npm dependencies..."
npm install
echo "Dependencies installed."
