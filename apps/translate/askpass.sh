#!/bin/bash
# GUI password helper for sudo (SUDO_ASKPASS), so `translate` can start from any
# context — a terminal, or even Claude's inline shell — via a native popup.
osascript -e 'text returned of (display dialog "Enter your macOS password to start translate (needs port 80):" default answer "" with hidden answer with title "translate")'
