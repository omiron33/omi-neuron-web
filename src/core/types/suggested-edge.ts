import type { EdgeEvidence, RelationshipType } from './edge';

export type SuggestedEdgeStatus = 'pending' | 'approved' | 'rejected';

export interface SuggestedEdge {
  id: string;
  scope: string;
  fromNodeId: string;
  toNodeId: string;
  relationshipType: RelationshipType;
  strength: number | null;
  confidence: number;
  reasoning: string | null;
  evidence: EdgeEvidence[];
  status: SuggestedEdgeStatus;
  sourceModel: string | null;
  analysisRunId: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  reviewReason: string | null;
  approvedEdgeId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SuggestedEdgeCreate {
  fromNodeId: string;
  toNodeId: string;
  relationshipType: RelationshipType;
  confidence: number;
  strength?: number;
  reasoning?: string;
  evidence?: EdgeEvidence[];
  sourceModel?: string;
  analysisRunId?: string;
}

export interface SuggestedEdgeListParams {
  status?: SuggestedEdgeStatus;
  relationshipType?: RelationshipType;
  minConfidence?: number;
  limit?: number;
  offset?: number;
}

