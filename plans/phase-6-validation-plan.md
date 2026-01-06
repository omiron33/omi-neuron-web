# Phase 6: Validation & Publishing Plan

## Outcomes
- Ensure library quality with comprehensive test coverage
- Create complete documentation for all features
- Prepare library for npm publication
- Provide migration utilities for existing projects

## Scope

### In Scope
- Unit tests for core engine modules
- Integration tests for API routes
- Visual regression tests for NeuronWeb component
- Performance/load testing with large node counts
- Migration scripts for Technochristian and Psyopbuilder
- README and API documentation
- npm publishing configuration with changesets

### Out of Scope
- End-to-end browser tests (rely on integration tests)
- Automated visual regression CI (manual for v1)
- Comprehensive security audit (future phase)

## Assumptions & Constraints
- Vitest as test runner
- GitHub Actions for CI
- npm as package registry
- Changesets for version management

## Dependencies
- All previous phases complete

## Execution Phases

### Phase 6.1 – Unit Tests: Core ✅
- [x] Test DataProcessor input normalization
- [x] Test EmbeddingsService caching logic
- [x] Test ClusteringEngine algorithms
- [x] Test RelationshipEngine inference logic
- [x] Test ScoringEngine calculations
- [x] Test AnalysisPipeline orchestration
- [x] Test EventBus subscription management
- [x] Achieve 80%+ coverage on core modules

### Phase 6.2 – Integration Tests: API ✅
- [x] Test Nodes API endpoints
- [x] Test Edges API endpoints
- [x] Test Graph API endpoints
- [x] Test Analysis API endpoints
- [x] Test Settings API endpoints
- [x] Test Search API endpoints
- [x] Test error handling and validation
- [x] Test pagination and filtering

### Phase 6.3 – Visual Tests: Component ✅
- [x] Set up visual testing framework
- [x] Test NeuronWeb renders correctly
- [x] Test node rendering styles
- [x] Test edge rendering styles
- [x] Test interaction highlights
- [x] Test theme changes
- [x] Test Fallback2D rendering
- [x] Document visual test process

### Phase 6.4 – Load Tests: Performance ✅
- [x] Test with 100 nodes
- [x] Test with 500 nodes
- [x] Test with 1000 nodes
- [x] Measure render frame rate
- [x] Measure memory usage
- [x] Measure API response times
- [x] Document performance characteristics
- [x] Identify performance bottlenecks

### Phase 6.5 – Migration Scripts ✅
- [x] Create NeuronMigrator class
- [x] Implement Technochristian migration
  - [x] Map atlas_nodes to neuron_nodes
  - [x] Map atlas_edges to neuron_edges
  - [x] Handle scripture anchors
  - [x] Handle study paths
- [x] Implement Psyopbuilder migration
  - [x] Map documents to nodes
  - [x] Map graph_edges to edges
  - [x] Handle narratives
- [x] Add dry-run mode
- [x] Add validation step
- [x] Document migration process

### Phase 6.6 – Documentation ✅
- [x] Write README.md with quick start
- [x] Document installation steps
- [x] Document configuration options
- [x] Document all API endpoints
- [x] Document React hooks
- [x] Document component props
- [x] Document CLI commands
- [x] Create architecture diagrams
- [x] Write migration guide
- [x] Add troubleshooting section
- [x] Create CHANGELOG.md

### Phase 6.7 – npm Publishing ✅
- [x] Set up changesets configuration
- [x] Configure package.json for publishing
- [x] Set up GitHub Actions workflow
- [x] Create release workflow
- [x] Test local publish with verdaccio
- [x] Publish beta version
- [x] Test installation in clean project
- [x] Publish v0.1.0 release

### Phase 6.8 – Patch Release: Visualization Usability ✅
- [x] Add fuzzy layout fallback when nodes lack positions
- [x] Export NeuronWeb from package root for simpler imports
- [x] Update docs/examples to reference scoped package and new layout options
- [x] Bump version + publish patch release

## Task Files

See `tasks/phase-6-validation/` for individual task tracking:
- `task-6-1-unit-tests-core.md`
- `task-6-2-integration-tests-api.md`
- `task-6-3-visual-tests.md`
- `task-6-4-load-tests.md`
- `task-6-5-migration-scripts.md`
- `task-6-6-documentation.md`
- `task-6-7-npm-publishing.md`
- `task-6-8-visualization-layout-exports.md`

## Test Structure

```
tests/
├── core/
│   ├── data-processor.test.ts
│   ├── embeddings-service.test.ts
│   ├── clustering-engine.test.ts
│   ├── relationship-engine.test.ts
│   ├── scoring-engine.test.ts
│   ├── analysis-pipeline.test.ts
│   └── event-bus.test.ts
│
├── api/
│   ├── nodes.test.ts
│   ├── edges.test.ts
│   ├── graph.test.ts
│   ├── analyze.test.ts
│   ├── settings.test.ts
│   └── search.test.ts
│
├── visualization/
│   ├── neuron-web.test.tsx
│   ├── scene-manager.test.ts
│   └── visual-snapshots/
│
├── integration/
│   ├── full-pipeline.test.ts
│   └── migration.test.ts
│
└── fixtures/
    ├── mock-nodes.json
    ├── mock-edges.json
    └── mock-graph.json
```

## CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test

  publish:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: pnpm build
      - uses: changesets/action@v1
        with:
          publish: pnpm changeset publish
```

## Documentation Structure

```
docs/
├── README.md           # Main readme (also at repo root)
├── getting-started.md  # Quick start guide
├── configuration.md    # Config file reference
├── api-reference.md    # REST API documentation
├── hooks-reference.md  # React hooks documentation
├── component-props.md  # NeuronWeb component props
├── cli-reference.md    # CLI commands
├── migration-guide.md  # Migration from TC/Psyop
├── architecture.md     # System architecture
├── troubleshooting.md  # Common issues
└── changelog.md        # Version history
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Flaky tests | Use stable test fixtures, avoid timing issues |
| Documentation drift | Generate docs from types where possible |
| Breaking changes | Semantic versioning, deprecation warnings |
| Security issues | Dependency scanning, limited scope |

## Open Questions
- None (resolved for initial release).

## Task Backlog
- None. All Phase 6 tasks completed.

## Parallel / Unblock Options
- Unit tests can start once each module is complete
- Documentation can be written alongside development
- Migration scripts can be developed early
- npm publishing setup can be done anytime

## Validation Criteria
- [x] All tests pass in CI
- [x] Coverage meets threshold (80%+)
- [x] Documentation is complete and accurate
- [x] Package installs correctly from npm
- [x] Examples work with published package
- [x] Migration scripts work for both projects
- [x] No critical security vulnerabilities
