import { useState } from 'react';
import type { AnalysisRequest, AnalysisResponse, AnalysisRun } from '../../core/types';
import { useNeuronContext } from './useNeuronContext';

export function useNeuronAnalysis() {
  const { api } = useNeuronContext();
  const [activeJobs, setActiveJobs] = useState<AnalysisRun[]>([]);
  const [jobHistory, setJobHistory] = useState<AnalysisRun[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentProgress, setCurrentProgress] = useState<number | null>(null);

  const startAnalysis = async (request: AnalysisRequest): Promise<AnalysisResponse> => {
    setIsRunning(true);
    const response = await api.analyze.start(request);
    setActiveJobs((prev) => [...prev, { ...(response as unknown as AnalysisRun) }]);
    return response;
  };

  const cancelJob = async (jobId: string) => {
    await api.analyze.cancel(jobId);
    setActiveJobs((prev) => prev.filter((job) => job.id !== jobId));
  };

  const getJobStatus = async (jobId: string) => {
    const response = await api.analyze.getStatus(jobId);
    setJobHistory((prev) => [...prev, response.job]);
    setIsRunning(false);
    setCurrentProgress(response.job.progress ?? null);
    return response.job;
  };

  return {
    activeJobs,
    jobHistory,
    startAnalysis,
    cancelJob,
    getJobStatus,
    isRunning,
    currentProgress,
  };
}
