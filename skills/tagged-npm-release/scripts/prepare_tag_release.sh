#!/usr/bin/env bash
set -euo pipefail

ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Working tree is not clean. Commit or stash changes before tagging." >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI is required. Install it first." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required. Install Node.js/npm first." >&2
  exit 1
fi

echo "Note: This script is a legacy token flow. Prefer npm Trusted Publishing (OIDC) when configured."

echo "Checking GitHub auth..."
gh auth status >/dev/null

echo "Starting npm web login..."
echo "A browser window will open; approve the login and return here."
npm login --auth-type=web

echo "Creating npm token..."
TOKEN_LINE=$(npm token create)
TOKEN=$(echo "$TOKEN_LINE" | tail -n 1 | awk '{print $NF}')
if [ -z "$TOKEN" ]; then
  echo "Failed to parse npm token. Output was: $TOKEN_LINE" >&2
  exit 1
fi

echo "Setting GitHub secret NPM_TOKEN..."
gh secret set NPM_TOKEN -b "$TOKEN"

echo "Token set. Tagging next patch release..."
skills/tagged-npm-release/scripts/create_patch_tag.sh
