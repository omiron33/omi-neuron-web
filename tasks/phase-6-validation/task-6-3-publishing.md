---
title: npm Publishing - Changesets and CI
status: not_started
priority: 2
labels:
  - 'Phase:6-Validation'
  - 'Type:Publishing'
assignees:
  - CodingAgent
depends_on:
  - task-6-1-testing
  - task-6-2-documentation
---

# Task 6.3: npm Publishing

## Objective
Configure npm publishing with changesets and GitHub Actions CI/CD.

## Requirements

### 1. Changesets Configuration

```bash
pnpm add -D @changesets/cli @changesets/changelog-github
pnpm changeset init
```

```json
// .changeset/config.json
{
  "$schema": "https://unpkg.com/@changesets/config@3.1.1/schema.json",
  "changelog": ["@changesets/changelog-github", { "repo": "user/omi-neuron-web" }],
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

### 2. GitHub Actions CI (`.github/workflows/ci.yml`)

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build

  publish:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      
      - run: pnpm install
      - run: pnpm build
      
      - name: Create Release Pull Request or Publish
        uses: changesets/action@v1
        with:
          publish: pnpm changeset publish
          title: 'chore: release packages'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 3. Package Scripts

```json
{
  "scripts": {
    "changeset": "changeset",
    "version": "changeset version",
    "release": "pnpm build && changeset publish",
    "prerelease": "pnpm run test && pnpm run build"
  }
}
```

### 4. NPM Configuration

```
// .npmrc
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

### 5. Pre-publish Checks
- [ ] Version bump
- [ ] Changelog updated
- [ ] Tests pass
- [ ] Build succeeds
- [ ] Types generate

### 6. Release Process

1. Create changeset: `pnpm changeset`
2. Commit changeset file
3. Merge to main
4. CI creates release PR
5. Merge release PR
6. CI publishes to npm

## Deliverables
- [ ] `.changeset/config.json`
- [ ] `.github/workflows/ci.yml`
- [ ] `.npmrc`
- [ ] Updated `package.json` scripts
- [ ] `CHANGELOG.md` template

## Pre-publish Checklist

```markdown
## Release Checklist

- [ ] All tests pass
- [ ] Build succeeds
- [ ] Documentation updated
- [ ] CHANGELOG entry added
- [ ] Version number correct
- [ ] No console.logs in production code
- [ ] Types exported correctly
- [ ] Peer dependencies correct
```

## Acceptance Criteria
- CI runs on every PR
- Changesets creates release PRs
- npm publish succeeds
- Package installs correctly
- Types work in consuming projects

## Notes
- Use semantic versioning
- Test beta releases first
- Tag releases in GitHub
- Update docs on release

