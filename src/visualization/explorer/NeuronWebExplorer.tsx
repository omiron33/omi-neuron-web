'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { NeuronWeb } from '../NeuronWeb';
import type {
  NeuronWebExplorerFilters,
  NeuronWebExplorerProps,
  NeuronWebExplorerResolvedFilters,
} from '../types';
import { useNeuronGraph } from '../../react/hooks/useNeuronGraph';
import type { NeuronNode } from '../../core/types';
import { applyExplorerFilters, normalizeExplorerFilters } from './explorer-filters';

type ExplorerGraphData = NonNullable<NeuronWebExplorerProps['graphData']>;
type ExplorerFilters = NeuronWebExplorerResolvedFilters;

const DefaultToolbar = ({
  query,
  setQuery,
}: {
  query: string;
  setQuery: (next: string) => void;
}) => {
  return (
    <div className="neuron-explorer__toolbar" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search nodes…"
        style={{
          flex: 1,
          minWidth: 220,
          padding: '10px 12px',
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.14)',
          background: 'rgba(255,255,255,0.06)',
          color: 'inherit',
        }}
      />
    </div>
  );
};

const ExplorerBase = ({
  graphData,
  isLoading,
  error,
  className,
  style,
  initialFilters,
  filters: controlledFilters,
  onFiltersChange,
  selectedNodeId: controlledSelectedNodeId,
  onSelectedNodeIdChange,
  renderToolbar,
  renderLegend,
  renderSelectionPanel,
  renderEmptyState,
  renderLoadingState,
  neuronWebProps,
}: {
  graphData: ExplorerGraphData;
  isLoading?: boolean;
  error?: Error | string | null;
} & Omit<NeuronWebExplorerProps, 'graphData'>) => {
  const [query, setQuery] = useState('');
  const [uncontrolledFilters, setUncontrolledFilters] = useState<ExplorerFilters>(() =>
    normalizeExplorerFilters(initialFilters)
  );
  const [uncontrolledSelectedNodeId, setUncontrolledSelectedNodeId] = useState<string | null>(null);
  const [focusNodeSlug, setFocusNodeSlug] = useState<string | null>(null);

  const filters = useMemo(
    () => normalizeExplorerFilters(controlledFilters ?? uncontrolledFilters),
    [controlledFilters, uncontrolledFilters]
  );

  const setFilters = useCallback(
    (next: NeuronWebExplorerFilters) => {
      if (onFiltersChange) onFiltersChange(next);
      if (!controlledFilters) setUncontrolledFilters(normalizeExplorerFilters(next));
    },
    [controlledFilters, onFiltersChange]
  );

  const selectedNodeId = controlledSelectedNodeId ?? uncontrolledSelectedNodeId;
  const setSelectedNodeId = useCallback(
    (next: string | null) => {
      if (onSelectedNodeIdChange) onSelectedNodeIdChange(next);
      if (!controlledSelectedNodeId) setUncontrolledSelectedNodeId(next);
    },
    [controlledSelectedNodeId, onSelectedNodeIdChange]
  );

  const filteredGraph = useMemo(
    () => applyExplorerFilters(graphData, filters, query),
    [graphData, filters, query]
  );

  const selectedNode = useMemo(
    () => (selectedNodeId ? filteredGraph.nodes.find((node) => node.id === selectedNodeId) ?? null : null),
    [filteredGraph.nodes, selectedNodeId]
  );

  const handleNodeClick = useCallback(
    (node: NeuronNode) => {
      setSelectedNodeId(node.id);
      neuronWebProps?.onNodeClick?.(node);
    },
    [setSelectedNodeId, neuronWebProps]
  );

  const handleFocusConsumed = useCallback(() => {
    setFocusNodeSlug(null);
    neuronWebProps?.onFocusConsumed?.();
  }, [neuronWebProps]);

  const toolbar = renderToolbar
    ? renderToolbar({
        query,
        setQuery,
        filters,
        setFilters,
        isSearching: false,
        selectedNodeId,
        setSelectedNodeId,
        selectedNode,
        focusNodeSlug,
        setFocusNodeSlug,
      })
    : <DefaultToolbar query={query} setQuery={setQuery} />;
  const legend = renderLegend ? renderLegend({ filters }) : null;
  const selectionPanel = renderSelectionPanel ? renderSelectionPanel({ selectedNode }) : null;

  const resolvedLoading = Boolean(isLoading ?? neuronWebProps?.isLoading);
  const resolvedError = error ?? neuronWebProps?.error ?? null;

  if (resolvedLoading && renderLoadingState) {
    return <>{renderLoadingState()}</>;
  }
  if (resolvedError && renderEmptyState) {
    return <>{renderEmptyState()}</>;
  }

  return (
    <div className={['neuron-explorer', className].filter(Boolean).join(' ')} style={style}>
      {toolbar}
      <div style={{ display: 'grid', gridTemplateColumns: selectionPanel || legend ? '1fr 320px' : '1fr', gap: 12 }}>
        <div className="neuron-explorer__canvas" style={{ minHeight: 420 }}>
          <NeuronWeb
            {...neuronWebProps}
            graphData={filteredGraph}
            selectedNode={selectedNode as unknown as NeuronNode}
            focusNodeSlug={focusNodeSlug}
            onFocusConsumed={handleFocusConsumed}
            onNodeClick={handleNodeClick}
          />
        </div>
        {(legend || selectionPanel) && (
          <div className="neuron-explorer__sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {legend ? <div className="neuron-explorer__legend">{legend}</div> : null}
            {selectionPanel ? <div className="neuron-explorer__selection">{selectionPanel}</div> : null}
          </div>
        )}
      </div>
    </div>
  );
};

const NeuronWebExplorerWithHooks = (props: Omit<NeuronWebExplorerProps, 'graphData'>) => {
  const [filters, setFilters] = useState<ExplorerFilters>(() => normalizeExplorerFilters(props.initialFilters));

  const graphOptions = useMemo(
    () => ({
      domains: filters.domains?.length ? filters.domains : undefined,
      nodeTypes: filters.nodeTypes?.length ? filters.nodeTypes : undefined,
      minEdgeStrength: filters.minEdgeStrength,
    }),
    [filters.domains, filters.nodeTypes, filters.minEdgeStrength]
  );

  const graph = useNeuronGraph(graphOptions);

  return (
    <ExplorerBase
      {...props}
      graphData={{ nodes: graph.nodes, edges: graph.edges }}
      isLoading={graph.isLoading}
      error={graph.error}
      filters={filters}
      onFiltersChange={(next) => setFilters(normalizeExplorerFilters(next))}
    />
  );
};

export function NeuronWebExplorer(props: NeuronWebExplorerProps): React.ReactElement {
  if (props.graphData) {
    return <ExplorerBase {...props} graphData={props.graphData} />;
  }
  return <NeuronWebExplorerWithHooks {...props} />;
}
