#!/usr/bin/env bash
# `translate`          — on-demand translator at http://translate (Claude Max).
# `translate --local`  — same, but fully offline via a local model (Ollama).
# Stops the moment you close the window/tab or hit Ctrl-C. Nothing runs when idle.
#
# Binding the clean port 80 needs root, so this re-launches itself with sudo.
# The translator's `claude` child runs as you, not root.
set -euo pipefail

DIR="/Users/danielko/dev/sites/apps/translate"
OLLAMA="/opt/homebrew/bin/ollama"
LOCAL_MODEL="${TRANSLATE_LOCAL_MODEL:-qwen2.5:72b}"
# Models live on the LaCie external drive (the internal disk is nearly full).
MODELS_DIR="/Volumes/dante lacie/ollama-models"

# --local → offline mode.
LOCAL=0
for a in "$@"; do [ "$a" = "--local" ] && LOCAL=1; done

# Re-exec under sudo if not already root (needed only to bind port 80). Use a GUI
# askpass helper so it works with or without a terminal.
if [ "$(id -u)" != "0" ]; then
  echo "Starting translate${LOCAL:+ (local)}…"
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

# Clear any previous instance so port 80 is free (we're already root here).
pkill -f "next/dist/bin/next start" 2>/dev/null || true
sleep 1

# Run `claude` as the real user so it uses your login (see lib/translate.ts).
export TRANSLATE_UID=501 TRANSLATE_GID=20 TRANSLATE_HOME=/Users/danielko TRANSLATE_USER=danielko
export PATH="/Users/danielko/.local/bin:/opt/homebrew/bin:$PATH"
export NODE_ENV=production
export TRANSLATE_AUTOEXIT=1   # exit when the browser tab closes

# Offline mode: point the app at Ollama and make sure the server + model are ready
# (Ollama runs as the user, with its model store on the LaCie).
if [ "$LOCAL" = 1 ]; then
  export TRANSLATE_BACKEND=local
  export TRANSLATE_LOCAL_MODEL="$LOCAL_MODEL"

  if [ ! -d "$MODELS_DIR" ]; then
    echo "✗ Local models live on the LaCie drive, which isn't mounted."
    echo "  Plug in 'dante lacie' and run  translate --local  again."
    exit 1
  fi

  # The RUNNING server's env decides where models live, so ask the server for the
  # model; if it can't serve it, (re)start Ollama with the store on the LaCie.
  # This also guarantees a pull can never land on the (nearly full) internal disk.
  if ! sudo -u danielko "$OLLAMA" show "$LOCAL_MODEL" >/dev/null 2>&1; then
    echo "Starting Ollama (models on LaCie)…"
    sudo -u danielko pkill -f "ollama serve" 2>/dev/null || true
    sleep 1
    sudo -u danielko bash -c "OLLAMA_MODELS=\"$MODELS_DIR\" OLLAMA_FLASH_ATTENTION=1 nohup $OLLAMA serve >/tmp/ollama.log 2>&1 & disown"
    sleep 3
    if ! sudo -u danielko "$OLLAMA" show "$LOCAL_MODEL" >/dev/null 2>&1; then
      echo "Pulling local model $LOCAL_MODEL (first run only — large download)…"
      sudo -u danielko "$OLLAMA" pull "$LOCAL_MODEL"
    fi
  fi
  # Warm the model into memory so the first translation isn't slow.
  curl -s "http://127.0.0.1:11434/api/generate" \
    -d "{\"model\":\"$LOCAL_MODEL\",\"prompt\":\"hi\",\"stream\":false,\"keep_alive\":\"30m\"}" \
    >/dev/null 2>&1 &
fi

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
