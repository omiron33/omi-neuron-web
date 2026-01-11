# Ingestion CLI UX (Phase 7C.6)

This document defines the CLI surface for connector-based ingestion.

Goals:
- Provide a consistent `omi-neuron ingest …` interface across connector types.
- Make idempotent upserts the default behavior.
- Require explicit flags for any destructive behavior.

## Command structure

Top-level:
- `omi-neuron ingest <connector> [options]`

Connectors:
- `omi-neuron ingest markdown`
- `omi-neuron ingest github`
- `omi-neuron ingest rss`
- `omi-neuron ingest notion`

## Common options (all connectors)

These flags apply consistently:
- `--source <name>`: required source name (used for provenance identity).
- `--dry-run`: compute changes and print summary without writing.
- `--limit <n>`: cap number of items processed.
- `--since <iso>`: only consider items updated since this timestamp (connector-dependent).
- `--delete-missing`: enable missing-item handling (default is off).
- `--delete-mode <none|soft|hard>`: defaults to `none`; `soft` and `hard` require `--delete-missing`.
- `--verbose`: print per-item actions (created/updated/skipped).

## Connector-specific options

### Markdown
`omi-neuron ingest markdown --source docs --path ./docs`

Options:
- `--path <dir>`: root folder to scan.
- `--include <glob>` / `--exclude <glob>`: optional filters.

### GitHub
`omi-neuron ingest github --source omi --repo owner/name`

Options:
- `--repo <owner/name>`: required.
- `--token <token>`: optional; falls back to `GITHUB_TOKEN`.
- `--state <open|closed|all>`: default `open`.

### RSS / Atom
`omi-neuron ingest rss --source news --url https://example.com/feed.xml`

Options:
- `--url <url>`: required.

### Notion export
`omi-neuron ingest notion --source notion --path ./notion-export`

Options:
- `--path <dir>`: required export directory.

## Output format (v1)

Every run prints:
- connector + source identity
- mode: dry-run vs write
- counts: total, created, updated, skipped, deleted (soft/hard), errors

Example:
```
Source: markdown/docs
Run: dry-run
Items: 42 total (created 10, updated 2, skipped 30)
Missing: 3 (delete-mode: none)
Errors: 0
```

## Config discovery

The CLI prefers loading `neuron.config.ts` from the current working directory to determine:
- storage backend (Postgres vs local-first)
- database connection (when Postgres is used)

Future UX (implemented in Phase 7C.14):
- `omi-neuron ingest init <connector>` to scaffold minimal source config + example env vars.

