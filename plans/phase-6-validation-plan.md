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

### Phase 6.1 – Unit Tests: Core 🟥
- [ ] Test DataProcessor input normalization
- [ ] Test EmbeddingsService caching logic
- [ ] Test ClusteringEngine algorithms
- [ ] Test RelationshipEngine inference logic
- [ ] Test ScoringEngine calculations
- [ ] Test AnalysisPipeline orchestration
- [ ] Test EventBus subscription management
- [ ] Achieve 80%+ coverage on core modules

### Phase 6.2 – Integration Tests: API 🟥
- [ ] Test Nodes API endpoints
- [ ] Test Edges API endpoints
- [ ] Test Graph API endpoints
- [ ] Test Analysis API endpoints
- [ ] Test Settings API endpoints
- [ ] Test Search API endpoints
- [ ] Test error handling and validation
- [ ] Test pagination and filtering

### Phase 6.3 – Visual Tests: Component 🟥
- [ ] Set up visual testing framework
- [ ] Test NeuronWeb renders correctly
- [ ] Test node rendering styles
- [ ] Test edge rendering styles
- [ ] Test interaction highlights
- [ ] Test theme changes
- [ ] Test Fallback2D rendering
- [ ] Document visual test process

### Phase 6.4 – Load Tests: Performance 🟥
- [ ] Test with 100 nodes
- [ ] Test with 500 nodes
- [ ] Test with 1000 nodes
- [ ] Measure render frame rate
- [ ] Measure memory usage
- [ ] Measure API response times
- [ ] Document performance characteristics
- [ ] Identify performance bottlenecks

### Phase 6.5 – Migration Scripts 🟥
- [ ] Create NeuronMigrator class
- [ ] Implement Technochristian migration
  - [ ] Map atlas_nodes to neuron_nodes
  - [ ] Map atlas_edges to neuron_edges
  - [ ] Handle scripture anchors
  - [ ] Handle study paths
- [ ] Implement Psyopbuilder migration
  - [ ] Map documents to nodes
  - [ ] Map graph_edges to edges
  - [ ] Handle narratives
- [ ] Add dry-run mode
- [ ] Add validation step
- [ ] Document migration process

### Phase 6.6 – Documentation 🟥
- [ ] Write README.md with quick start
- [ ] Document installation steps
- [ ] Document configuration options
- [ ] Document all API endpoints
- [ ] Document React hooks
- [ ] Document component props
- [ ] Document CLI commands
- [ ] Create architecture diagrams
- [ ] Write migration guide
- [ ] Add troubleshooting section
- [ ] Create CHANGELOG.md

### Phase 6.7 – npm Publishing 🟥
- [ ] Set up changesets configuration
- [ ] Configure package.json for publishing
- [ ] Set up GitHub Actions workflow
- [ ] Create release workflow
- [ ] Test local publish with verdaccio
- [ ] Publish beta version
- [ ] Test installation in clean project
- [ ] Publish v0.1.0 release

## Task Files

See `tasks/phase-6-validation/` for individual task tracking:
- `task-6-1-unit-tests-core.md`
- `task-6-2-integration-tests-api.md`
- `task-6-3-visual-tests.md`
- `task-6-4-load-tests.md`
- `task-6-5-migration-scripts.md`
- `task-6-6-documentation.md`
- `task-6-7-npm-publishing.md`

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
- Automated visual regression in CI?
- Documentation site (Docusaurus, etc.)?
- Discord/community support channel?

## Parallel / Unblock Options
- Unit tests can start once each module is complete
- Documentation can be written alongside development
- Migration scripts can be developed early
- npm publishing setup can be done anytime

## Validation Criteria
- [ ] All tests pass in CI
- [ ] Coverage meets threshold (80%+)
- [ ] Documentation is complete and accurate
- [ ] Package installs correctly from npm
- [ ] Examples work with published package
- [ ] Migration scripts work for both projects
- [ ] No critical security vulnerabilities

