# Initial connector set + v1 feature parity (Phase 7C.3)

Phase 7C targets four built-in connectors to cover common “bring your own data” scenarios:
- Markdown folder (Obsidian / docs folders)
- GitHub Issues/PRs
- RSS/Atom feeds
- Notion export (markdown/html export parsing)

This document defines the minimal v1 scope for each connector.

## Shared v1 requirements (all connectors)
- Deterministic `externalId` per source item.
- Deterministic node slug strategy that is stable across runs and unique across sources.
- `contentHash`-based incremental sync (skip unchanged items).
- Optional delete-missing modes (default non-destructive).
- Provenance recorded (source, source item, sync run, mapping).

## Markdown connector (v1)
- Source config: `path` (folder), optional `include` / `exclude` globs.
- Items: `*.md` files under the folder.
- `externalId`: repo-relative file path (POSIX).
- Node mapping:
  - `label`: first heading when present, else filename.
  - `content`: raw markdown (or extracted plaintext for embeddings later).
  - `domain`: `general` (or `docs`), `nodeType`: `document`.
- Edge mapping:
  - Parse wiki links `[[Some Note]]` and markdown links to other local files.
  - Emit `references` edges to linked nodes when they exist (best-effort).

## GitHub connector (v1)
- Source config: `repo` (`owner/name`), optional `state`, optional `labels`, optional `since`.
- Items: issues and pull requests.
- `externalId`: canonical HTML URL.
- Node mapping:
  - `label`: title, `content`: body, `domain`: `github`
  - `nodeType`: `issue` or `pull_request`
- Edge mapping (best-effort):
  - Parse references like `#123` and full URLs; emit `references` edges.
  - Parse `Fixes #123`/`Closes #123` patterns as `closes` edges (optional v1).

## RSS connector (v1)
- Source config: `url`, optional `limit`.
- Items: feed entries.
- `externalId`: entry `guid` when present; fallback to `link`.
- Node mapping:
  - `label`: title, `content`: summary/content, `domain`: `rss`, `nodeType`: `article`
- Edge mapping:
  - Optional v1: parse outbound links and emit `references` edges when targets can be resolved.

## Notion export connector (v1)
- Source config: `path` (export folder).
- Items: exported markdown/html files.
- `externalId`: export-relative file path.
- Node mapping:
  - `label`: page title, `content`: page body, `domain`: `notion`, `nodeType`: `document`
- Edge mapping:
  - Preserve hierarchy with `part_of` edges from child page → parent page (best-effort).
  - Optional v1: parse internal links.

