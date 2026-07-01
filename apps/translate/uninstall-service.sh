#!/usr/bin/env bash
# Remove the always-on "translate" service. Run with:  sudo ./uninstall-service.sh
set -euo pipefail

if [ "$(id -u)" != "0" ]; then
  echo "Please run with sudo:  sudo ./uninstall-service.sh" >&2
  exit 1
fi

launchctl bootout system/com.dante.translate 2>/dev/null || true
rm -f /Library/LaunchDaemons/com.dante.translate.plist

# Remove the hosts entry.
if grep -qE '^127\.0\.0\.1[[:space:]]+translate([[:space:]]|$)' /etc/hosts; then
  # macOS sed needs the -i backup arg; write to a temp then move.
  grep -vE '^127\.0\.0\.1[[:space:]]+translate([[:space:]]|$)' /etc/hosts > /tmp/hosts.tmp
  cat /tmp/hosts.tmp > /etc/hosts
  rm -f /tmp/hosts.tmp
  echo "→ removed 'translate' from /etc/hosts"
fi
dscacheutil -flushcache 2>/dev/null || true
killall -HUP mDNSResponder 2>/dev/null || true

echo "✓ Uninstalled. http://translate will stop resolving."
