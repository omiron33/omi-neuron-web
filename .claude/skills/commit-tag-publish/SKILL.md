---
name: commit-tag-publish
description: Use when the user says "commit", "commit and tag", or "publish". Commits changes, tags, and publishes to npm via GitHub Actions.
user_invocable: true
invocation:
  - commit
  - tag
  - publish
---

# Commit, Tag & Publish Workflow

When invoked, execute this workflow:

## 1. Pre-flight checks

```bash
pnpm build
pnpm lint
```

If any fail, fix the issues before proceeding.

## 2. Commit changes

- Run `git status` and `git diff --stat` to see what changed
- Run `git log --oneline -3` to match commit message style
- Stage all relevant files
- Create a conventional commit:

```bash
git commit -m "$(cat <<'EOF'
<type>: <description>

<optional body>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

## 3. Determine next version

```bash
npm pkg get version  # e.g., "0.2.23"
```

Next patch version = current patch + 1 (e.g., 0.2.24)

## 4. Push and tag

**IMPORTANT**: The workflow expects package.json to have the OLD version. Do NOT bump package.json locally.

```bash
git push
git tag v<next-version>  # e.g., v0.2.24
git push --tags
```

## 5. Monitor workflow

```bash
gh run list --limit 3
```

Wait for "Publish on tag" workflow to complete successfully.

## 6. Verify success

```bash
npm view @omiron33/omi-neuron-web version
```

Should show the new version. Then pull the workflow's version bump:

```bash
git pull
```

## Error recovery

If workflow fails:
1. Check logs: `gh run view <run-id> --log-failed`
2. Delete the tag: `git tag -d v<version> && git push origin :refs/tags/v<version>`
3. Fix the issue
4. Retry from step 4
