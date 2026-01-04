---
title: Project Setup - TypeScript, ESLint, Build Configuration
status: completed
priority: 1
labels:
  - 'Phase:1-Foundation'
  - 'Type:Infrastructure'
assignees:
  - CodingAgent
---

# Task 1.1: Project Setup

## Objective
Establish the foundational TypeScript project structure with proper tooling for development and building.

## Requirements

### 1. Initialize pnpm Project
- [ ] Create directory at `~/Code/omi-neuron-web`
- [ ] Run `pnpm init`
- [ ] Configure `packageManager` field

### 2. TypeScript Configuration
- [ ] Install TypeScript and type definitions
- [ ] Create `tsconfig.json` with:
  - `target: "ES2022"`
  - `module: "ESNext"`
  - `moduleResolution: "bundler"`
  - `strict: true`
  - `jsx: "react-jsx"`
  - Path aliases (`@/*` → `./src/*`)

### 3. ESLint Configuration
- [ ] Install ESLint and TypeScript plugin
- [ ] Create `eslint.config.js` with:
  - TypeScript parser
  - Recommended rules
  - Prettier integration

### 4. Prettier Configuration
- [ ] Install Prettier
- [ ] Create `.prettierrc` with project standards

### 5. Build Configuration (tsup)
- [ ] Install tsup
- [ ] Create `tsup.config.ts` with:
  - Multiple entry points (index, visualization, api, cli)
  - ESM and CJS output
  - Declaration files
  - Source maps
  - External React, Next, Three

### 6. Git Configuration
- [ ] Create `.gitignore`
- [ ] Initialize git repository

## Deliverables
- [ ] `package.json` with dependencies
- [ ] `tsconfig.json`
- [ ] `eslint.config.js`
- [ ] `.prettierrc`
- [ ] `tsup.config.ts`
- [ ] `.gitignore`
- [ ] Directory structure created

## Acceptance Criteria
- `pnpm install` completes without errors
- `pnpm build` runs (even with empty entry points)
- `pnpm lint` runs without configuration errors
- TypeScript recognizes path aliases

## Notes
- Use strict TypeScript mode from the start
- Externalize peer dependencies to avoid bundling React/Three.js

