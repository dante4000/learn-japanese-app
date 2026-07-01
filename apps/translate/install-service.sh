#!/usr/bin/env bash
# Install "translate" as an always-on background service reachable at
# http://translate (port 80). Run once with:  sudo ./install-service.sh
# Undo any time with:  sudo ./uninstall-service.sh
set -euo pipefail

if [ "$(id -u)" != "0" ]; then
  echo "Please run with sudo:  sudo ./install-service.sh" >&2
  exit 1
fi

DIR="/Users/danielko/dev/sites/apps/translate"
PLIST="/Library/LaunchDaemons/com.dante.translate.plist"

# 1) Ensure a production build exists (as the user, not root).
if [ ! -d "$DIR/.next" ]; then
  echo "→ building…"
  sudo -u danielko npm --prefix "$DIR" run build
fi

# 2) Point the name `translate` at this machine.
if ! grep -qE '^127\.0\.0\.1[[:space:]]+translate([[:space:]]|$)' /etc/hosts; then
  echo "127.0.0.1 translate" >> /etc/hosts
  echo "→ added 'translate' to /etc/hosts"
fi
dscacheutil -flushcache 2>/dev/null || true
killall -HUP mDNSResponder 2>/dev/null || true

# 3) Install and (re)load the LaunchDaemon.
cp "$DIR/com.dante.translate.plist" "$PLIST"
chown root:wheel "$PLIST"
chmod 644 "$PLIST"
launchctl bootout system/com.dante.translate 2>/dev/null || true
launchctl bootstrap system "$PLIST"
launchctl enable system/com.dante.translate

echo
echo "✓ Installed. Give it ~5 seconds, then open http://translate"
echo "  Logs: /tmp/translate.log"
