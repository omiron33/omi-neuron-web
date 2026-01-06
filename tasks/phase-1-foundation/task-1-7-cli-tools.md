---
title: CLI Tools - init, db commands
status: completed
priority: 2
labels:
  - 'Phase:1-Foundation'
  - 'Type:CLI'
assignees:
  - CodingAgent
depends_on:
  - task-1-4-docker-manager
  - task-1-6-migration-system
---

# Task 1.7: CLI Tools

## Objective
Build a comprehensive CLI using Commander.js for project initialization and database management.

## Requirements

### 1. CLI Entry Point (`src/cli/index.ts`)

```typescript
#!/usr/bin/env node
import { program } from 'commander';

program
  .name('omi-neuron')
  .description('CLI for omi-neuron-web library')
  .version('0.1.0');

// Register commands
program.addCommand(initCommand);
program.addCommand(dbCommand);
program.addCommand(analyzeCommand);
program.addCommand(validateCommand);
program.addCommand(configCommand);

program.parse();
```

### 2. Init Command (`src/cli/commands/init.ts`)

```bash
npx omi-neuron init [options]

Options:
  --name <name>        Instance name (default: directory name)
  --port <port>        PostgreSQL port (default: 5433)
  --skip-docker        Don't generate Docker files
  --skip-api           Don't generate API route files
  --skip-config        Don't generate neuron.config.ts
  --app-dir <path>     Path to Next.js app directory (default: ./app)
  --force              Overwrite existing files
```

**Generated Files:**
- `neuron.config.ts` - Main configuration
- `docker-compose.neuron.yml` - Docker setup
- `.env.neuron.local` - Environment template
- `app/api/neuron/[...routes]/route.ts` - API routes (if not skipped)

### 3. Database Commands (`src/cli/commands/db.ts`)

```bash
# Start database
npx omi-neuron db:up [options]
  --port <port>           Override port
  --force-recreate        Force recreate container
  --wait                  Wait for ready (default: true)

# Stop database
npx omi-neuron db:down [options]
  --remove-volumes        Remove data volumes (destructive)

# Run migrations
npx omi-neuron db:migrate [options]
  --status                Show status without running
  --rollback <count>      Rollback N migrations
  --to <version>          Migrate to specific version
  --dry-run               Show SQL without executing

# Show status
npx omi-neuron db:status [options]
  --json                  Output as JSON
  --verbose               Include detailed stats

# Reset database
npx omi-neuron db:reset [options]
  --confirm               Skip confirmation prompt
  --keep-schema           Drop data, keep schema

# Seed database
npx omi-neuron db:seed [options]
  --file <path>           Custom seed file
  --clear                 Clear before seeding
  --count <n>             Number of example nodes
```

### 4. Analyze Commands (`src/cli/commands/analyze.ts`)

```bash
npx omi-neuron analyze:embeddings [options]
  --node-ids <ids>        Comma-separated node IDs
  --force                 Regenerate existing

npx omi-neuron analyze:cluster [options]
  --count <n>             Number of clusters
  --algorithm <alg>       kmeans, dbscan, hierarchical

npx omi-neuron analyze:relationships [options]
  --threshold <n>         Min confidence (0-1)
  --dry-run               Show without saving

npx omi-neuron analyze:full [options]
  --force                 Force recompute all
```

### 5. Validate Command (`src/cli/commands/validate.ts`)

```bash
npx omi-neuron validate [options]
  --fix                   Attempt to fix issues
  --verbose               Show detailed validation

Checks:
- neuron.config.ts exists and is valid
- Docker is available
- Database container exists
- Database connection works
- Migrations are up to date
- OpenAI API key is configured
- API routes are properly configured
```

### 6. Config Command (`src/cli/commands/config.ts`)

```bash
npx omi-neuron config get <key>
npx omi-neuron config set <key> <value>
npx omi-neuron config list
npx omi-neuron config reset [--section <section>]
```

### 7. CLI Utilities (`src/cli/utils/`)
- [ ] `logger.ts` - Colored output with chalk
- [ ] `prompts.ts` - Interactive prompts
- [ ] `spinner.ts` - Progress spinner
- [ ] `templates.ts` - File template rendering

## Deliverables
- [ ] `src/cli/index.ts`
- [ ] `src/cli/commands/init.ts`
- [ ] `src/cli/commands/db.ts`
- [ ] `src/cli/commands/analyze.ts`
- [ ] `src/cli/commands/validate.ts`
- [ ] `src/cli/commands/config.ts`
- [ ] `src/cli/utils/logger.ts`
- [ ] `src/cli/utils/prompts.ts`
- [ ] `src/cli/utils/spinner.ts`
- [ ] `src/cli/utils/templates.ts`

## Acceptance Criteria
- `npx omi-neuron init` scaffolds project correctly
- `npx omi-neuron db:up` starts database
- `npx omi-neuron db:migrate` runs migrations
- `npx omi-neuron db:status` shows accurate info
- All commands have `--help` documentation
- Errors display clearly with suggestions

## Example Output

```
$ npx omi-neuron db:up

[omi-neuron] Starting PostgreSQL container: pg-my-app
[omi-neuron] Port mapping: 5433:5432
[omi-neuron] Waiting for database to be ready...
[omi-neuron] ✓ Database ready!
[omi-neuron] Running pending migrations...
  ✓ 001_initial_schema
  ✓ 002_embeddings
  ✓ 003_clusters
  ✓ 004_analysis_runs
[omi-neuron] ✓ Migrations complete

Connection string: postgresql://neuron:neuron_dev@localhost:5433/neuron_web
```

## Notes
- Use chalk for colored output
- Add shebang for direct execution
- Handle Ctrl+C gracefully
- Store config in neuron.config.ts, not CLI state


