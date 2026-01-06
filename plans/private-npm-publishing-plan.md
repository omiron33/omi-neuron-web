# Private npm Publishing Plan

## Outcomes
- Publish omi-neuron-web to npm as a private package
- Enable `npm install omi-neuron-web` from anywhere with authentication
- Support `npx omi-neuron init` to scaffold new projects
- Maintain version control with changesets

## Scope

### In Scope
- npm private package configuration
- npm organization/scope setup
- Authentication workflow
- CLI global installation
- Automated publishing via GitHub Actions
- Version management with changesets

### Out of Scope
- Self-hosted npm registry (using npm directly)
- Public package (private only)

## Prerequisites
- npm account with paid plan (for private packages) OR npm organization
- GitHub repository for CI/CD
- npm access token for automation

---

## Option A: npm Private Package (Recommended)

### 1. Package Configuration

Update `package.json`:

```json
{
  "name": "@your-org/omi-neuron-web",
  "version": "0.1.0",
  "private": false,
  "publishConfig": {
    "access": "restricted",
    "registry": "https://registry.npmjs.org/"
  },
  "bin": {
    "omi-neuron": "./dist/cli/index.js"
  }
}
```

### 2. npm Organization Setup

```bash
# Create organization on npmjs.com (one-time)
# Go to: https://www.npmjs.com/org/create

# Or use existing org scope
# Package name: @shanefisher/omi-neuron-web (example)
```

### 3. Local Authentication

```bash
# Login to npm (one-time per machine)
npm login

# Verify login
npm whoami

# Check access to org
npm org ls @your-org
```

### 4. Publishing Workflow

```bash
# Build the package
pnpm build

# Publish (first time)
npm publish --access restricted

# Subsequent publishes
pnpm changeset        # Create changeset
pnpm changeset version # Bump version
npm publish           # Publish new version
```

### 5. Installation from Anywhere

```bash
# Must be logged in to npm
npm login

# Install globally for CLI
npm install -g @your-org/omi-neuron-web

# Use CLI
omi-neuron init

# Or use npx (also requires login)
npx @your-org/omi-neuron-web init

# Install in project
npm install @your-org/omi-neuron-web
```

---

## Option B: GitHub Packages (Alternative)

### 1. Package Configuration for GitHub

```json
{
  "name": "@your-github-username/omi-neuron-web",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}
```

### 2. GitHub Authentication

Create `.npmrc` in home directory:

```
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
@your-github-username:registry=https://npm.pkg.github.com
```

### 3. Publish to GitHub Packages

```bash
npm publish
```

---

## CI/CD Configuration

### GitHub Actions Workflow (`.github/workflows/publish.yml`)

```yaml
name: Publish Package

on:
  push:
    branches: [main]
    paths:
      - '.changeset/**'
      - 'src/**'
      - 'package.json'

concurrency:
  group: publish
  cancel-in-progress: false

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      packages: write
      id-token: write
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
          registry-url: 'https://registry.npmjs.org'
      
      - run: pnpm install
      - run: pnpm build
      - run: pnpm test
      
      - name: Create Release Pull Request or Publish
        id: changesets
        uses: changesets/action@v1
        with:
          publish: pnpm release
          title: 'chore: release packages'
          commit: 'chore: release packages'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### npm Token Setup

1. Go to npmjs.com → Access Tokens → Generate New Token
2. Select "Automation" token type
3. Add to GitHub repository secrets as `NPM_TOKEN`

---

## Package Scripts

Update `package.json` scripts:

```json
{
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "changeset": "changeset",
    "version": "changeset version",
    "release": "pnpm build && npm publish --access restricted",
    "prepublishOnly": "pnpm build && pnpm test"
  }
}
```

---

## Changesets Configuration

### Initialize Changesets

```bash
pnpm add -D @changesets/cli
pnpm changeset init
```

### Update `.changeset/config.json`

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.1.1/schema.json",
  "changelog": ["@changesets/changelog-github", { "repo": "your-org/omi-neuron-web" }],
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "restricted",
  "baseBranch": "main",
  "updateInternalDependencies": "patch"
}
```

---

## User Installation Guide

### First-Time Setup (for users)

```bash
# 1. Login to npm (required for private packages)
npm login

# 2. Install CLI globally
npm install -g @your-org/omi-neuron-web

# 3. Verify installation
omi-neuron --version
```

### Using the CLI

```bash
# Initialize in a new or existing Next.js project
cd my-nextjs-app
omi-neuron init

# This will:
# - Create neuron.config.ts
# - Create docker-compose.neuron.yml
# - Create API routes
# - Add scripts to package.json

# Start database
omi-neuron db:up

# Run migrations
omi-neuron db:migrate
```

### Project Installation

```bash
# In your Next.js project
npm install @your-org/omi-neuron-web

# Or with pnpm
pnpm add @your-org/omi-neuron-web
```

---

## .npmrc Templates

### For CI/CD (`.npmrc` in repo root)

```
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

### For Users (instructions in docs)

```bash
# Users need to run once:
npm login

# Or create ~/.npmrc with:
# //registry.npmjs.org/:_authToken=YOUR_TOKEN
```

---

## Execution Phases

### Phase 1: npm Setup ✅
- [x] Create npm organization (if needed)
- [x] Update package.json with scoped name
- [x] Configure publishConfig
- [x] Add .npmrc for CI

### Phase 2: Changesets Setup ✅
- [x] Install changesets
- [x] Configure changesets for restricted access
- [x] Create initial changeset

### Phase 3: GitHub Actions ✅
- [x] Create publish workflow
- [x] Add NPM_TOKEN secret
- [x] Test workflow with dry run

### Phase 4: First Publish ✅
- [x] Build package
- [x] Run tests
- [x] Publish v0.1.0
- [x] Verify installation works

### Phase 5: Documentation ✅
- [x] Add installation instructions to README
- [x] Document authentication requirements
- [x] Create quickstart guide

---

## Task File

See `tasks/phase-6-validation/task-6-4-private-npm.md` for detailed implementation steps.

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Token exposure | Use GitHub secrets, never commit tokens |
| Auth complexity for users | Clear documentation, npm login is standard |
| Cost (npm private) | Consider GitHub Packages as free alternative |
| Version conflicts | Changesets enforces proper versioning |

---

## Cost Considerations

### npm Private Packages
- Free for organizations with public packages
- $7/user/month for npm Pro (private packages for individuals)
- Free for npm Organizations with Teams plan ($7/user/month)

### GitHub Packages
- Free for public repos
- Free 500MB for private repos (then $0.25/GB)
- Requires GitHub authentication

---

## Recommended Approach

For your use case, I recommend **npm private package with organization scope**:

1. Scope: `@shanefisher/omi-neuron-web` (or your org name)
2. Registry: npm (standard, works everywhere)
3. CI: GitHub Actions with changesets
4. Auth: Standard `npm login`

This gives you:
- `npx @shanefisher/omi-neuron init` works after npm login
- Familiar workflow for any developer
- Automatic versioning and changelogs
- Works in any environment with npm

---

## Task Backlog
- None. All private npm publishing tasks completed.

## Parallel / Unblock Options
- None. All work complete for this plan.

