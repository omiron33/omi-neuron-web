# AGENTS.md

Guidelines for AI agents working on the omi-neuron-web codebase.

## Agent Execution Model

This repository is designed for **plan-driven agent execution**. Agents should:

1. **Read the plan** before starting any work
2. **Follow task dependencies** in order
3. **Update task status** after completion
4. **Not deviate** from specified requirements without explicit instruction

## Getting Started

### 1. Understand Current State

```bash
# Check current task queue
cat plans/next-step.json

# Read master plan for context
cat plans/master-plan-planner.md

# Check what's implemented
ls -la src/
```

### 2. Pick Up Next Task

The `plans/next-step.json` file contains:
```json
{
  "currentPhase": "phase-1-foundation",
  "currentTask": "task-1-1-project-setup",
  "status": "not_started",
  "queue": [...]
}
```

Read the corresponding task file:
```bash
cat tasks/phase-1-foundation/task-1-1-project-setup.md
```

### 3. Execute Task

Follow the requirements in the task file:
- Check "Requirements" section for what to build
- Check "Deliverables" for expected outputs
- Check "Acceptance Criteria" for validation

### 4. Update Status

After completing a task, update the frontmatter:
```yaml
---
status: completed  # was: not_started
---
```

And update `plans/next-step.json` to point to next task.

## Task Dependency Rules

Tasks specify dependencies in frontmatter:
```yaml
depends_on:
  - task-1-2-type-system
  - task-1-5-postgres-client
```

**Never start a task before its dependencies are complete.**

## Phase Overview

| Phase | Focus | Key Outputs |
|-------|-------|-------------|
| 1 | Foundation | Types, Docker, Migrations, CLI |
| 2 | Analysis | Embeddings, Clustering, Relationships |
| 3 | API | REST endpoints, Repositories |
| 4 | Visualization | Three.js component |
| 5 | Integration | React hooks, Provider, Examples |
| 6 | Validation | Tests, Docs, Publishing |

## Parallel Work

Some tasks can be done in parallel:
- Type system (1-2) and Docker manager (1-4)
- Event system (2-7) and repositories (3-1)
- Visualization (Phase 4) after types are done

Check the dependency graph in `plans/master-plan-planner.md`.

## Code Quality Standards

### TypeScript
- Strict mode enabled
- No implicit `any`
- Export types from `src/core/types/`
- Use Zod for runtime validation

### Testing
- Write tests alongside implementation
- Place in `tests/{module}/`
- Use Vitest

### Documentation
- JSDoc on public APIs
- Update README for new features
- Keep task files current

## File Naming Conventions

```
src/
  core/
    types/
      node.ts           # Node-related types
      edge.ts           # Edge-related types
    analysis/
      embeddings-service.ts
      clustering-engine.ts
  api/
    routes/
      nodes.ts          # /api/neuron/nodes handlers
    repositories/
      node-repository.ts
```

## Common Mistakes to Avoid

1. **Don't skip dependencies** — Tasks build on each other
2. **Don't over-engineer** — Follow spec exactly, no extras
3. **Don't forget exports** — Update index.ts files
4. **Don't ignore errors** — Fix linting/type errors before moving on
5. **Don't hardcode** — Use config/settings system

## Validation Checklist

Before marking a task complete:

- [ ] Code compiles (`pnpm typecheck`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Tests pass (`pnpm test`)
- [ ] Deliverables exist
- [ ] Acceptance criteria met
- [ ] Index files updated
- [ ] No console.logs in production code

## Communication Patterns

### When Blocked
If you encounter an issue:
1. Document the problem in the task file
2. Set status to `blocked`
3. Add a note explaining the blocker
4. Continue with parallel tasks if possible

### When Requirements Unclear
1. Check related plan files for context
2. Look at reference implementations
3. Make reasonable assumptions and document them
4. Flag for human review

### When Complete
1. Update task status
2. Update next-step.json
3. Commit with descriptive message
4. Move to next task

## Reference Materials

| Document | Purpose |
|----------|---------|
| `CLAUDE.md` | Technical implementation details |
| `plans/master-plan-planner.md` | High-level roadmap |
| `plans/phase-*-plan.md` | Phase requirements |
| `tasks/phase-*/task-*.md` | Individual task specs |
| `plans/next-step.json` | Current execution state |

## Example Workflow

```
1. Read plans/next-step.json
   → currentTask: "task-1-4-docker-manager"

2. Read tasks/phase-1-foundation/task-1-4-docker-manager.md
   → Requirements: DockerManager class, health check, etc.

3. Check dependencies
   → depends_on: ["task-1-1-project-setup"] ✓ completed

4. Implement according to spec
   → Create src/storage/docker-manager.ts
   → Create docker/docker-compose.template.yml

5. Validate
   → pnpm typecheck ✓
   → pnpm lint ✓

6. Update status
   → task-1-4-docker-manager.md: status: completed
   → next-step.json: currentTask: "task-1-5-postgres-client"

7. Commit and continue
```

## Emergency Procedures

### Build Broken
```bash
pnpm typecheck  # Find type errors
pnpm lint       # Find lint errors
```

### Tests Failing
```bash
pnpm test       # Run all tests
pnpm test -- --watch  # Debug specific test
```

### Dependency Issues
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## Final Notes

- This is a library project, not an application
- Focus on clean APIs and documentation
- Everything should be configurable
- Peer dependencies (React, Three.js) are external
- The CLI is the main user entry point

---
**2026-01-10T21:59:52.911Z**
Current step in the plan is Phase 7C: Implement RSS connector.

---
**2026-01-10T22:00:00.288Z**
Testing completed successfully. All tests passed.

---
**2026-01-10T22:00:02.537Z**
RSS connector implementation successfully executed.

---
**2026-01-10T22:00:08.841Z**
Current task is finalizing the integration for RSS connector.

---
**2026-01-10T22:00:10.697Z**
Task of implementing RSS connector and conducting tests has been completed successfully.
