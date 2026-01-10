# Phase 7F: Visualization UX Toolkit + Scalability Plan

## Outcomes
- `NeuronWeb` can be used “out of the box” for real applications without every consumer building the same UI scaffolding (search, filters, legend, selection panels).
- The visualization remains performant and usable as graphs grow:
  - clear density strategies
  - label/edge decluttering
  - scalable rendering approaches
- Consumers can choose between:
  - “headless” graph renderer (`NeuronWeb` only)
  - optional “explorer” wrapper utilities (lightweight UI kit layer)

## Scope

### In scope
- Optional visualization UX toolkit:
  - search box patterns (semantic + label search)
  - filter controls (domain/nodeType/cluster/relationshipType)
  - legend and selection detail panels (pluggable slots)
- Visualization scalability improvements:
  - label level-of-detail (LOD)
  - edge declutter strategies (fade/threshold/bundling options)
  - instanced rendering evaluation and targeted upgrades
- Storytelling enhancements:
  - better story beat APIs and utilities
  - camera rails / stable transitions (where feasible)
- Documentation + demos for common integration patterns.

#### Proposed “Explorer” API shape (v1 target)
This plan intentionally keeps the core renderer (`NeuronWeb`) headless and adds an optional wrapper.

Proposed exports (finalized in Phase 2 design):
- `@omiron33/omi-neuron-web/visualization`
  - `NeuronWeb` (existing)
  - `NeuronWebExplorer` (new, optional)
  - `NeuronWebExplorerProps` (new)

Proposed Explorer slots (minimal, optional):
- `renderToolbar` (search/filter controls)
- `renderLegend`
- `renderSelectionPanel`
- `renderEmptyState` / `renderLoadingState` (reuse existing patterns)

#### Scalability knobs (v1 target)
- Label LOD:
  - thresholds by node tier / distance / performance mode
  - hard caps (max labels) already exist; ensure they are predictable and configurable
- Edge declutter:
  - minimum edge strength visibility
  - de-emphasize non-focused edges
  - optional bundling strategy (backlog if too heavy)

### Out of scope
- A full component library with design-system commitments (keep it minimal and optional).
- Real-time multi-user presence/collaboration.
- A full editor UI for story beats (we provide contracts and helpers).

## Assumptions & Constraints
- Phase 4B visualization polish is a prerequisite for the best baseline UX.
- Three.js remains a peer dependency; avoid new heavyweight runtime deps.
- Any “UI toolkit” layer must be optional and not force styling choices.

## Dependencies
- Visualization core (`src/visualization/*`) including layout, interaction manager, theme engine.
- React hooks (`src/react/hooks/*`) for search/filter data sources.
- Existing docs under `docs/visualization/*` for polish constraints and contracts.
- Phase 4C rendering/animation depth work (recommended prerequisite for richer edge/node styles and animation profiles):
  - `plans/phase-4c-visualization-rendering-animation-plan.md`

## Execution Phases

### Phase 1 – Discovery 🟥
- [ ] Define the minimal “explorer UX” feature set that most consumers rebuild today and document the target API surface.
- [ ] Benchmark current visualization performance across graph sizes and identify the top bottlenecks (labels, edges, interactions, layout).
- [ ] Review Phase 4B outputs and determine what remains missing for “app-ready” usage (filters/search/panels/density presets).

### Phase 2 – Design/Architecture 🟥
Design artifacts to produce in this phase (recommended):
- `docs/phase-7f/explorer-api.md` (component props, slots, data flow)
- `docs/phase-7f/scalability-benchmarks.md` (baseline metrics, bottlenecks, targets)
- `docs/phase-7f/declutter-rules.md` (LOD, thresholds, fade rules)

- [ ] Design an optional explorer wrapper:
  - proposed component(s) (e.g., `NeuronWebExplorer`)
  - slot-based rendering for UI panels
  - minimal styling defaults
- [ ] Design scalability knobs and defaults:
  - label LOD rules
  - edge thresholds and fades
  - density presets and how they interact with layout
- [ ] Design integration patterns with hooks:
  - how explorer uses `useNeuronGraph`, `useNeuronSearch`, `useNeuronNodes`
  - how filters map to API params
- [ ] Design story tooling improvements:
  - story beat utilities
  - study path composition helpers

### Phase 3 – Implementation 🟥
- [ ] Implement optional explorer wrapper component(s) that compose `NeuronWeb` and expose slots for UI extensions.
- [ ] Implement label LOD improvements and ensure density options remain predictable at high node counts.
- [ ] Implement edge declutter options (threshold/fade, and optional bundling strategy if feasible without heavy deps).
- [ ] Add performance-mode presets for common node count ranges (normal/degraded/fallback) with clear behavior.
- [ ] Add story tooling helpers (utility functions and/or hook helpers) for building curated tours.
- [ ] Update docs and add demos illustrating explorer usage and scalability behaviors.

### Phase 4 – Validation 🟥
- [ ] Add visual demos for explorer UX flows (search, filter, selection) and validate accessibility.
- [ ] Validate performance improvements against baseline budgets (documented in Phase 4B).
- [ ] Add tests for deterministic behaviors (filtering, LOD rule selection, density mapping).
- [ ] Validate that `NeuronWeb` remains usable standalone and explorer layer is fully optional.

## Risks & Mitigations
- UI toolkit becomes too opinionated → Keep UI minimal, slot-based, and optional; document “headless” usage first.
- Performance regressions from new features → Gate features by performance mode and provide safe defaults.
- Story tooling becomes complex → Start with small utilities; avoid building a full editor.

## Open Questions
- Should the explorer wrapper ship styles, or only provide layout primitives and let consumers style?
- Do we want to attempt edge bundling in-core, or keep it as a future/backlog item?

## Task Backlog
- GPU instancing for nodes and/or edges if performance targets demand it.
- Advanced layout options (server-driven layout, WebGPU) as long-term exploration.

## Parallel / Unblock Options
- Explorer UI design can proceed in parallel with scalability benchmarking.
- Story tooling can proceed independently of rendering optimizations.
