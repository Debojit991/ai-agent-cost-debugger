export interface StepTraceLog {
  stepName: string;
  attempt: number;
  status: 'PASSED' | 'FAILED' | 'RETRIED';
  latencyMs: number;
  error?: string;
  payload?: any;
}

export interface PipelineTraceTelemetry {
  traceId: string;
  query: string;
  timestamp: string;
  overallLatencyMs: number;
  status: 'SUCCESS' | 'FAILED';
  stepLogs: StepTraceLog[];
  metrics: {
    inputTokens: number;
    outputTokens: number;
    estimatedCost: number;
  };
}

/**
 * Global In-Memory Trace Store
 * Stores step execution telemetry across Baseline, Optimized, and Flaky pipelines.
 */
export const traceStore = new Map<string, PipelineTraceTelemetry>();
