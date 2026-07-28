import { StepResult } from '../types/agent.types';
import { getTraceLogger } from '../logging/logger';

export async function runPlannerStep(query: string, traceId: string, uncompressedContext: string): Promise<StepResult> {
  const log = getTraceLogger(traceId);
  const startTime = Date.now();
  const stepName = 'Planner';

  log.info({ stepName, queryLength: query.length, contextLength: uncompressedContext.length }, `[${stepName}] Starting execution...`);

  // Simulate heavy processing latency (e.g., 1000ms)
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const latencyMs = Date.now() - startTime;
  // Naively consumes ~25,000 input tokens from uncompressed context
  const tokensConsumed = 25000;
  const outputContext = `Plan created for query: "${query}". Steps: 1. Deep Research 2. Synthesis 3. Format`;

  log.info({ stepName, latencyMs, tokensConsumed }, `[${stepName}] Execution completed.`);

  return {
    stepName,
    latencyMs,
    tokensConsumed,
    outputContext,
  };
}
