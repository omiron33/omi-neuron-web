#!/usr/bin/env bash
set -euo pipefail

ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"

export NPM_CONFIG_CACHE="${NPM_CONFIG_CACHE:-$ROOT/.npm-cache}"

PKG_NAME=$(node -p "require('./package.json').name")
LOCAL_VERSION=$(node -p "require('./package.json').version")

echo "Package: $PKG_NAME"
echo "Local version: $LOCAL_VERSION"

PUBLISHED_VERSION=$(npm view "$PKG_NAME" version 2>/dev/null || true)
if [[ -n "$PUBLISHED_VERSION" ]]; then
  echo "Published version: $PUBLISHED_VERSION"
  NEEDS_BUMP=$(node - "$LOCAL_VERSION" "$PUBLISHED_VERSION" <<'NODE'
const [local, published] = process.argv.slice(2);
const parse = (v) => v.split("-")[0].split(".").map((n) => parseInt(n, 10) || 0);
const cmp = (a, b) => {
  for (let i = 0; i < 3; i += 1) {
    if (a[i] > b[i]) return 1;
    if (a[i] < b[i]) return -1;
  }
  return 0;
};
const res = cmp(parse(local), parse(published));
console.log(res <= 0 ? "yes" : "no");
NODE
  )

  if [[ "$NEEDS_BUMP" == "yes" ]]; then
    NEXT_VERSION=$(node - "$PUBLISHED_VERSION" <<'NODE'
const [published] = process.argv.slice(2);
const parts = published.split("-")[0].split(".").map((n) => parseInt(n, 10) || 0);
parts[2] += 1;
console.log(parts.join("."));
NODE
    )
    echo "Bumping version to $NEXT_VERSION"
    npm version "$NEXT_VERSION" --no-git-tag-version
    LOCAL_VERSION=$(node -p "require('./package.json').version")
    echo "New local version: $LOCAL_VERSION"
  fi
else
  echo "No published version found (first publish or npm view failed)."
fi

pnpm build

echo "Publishing $PKG_NAME@$LOCAL_VERSION"
npm publish --access public
