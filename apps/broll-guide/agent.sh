#!/usr/bin/env bash
set -euo pipefail

# ── Always resolve to the directory containing this script ──────────────────
# Ensures docker compose finds its config even when called from another dir.
cd "$(dirname "$0")"

# ── Pre-flight checks ──────────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  echo "Error: docker is not installed or not in PATH" >&2; exit 1
fi
if ! docker info &>/dev/null 2>&1; then
  echo "Error: Docker daemon is not running" >&2; exit 1
fi
if ! docker compose config --services 2>/dev/null | grep -q '^claude$'; then
  echo "Error: No 'claude' service in compose file at $(pwd)" >&2; exit 1
fi

# ── Troubleshooting ──────────────────────────────────────────────────────────
# Onboarding prompt appears:    docker compose down -v && docker compose up -d claude
# Token expired:                claude setup-token (on host), update .env, restart
# Binary not found:             docker compose exec claude bash -c 'which claude && echo $PATH'
# Config corruption:            docker compose down -v && docker compose build --no-cache claude && docker compose up -d claude
# API billing instead of Max:   Remove ANTHROPIC_API_KEY from .env, keep only CLAUDE_CODE_OAUTH_TOKEN
# Container exits immediately:  Ensure Dockerfile.claude CMD is ["sleep", "infinity"]
# Effort not max:               --effort max is set via CLI flag; do NOT rely on settings.json or env vars

# ── Start container if not running ────────────────────────────────────────────
# Uses `docker compose` service names exclusively — never guesses container names.
# This is immune to directory names with spaces, capitals, or special characters.
if ! docker compose ps claude --status running --format '{{.Name}}' 2>/dev/null | grep -q .; then
  docker compose up -d claude
  echo "Waiting for claude container to be ready..."
  for i in $(seq 1 30); do
    if docker compose exec -T claude true 2>/dev/null; then
      break
    fi
    if [ "$i" -eq 30 ]; then
      echo "Error: Container failed to become ready after 30s" >&2
      docker compose logs claude
      exit 1
    fi
    sleep 1
  done
  # Bootstrap auth config (ensures files exist even if volume is empty)
  docker compose exec -T claude bash -c '
    mkdir -p ~/.claude
    [ -f ~/.claude/.claude.json ] || echo "{\"hasCompletedOnboarding\":true,\"installMethod\":\"native\"}" > ~/.claude/.claude.json
    [ -L ~/.claude.json ] || ln -sf ~/.claude/.claude.json ~/.claude.json
    [ -f ~/.claude/settings.json ] || echo "{\"permissions\":{\"allow\":[\"*\"],\"deny\":[]},\"env\":{\"CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC\":\"1\"}}" > ~/.claude/settings.json
  '
fi

# ── Launch Claude Code ────────────────────────────────────────────────────────
# Model forced to Opus and effort set to max via flags.
# --effort max is Opus 4.6 only; gives deepest reasoning with no token constraint.
# CLI flag is the most reliable method — settings.json effortLevel can be silently downgraded.
if [ $# -gt 0 ]; then
  docker compose exec claude claude --dangerously-skip-permissions --model claude-opus-4-6 --effort max -p "$*"
else
  docker compose exec claude claude --dangerously-skip-permissions --model claude-opus-4-6 --effort max
fi
