export interface MetricsData {
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
}

export interface PipelineExecutionResponse {
  traceId: string;
  response: string;
  latencyMs: number;
  metrics: MetricsData;
  error?: string;
  message?: string;
}

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
  metrics: MetricsData;
}

export interface PipelineRunHistoryItem extends PipelineExecutionResponse {
  timestamp: string;
  query: string;
  pipelineType: 'baseline' | 'optimized' | 'flaky';
  status: 'success' | 'failed';
}

export interface StepMetricChartItem {
  stepName: string;
  baselineTokens: number;
  optimizedTokens: number;
  baselineCost: number;
  optimizedCost: number;
  latencyMs: number;
}
