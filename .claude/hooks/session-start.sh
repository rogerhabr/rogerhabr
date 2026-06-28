#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# --- Inject env vars from .env.local into the session environment ---
ENV_LOCAL="$CLAUDE_PROJECT_DIR/.env.local"
if [ -f "$ENV_LOCAL" ] && [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    # Skip blank lines and comments
    [[ -z "$line" || "$line" == \#* ]] && continue
    # Only export lines that look like KEY=VALUE and whose key isn't already set
    key="${line%%=*}"
    if [ -n "$key" ] && [ -z "${!key:-}" ]; then
      echo "$line" >> "$CLAUDE_ENV_FILE"
      echo "  Injected $key from .env.local"
    fi
  done < "$ENV_LOCAL"
fi

# --- Install npm dependencies ---
echo "Installing npm dependencies..."
npm install
echo "Dependencies installed."
