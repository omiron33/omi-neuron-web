#!/usr/bin/env bash
set -euo pipefail

ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Working tree is not clean. Commit or stash changes before tagging." >&2
  exit 1
fi

CURRENT=$(node -p "require('./package.json').version")
NEXT=$(node - "$CURRENT" <<'NODE'
const [current] = process.argv.slice(1);
const parse = (v) => v.split('-')[0].split('.').map((n) => parseInt(n, 10));
const [maj, min, patch] = parse(current);
if ([maj, min, patch].some((n) => Number.isNaN(n))) {
  console.error('Invalid version in package.json.');
  process.exit(1);
}
console.log(`${maj}.${min}.${patch + 1}`);
NODE
)

TAG="v${NEXT}"
if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "Tag already exists: $TAG" >&2
  exit 1
fi

git tag -a "$TAG" -m "Release $TAG"

echo "Created tag $TAG"
echo "Pushing tag to origin..."
git push origin "$TAG"

echo "Tag pushed. GitHub Actions will publish and commit the version bump to main."
