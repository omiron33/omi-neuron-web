---
name: tagged-npm-release
description: Tag-based npm release automation for omi-neuron-web. Use when asked to release/publish via GitHub tags, create a patch tag, or enforce patch-only version bumps tied to tags.
---

# Tagged Npm Release

## Overview

Create a patch tag (`vX.Y.Z`) that triggers the GitHub Actions publish workflow. Tags are the release version source of truth. The workflow updates `package.json` + `src/index.ts`, commits back to `main`, builds, and publishes to npm.

## Quick Start

1) Ensure the working tree is clean.
2) If `NPM_TOKEN` needs refresh, run the prep script (web login + secret set + tag):

```bash
skills/tagged-npm-release/scripts/prepare_tag_release.sh
```

3) Otherwise, just create and push the next patch tag:

```bash
skills/tagged-npm-release/scripts/create_patch_tag.sh
```

That pushes `vX.Y.(Z+1)` to `origin`, which triggers the GitHub Actions workflow to publish.

## Rules

- Tags must be **patch-only** bumps (same major/minor as `package.json`).
- Tag format: `vX.Y.Z` (e.g., `v0.2.22`).
- The GitHub Action commits the version bump back to `main`.

## Workflow Notes

- Workflow file: `.github/workflows/publish-on-tag.yml`.
- Requires `NPM_TOKEN` in GitHub Secrets.
- Uses tag version as authoritative and publishes `latest`.

## Token Strategy (recommended)

- **Long‑lived CI token**: Create an **npm Automation token** (or a Granular token with no expiry and publish rights) in npm web UI, then set it once as `NPM_TOKEN` in GitHub Secrets. This avoids 2FA prompts in CI and doesn’t expire unless revoked.
- **Web login flow**: `prepare_tag_release.sh` uses `npm login --auth-type=web` (opens a web approval URL), then creates a classic token via `npm token create`, sets `NPM_TOKEN`, and tags.

## Troubleshooting

- If the workflow fails with “invalid semver”, check `package.json` or tag format.
- If it fails with auth, ensure `NPM_TOKEN` is set in repo secrets.
- If npm says version already exists, delete the tag and re-tag with the next patch.
