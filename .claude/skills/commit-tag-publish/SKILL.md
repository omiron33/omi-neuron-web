---
name: commit-tag-publish
description: Use when the user says "commit", "commit and tag", or "publish". Commits changes, bumps version, tags, and publishes to npm.
user_invocable: true
invocation:
  - commit
  - tag
  - publish
---

# Commit, Tag & Publish Workflow

When invoked, execute this full workflow:

## 1. Pre-flight checks

```bash
pnpm build
pnpm lint
pnpm typecheck
```

If any fail, fix the issues before proceeding.

## 2. Commit changes

- Run `git status` and `git diff --stat` to see what changed
- Run `git log --oneline -3` to match commit message style
- Stage all relevant files
- Create a conventional commit with Co-Authored-By trailer:

```bash
git commit -m "$(cat <<'EOF'
<type>: <description>

<optional body>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

## 3. Bump version and tag

- Check current version: `npm pkg get version`
- Bump patch version: `npm version patch --no-git-tag-version`
- Commit version bump: `git add package.json && git commit -m "chore(release): v<new-version>"`
- Create tag: `git tag v<new-version>`

## 4. Push and publish

```bash
git push && git push --tags
```

Then wait for GitHub Actions to publish, or publish manually:

```bash
pnpm build && npm publish --access public
```

## 5. Verify success

- Check `npm view @omiron33/omi-neuron-web version` matches the new version
- If publish failed, diagnose and retry

## Error recovery

If any step fails:
1. Read the error output
2. Fix the underlying issue
3. Retry from the failed step
4. Do not leave the repo in a broken state
