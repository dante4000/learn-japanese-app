#!/usr/bin/env bash
# Serve the Translate app locally at http://translate (port 80).
# Run with: sudo ./serve-local.sh
# Requires a one-time hosts entry:  echo "127.0.0.1 translate" | sudo tee -a /etc/hosts
set -euo pipefail

cd "$(dirname "$0")"

# Run npm as the logged-in user even under sudo, so it uses the right toolchain
# and doesn't create root-owned files. Only binding port 80 needs root.
RUN_USER="${SUDO_USER:-$(whoami)}"
run_as() { if [ "$(whoami)" = "root" ] && [ "$RUN_USER" != "root" ]; then sudo -u "$RUN_USER" "$@"; else "$@"; fi; }

[ -d node_modules ] || run_as npm install
[ -d .next ] || run_as npm run build

echo "→ http://translate  (Ctrl-C to stop)"
exec npx next start -p 80
