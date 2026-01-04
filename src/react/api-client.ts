import type {
  AnalysisRequest,
  AnalysisResponse,
  CancelAnalysisResponse,
  CreateEdgesRequest,
  CreateEdgesResponse,
  CreateNodesRequest,
  CreateNodesResponse,
  DeleteEdgeResponse,
  DeleteNodeResponse,
  ExpandGraphRequest,
  ExpandGraphResponse,
  FindPathRequest,
  FindPathResponse,
  FindSimilarRequest,
  FindSimilarResponse,
  GetAnalysisJobResponse,
  GetGraphParams,
  GetGraphResponse,
  GetNodeResponse,
  GetSettingsResponse,
  ListEdgesParams,
  ListEdgesResponse,
  ListNodesParams,
  ListNodesResponse,
  SemanticSearchRequest,
  SemanticSearchResponse,
  UpdateEdgeRequest,
  UpdateNodeRequest,
  UpdateSettingsRequest,
  UpdateSettingsResponse,
  ResetSettingsResponse,
} from '../core/types/api';

export class NeuronApiClient {
  constructor(private basePath: string) {}

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.basePath}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    return response.json() as Promise<T>;
  }

  nodes = {
    list: (params?: ListNodesParams) =>
      this.request<ListNodesResponse>(`/nodes?${new URLSearchParams(params as Record<string, string>)}`),
    get: (id: string) => this.request<GetNodeResponse>(`/nodes/${id}`),
    create: (data: CreateNodesRequest) =>
      this.request<CreateNodesResponse>('/nodes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: UpdateNodeRequest) =>
      this.request(`/nodes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => this.request<DeleteNodeResponse>(`/nodes/${id}`, { method: 'DELETE' }),
  };

  edges = {
    list: (params?: ListEdgesParams) =>
      this.request<ListEdgesResponse>(`/edges?${new URLSearchParams(params as Record<string, string>)}`),
    create: (data: CreateEdgesRequest) =>
      this.request<CreateEdgesResponse>('/edges', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: UpdateEdgeRequest) =>
      this.request(`/edges/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => this.request<DeleteEdgeResponse>(`/edges/${id}`, { method: 'DELETE' }),
  };

  graph = {
    get: (params?: GetGraphParams) =>
      this.request<GetGraphResponse>(`/graph?${new URLSearchParams(params as Record<string, string>)}`),
    expand: (data: ExpandGraphRequest) =>
      this.request<ExpandGraphResponse>('/graph/expand', { method: 'POST', body: JSON.stringify(data) }),
    findPath: (data: FindPathRequest) =>
      this.request<FindPathResponse>('/graph/path', { method: 'POST', body: JSON.stringify(data) }),
  };

  analyze = {
    start: (data: AnalysisRequest) =>
      this.request<AnalysisResponse>('/analyze', { method: 'POST', body: JSON.stringify(data) }),
    getStatus: (jobId: string) => this.request<GetAnalysisJobResponse>(`/analyze/${jobId}`),
    cancel: (jobId: string) =>
      this.request<CancelAnalysisResponse>(`/analyze/${jobId}/cancel`, { method: 'POST' }),
  };

  settings = {
    get: () => this.request<GetSettingsResponse>('/settings'),
    update: (data: UpdateSettingsRequest) =>
      this.request<UpdateSettingsResponse>('/settings', { method: 'PATCH', body: JSON.stringify(data) }),
    reset: () => this.request<ResetSettingsResponse>('/settings/reset', { method: 'POST' }),
  };

  search = {
    semantic: (data: SemanticSearchRequest) =>
      this.request<SemanticSearchResponse>('/search', { method: 'POST', body: JSON.stringify(data) }),
    similar: (data: FindSimilarRequest) =>
      this.request<FindSimilarResponse>('/search/similar', { method: 'POST', body: JSON.stringify(data) }),
  };
}
