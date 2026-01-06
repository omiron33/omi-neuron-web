---
name: npm-publish-automation
description: Automate npm publishing for this repo (omi-neuron-web) including version bumping, build, and publish. Use when asked to publish or release to npm, handle “version already published” errors, or deal with npm cache/2FA web auth prompts.
---

# Npm Publish Automation

## Overview

Publish this package to npm end-to-end: verify version, bump if needed, build, publish, and handle npm auth prompts (OTP or web approval).

## Workflow (default)

1. Run the publish script:
   ```bash
   skills/npm-publish-automation/scripts/publish_npm.sh
   ```
2. If npm prompts for auth, follow the **Auth Handling** section below.
3. If publish completes, report the published version.

## Auth Handling

### OTP prompt
If npm asks for a one-time password, request the 6-digit code from the user and continue.

### Web approval prompt
If npm prints:
```
Authenticate your account at:
<URL>
Press ENTER to open in the browser...
```
Open the URL in the user’s local Chrome instead of Playwright:

```bash
open -a "Google Chrome" "<URL>"
```

Ask the user to approve in Chrome, then press Enter in the terminal to continue.

## Manual Fallback (if script is not used)

```bash
export NPM_CONFIG_CACHE="$PWD/.npm-cache"
PKG_NAME=$(node -p "require('./package.json').name")
LOCAL_VERSION=$(node -p "require('./package.json').version")
PUBLISHED_VERSION=$(npm view "$PKG_NAME" version 2>/dev/null || true)

pnpm build
npm publish --access public
```

If publish fails with “You cannot publish over the previously published versions”, bump to the next patch of the published version:
```bash
npm version <published_version+1_patch> --no-git-tag-version
pnpm build
npm publish --access public
```

## Common Problems & Fixes

- **Version already published**: bump to the next patch and retry.
- **npm cache permission errors**: always set `NPM_CONFIG_CACHE="$PWD/.npm-cache"`.
- **bin auto-correct warning**: run `npm pkg fix` after publish and consider updating `bin` to a valid path.
