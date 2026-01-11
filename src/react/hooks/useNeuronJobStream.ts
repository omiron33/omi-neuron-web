import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AnalysisProgressSnapshot, AnalysisJobStatus } from '../../core/types';
import { createEvent } from '../../core/events/event-bus';
import { useNeuronContext } from './useNeuronContext';

export type UseNeuronJobStreamOptions = {
  jobId: string;
  enabled?: boolean;
  scope?: string;
  transport?: 'auto' | 'sse' | 'poll';
  pollIntervalMs?: number;
};

export type UseNeuronJobStreamResult = {
  status: AnalysisJobStatus | null;
  progress: number | null;
  stage?: string;
  snapshot: AnalysisProgressSnapshot | null;
  error: string | null;
  isStreaming: boolean;
  reconnect: () => void;
  stop: () => void;
};

const isTerminalStatus = (status: AnalysisJobStatus | null): boolean =>
  status === 'completed' || status === 'failed' || status === 'cancelled';

export function useNeuronJobStream(options: UseNeuronJobStreamOptions): UseNeuronJobStreamResult {
  const { api, config, events } = useNeuronContext();

  const [status, setStatus] = useState<AnalysisJobStatus | null>(null);
  const [snapshot, setSnapshot] = useState<AnalysisProgressSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const [stopped, setStopped] = useState(false);
  const [fallbackToPoll, setFallbackToPoll] = useState(false);
  const [nonce, setNonce] = useState(0);

  const stopRef = useRef<(() => void) | null>(null);
  const stoppedRef = useRef(false);
  stoppedRef.current = stopped;

  const enabled = (options.enabled ?? true) && !stopped;
  const pollIntervalMs = options.pollIntervalMs ?? 1500;

  const canUseEventSource = typeof window !== 'undefined' && typeof EventSource !== 'undefined';
  const desiredTransport = options.transport ?? 'auto';
  const effectiveTransport: 'sse' | 'poll' = useMemo(() => {
    if (desiredTransport === 'poll') return 'poll';
    if (desiredTransport === 'sse') return 'sse';
    if (fallbackToPoll) return 'poll';
    return canUseEventSource ? 'sse' : 'poll';
  }, [desiredTransport, fallbackToPoll, canUseEventSource]);

  const reconnect = useCallback(() => {
    setStopped(false);
    setFallbackToPoll(false);
    setError(null);
    setNonce((v) => v + 1);
  }, []);

  const stop = useCallback(() => {
    setStopped(true);
    stopRef.current?.();
    stopRef.current = null;
  }, []);

  useEffect(() => {
    stopRef.current?.();
    stopRef.current = null;

    if (!enabled || !options.jobId) {
      setIsStreaming(false);
      return;
    }

    if (effectiveTransport === 'poll') {
      setIsStreaming(false);

      const controller = new AbortController();
      stopRef.current = () => controller.abort();

      const tick = async () => {
        try {
          const response = await api.analyze.getStatus(options.jobId);
          const progressSnapshot = (response.progress ?? null) as AnalysisProgressSnapshot | null;

          if (progressSnapshot) {
            setSnapshot(progressSnapshot);
            setStatus(response.job.status ?? 'running');
            events.emit(createEvent('analysis.job.progress', { ...progressSnapshot, jobId: response.job.id, scope: progressSnapshot.scope }, 'api'));
          }

          if (isTerminalStatus(response.job.status ?? null)) {
            setStatus(response.job.status);
            return;
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
        }
      };

      void tick();
      const interval = setInterval(() => {
        if (controller.signal.aborted) return;
        void tick();
      }, pollIntervalMs);

      return () => {
        clearInterval(interval);
        controller.abort();
      };
    }

    // SSE
    setIsStreaming(true);
    setError(null);

    const basePath = config.api.basePath;
    const scope = options.scope ?? null;
    const streamUrl = new URL(`${basePath}/analyze/${options.jobId}/stream`, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    if (scope) {
      streamUrl.searchParams.set('scope', scope);
    }

    const es = new EventSource(streamUrl.toString());

    const safeJson = (value: string): unknown => {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    };

    const handleProgress = (event: MessageEvent) => {
      const payload = safeJson(event.data) as Partial<AnalysisProgressSnapshot> & { jobId?: string; scope?: string };
      const nextSnapshot: AnalysisProgressSnapshot | null =
        payload && typeof payload === 'object' ? (payload as AnalysisProgressSnapshot) : null;
      if (nextSnapshot) {
        setSnapshot(nextSnapshot);
        setStatus('running');
        events.emit(createEvent('analysis.job.progress', payload, 'api'));
      }
    };

    const handleCompleted = (eventType: 'analysis.job.completed' | 'analysis.job.failed' | 'analysis.job.canceled') => (event: MessageEvent) => {
      const payload = safeJson(event.data) as { error?: string };
      if (eventType === 'analysis.job.failed') {
        setStatus('failed');
        const maybeError = payload && typeof payload === 'object' && 'error' in payload ? (payload as { error?: unknown }).error : undefined;
        setError(typeof maybeError === 'string' ? maybeError : 'Job failed');
      } else if (eventType === 'analysis.job.canceled') {
        setStatus('cancelled');
      } else {
        setStatus('completed');
      }
      events.emit(createEvent(eventType, payload, 'api'));
      es.close();
      setIsStreaming(false);
    };

    es.addEventListener('analysis.job.progress', handleProgress as EventListener);
    es.addEventListener('analysis.job.completed', handleCompleted('analysis.job.completed') as EventListener);
    es.addEventListener('analysis.job.failed', handleCompleted('analysis.job.failed') as EventListener);
    es.addEventListener('analysis.job.canceled', handleCompleted('analysis.job.canceled') as EventListener);

    es.onerror = () => {
      es.close();
      setIsStreaming(false);
      if (desiredTransport === 'auto' && !stoppedRef.current) {
        setFallbackToPoll(true);
      } else {
        setError('SSE connection error');
      }
    };

    stopRef.current = () => {
      es.close();
      setIsStreaming(false);
    };

    return () => {
      es.close();
      setIsStreaming(false);
    };
  }, [api, config.api.basePath, effectiveTransport, enabled, events, nonce, options.jobId, options.scope, desiredTransport, pollIntervalMs]);

  const progress = snapshot ? (typeof snapshot.overallProgress === 'number' ? snapshot.overallProgress : snapshot.progress) : null;

  return {
    status,
    progress,
    stage: snapshot?.stage,
    snapshot,
    error,
    isStreaming,
    reconnect,
    stop,
  };
}
