/**
 * Strict TypeScript Interfaces for AI Agent Cost Debugger
 */

export interface PipelineRequest {
  query: string;
  traceId: string;
}

export interface StepResult {
  stepName: string;
  latencyMs: number;
  tokensConsumed: number;
  outputContext: string;
}

export interface PipelineResult {
  traceId: string;
  response: string;
  latencyMs: number;
  metrics: {
    inputTokens: number;
    outputTokens: number;
    estimatedCost: number;
  };
}

export interface AgentContext {
  query: string;
  traceId: string;
  rawUncompressedContext: string;
  previousStepOutputs: Record<string, string>;
}

export interface AgentResponse {
  stepName: string;
  output: string;
  tokensUsed: number;
  latencyMs: number;
}
