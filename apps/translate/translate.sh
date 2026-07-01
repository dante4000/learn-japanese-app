#!/usr/bin/env bash
# `translate` — start the translator on demand, open it at http://translate, and
# stop it the moment you close this window (or hit Ctrl-C). Nothing runs when
# you're not using it.
#
# Binding the clean port 80 needs root, so this re-launches itself with sudo
# (you'll be asked for your password once per start). The translator itself runs
# `claude` as you, not root.
set -euo pipefail

DIR="/Users/danielko/dev/sites/apps/translate"

# Re-exec under sudo if not already root (needed only to bind port 80). Use a GUI
# askpass helper so it works with or without a terminal.
if [ "$(id -u)" != "0" ]; then
  echo "Starting translate…"
  export SUDO_ASKPASS="$DIR/askpass.sh"
  exec sudo -A "$DIR/translate.sh" "$@"
fi

# One-time: make the name `translate` resolve to this machine.
if ! grep -qE '^127\.0\.0\.1[[:space:]]+translate([[:space:]]|$)' /etc/hosts; then
  echo "127.0.0.1 translate" >> /etc/hosts
  dscacheutil -flushcache 2>/dev/null || true
  killall -HUP mDNSResponder 2>/dev/null || true
fi

# Ensure a production build exists (built as the user, never root).
[ -d "$DIR/.next" ] || sudo -u danielko npm --prefix "$DIR" run build

# Run `claude` as the real user so it uses your login (see lib/translate.ts).
export TRANSLATE_UID=501 TRANSLATE_GID=20 TRANSLATE_HOME=/Users/danielko TRANSLATE_USER=danielko
export PATH="/Users/danielko/.local/bin:/opt/homebrew/bin:$PATH"
export NODE_ENV=production

cd "$DIR"
node node_modules/next/dist/bin/next start -p 80 -H 127.0.0.1 &
SERVER=$!

# Stop the server on any exit: Ctrl-C (INT), window close (HUP), kill (TERM).
cleanup() { kill "$SERVER" 2>/dev/null || true; }
trap cleanup EXIT INT TERM HUP

# Once it's up, open it in your default browser.
(
  for _ in $(seq 1 30); do
    curl -sf http://127.0.0.1/ >/dev/null 2>&1 && break
    sleep 0.3
  done
  sudo -u danielko open http://translate
) &

echo "✓ translate is live at http://translate  —  close this window or press Ctrl-C to stop."
wait "$SERVER"
